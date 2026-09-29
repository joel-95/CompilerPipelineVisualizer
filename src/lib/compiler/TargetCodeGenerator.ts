// Target Code Generator (x86-64 pseudo-assembly)
// Converts optimized TAC to register-allocated assembly instructions.
import { TACInstruction, AsmInstruction } from './types';

let _asmId = 0;
function asmId(): string { return `asm-${++_asmId}`; }

const GP_REGS = ['rax', 'rbx', 'rcx', 'rdx', 'r8', 'r9', 'r10', 'r11'];

export class TargetCodeGenerator {
  private output: AsmInstruction[] = [];
  private regMap   = new Map<string, string>(); // name/temp → register
  private stackMap = new Map<string, number>();  // name/temp → rbp offset
  private stackOffset = 0;
  private addrCounter = 0;

  private nextAddr(): string {
    const hex = this.addrCounter.toString(16).padStart(4, '0');
    this.addrCounter += 4;
    return `0x${hex}`;
  }

  private allocReg(name: string): string {
    // Re-use if already allocated
    if (this.regMap.has(name)) return this.regMap.get(name)!;

    // Find a free GP register
    const usedRegs = new Set(this.regMap.values());
    for (const r of GP_REGS) {
      if (!usedRegs.has(r)) {
        this.regMap.set(name, r);
        return r;
      }
    }
    // Spill: evict the oldest allocation
    const [evictName] = this.regMap.entries().next().value as [string, string];
    const evictReg = this.regMap.get(evictName)!;
    this.spill(evictName, evictReg);
    this.regMap.delete(evictName);
    this.regMap.set(name, evictReg);
    return evictReg;
  }

  private spill(name: string, reg: string): void {
    if (!this.stackMap.has(name)) {
      this.stackOffset -= 8;
      this.stackMap.set(name, this.stackOffset);
    }
    const offset = this.stackMap.get(name)!;
    this.emit('mov', `[rbp${offset}]`, reg, `spill ${name}`);
  }

  private load(name: string): string {
    if (this.regMap.has(name)) return this.regMap.get(name)!;
    // If spilled, reload
    if (this.stackMap.has(name)) {
      const reg = this.allocReg(name);
      const offset = this.stackMap.get(name)!;
      this.emit('mov', reg, `[rbp${offset}]`, `reload ${name}`);
      return reg;
    }
    // Immediate constant or unknown — treat as literal
    return name;
  }

  private emit(opcode: string, dest: string, src?: string, comment?: string): void {
    const operands = src !== undefined ? `${dest}, ${src}` : dest;
    this.output.push({
      id: asmId(),
      address: this.nextAddr(),
      opcode,
      operands,
      comment,
    });
  }

  private emitLabel(name: string): void {
    this.output.push({
      id: asmId(),
      address: this.nextAddr(),
      opcode: '',
      operands: '',
      isLabel: true,
      labelName: name,
    });
  }

  public generate(instructions: TACInstruction[]): AsmInstruction[] {
    _asmId = 0;
    this.output = [];
    this.regMap = new Map();
    this.stackMap = new Map();
    this.stackOffset = 0;
    this.addrCounter = 0;

    // Prologue
    this.emit('push', 'rbp', undefined, 'save frame pointer');
    this.emit('mov', 'rbp', 'rsp', 'set up stack frame');

    for (const instr of instructions) {
      this.genInstr(instr);
    }

    // Epilogue
    this.emit('mov', 'rsp', 'rbp', 'restore stack pointer');
    this.emit('pop', 'rbp', undefined, 'restore frame pointer');
    this.emit('ret', '', undefined, 'return to caller');

    return this.output;
  }

  private genInstr(i: TACInstruction): void {
    switch (i.kind) {
      case 'label':
        this.emitLabel(i.label!);
        break;

      case 'assign':
      case 'copy': {
        const dest = this.allocReg(i.result!);
        const srcIsNum = i.arg1 && /^-?\d+(\.\d+)?$/.test(i.arg1);
        if (srcIsNum) {
          this.emit('mov', dest, i.arg1!, `${i.result} = ${i.arg1}`);
        } else {
          const src = this.load(i.arg1!);
          this.emit('mov', dest, src, `${i.result} = ${i.arg1}`);
        }
        break;
      }

      case 'binary': {
        const leftReg  = this.load(i.arg1!);
        const rightReg = this.load(i.arg2!);
        const dest     = this.allocReg(i.result!);

        // Move left into dest (rax preferred for mul/div)
        if (dest !== leftReg) {
          this.emit('mov', dest, leftReg, `load ${i.arg1}`);
        }

        const comment = `${i.result} = ${i.arg1} ${i.op} ${i.arg2}`;

        switch (i.op) {
          case '+': this.emit('add', dest, rightReg, comment); break;
          case '-': this.emit('sub', dest, rightReg, comment); break;
          case '*': this.emit('imul', dest, rightReg, comment); break;
          case '/':
            // idiv requires rax:rdx setup
            if (dest !== 'rax') this.emit('mov', 'rax', dest, 'idiv: set rax');
            this.emit('cqo', '', undefined, 'sign-extend rax into rdx:rax');
            this.emit('idiv', rightReg, undefined, comment);
            if (dest !== 'rax') this.emit('mov', dest, 'rax', 'move quotient');
            break;
          case '<':  this.emitRelational(dest, rightReg, 'setl',  comment); break;
          case '>':  this.emitRelational(dest, rightReg, 'setg',  comment); break;
          case '<=': this.emitRelational(dest, rightReg, 'setle', comment); break;
          case '>=': this.emitRelational(dest, rightReg, 'setge', comment); break;
          case '==': this.emitRelational(dest, rightReg, 'sete',  comment); break;
          case '!=': this.emitRelational(dest, rightReg, 'setne', comment); break;
          default:   this.emit('add', dest, rightReg, comment);
        }
        break;
      }

      case 'unary': {
        const argReg = this.load(i.arg1!);
        const dest   = this.allocReg(i.result!);
        if (dest !== argReg) this.emit('mov', dest, argReg, `load ${i.arg1}`);
        if (i.op === '-') {
          this.emit('neg', dest, undefined, `${i.result} = -${i.arg1}`);
        } else if (i.op === '!') {
          this.emit('test', dest, dest, 'test for zero');
          this.emit('sete', `${dest}b`, undefined, 'set byte if zero');
          this.emit('movzx', dest, `${dest}b`, 'zero-extend');
        }
        break;
      }

      case 'jump':
        this.emit('jmp', i.label!, undefined, `goto ${i.label}`);
        break;

      case 'cjump': {
        const cond = this.load(i.arg1!);
        this.emit('test', cond, cond, `if ${i.arg1}`);
        this.emit('jnz', i.label!, undefined, `goto ${i.label} if true`);
        break;
      }

      case 'param':
        // Push args right-to-left (simplified: just push)
        if (i.arg1) {
          const v = this.load(i.arg1);
          this.emit('push', v, undefined, `arg: ${i.arg1}`);
        }
        break;

      case 'call': {
        this.emit('call', i.arg1!, undefined, `call ${i.arg1}(${i.nArgs} args)`);
        if (i.nArgs && i.nArgs > 0) {
          this.emit('add', 'rsp', `${i.nArgs * 8}`, 'clean up args');
        }
        if (i.result) {
          const dest = this.allocReg(i.result);
          if (dest !== 'rax') {
            this.emit('mov', dest, 'rax', `capture return value → ${i.result}`);
          }
        }
        break;
      }

      case 'return':
        if (i.arg1) {
          const retReg = this.load(i.arg1);
          if (retReg !== 'rax') {
            this.emit('mov', 'rax', retReg, `return ${i.arg1}`);
          }
        }
        this.emit('jmp', 'epilogue', undefined, 'jump to function epilogue');
        break;

      default:
        break;
    }
  }

  private emitRelational(dest: string, src: string, setOp: string, comment: string): void {
    this.emit('cmp', dest, src, comment);
    this.emit(setOp, `${dest}b`, undefined, 'set result byte');
    this.emit('movzx', dest, `${dest}b`, 'zero-extend to 64-bit');
  }
}
