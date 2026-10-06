// Target Code Generator (x86-64 pseudo-assembly) (Ebin & Kevin)
// Uses Register Allocation result to emit register-allocated x86-64 assembly instructions.
import { TACInstruction, AsmInstruction, RegisterAllocationResult } from './types';
import { RegisterAllocator } from './RegisterAllocator';

let _asmId = 0;
function asmId(): string {
  return `asm-${++_asmId}`;
}

export class TargetCodeGenerator {
  private output: AsmInstruction[] = [];
  private addrCounter = 0;

  private nextAddr(): string {
    const hex = this.addrCounter.toString(16).padStart(4, '0');
    this.addrCounter += 4;
    return `0x${hex}`;
  }

  private emit(opcode: string, dest: string, src?: string, comment?: string): void {
    const operands = src !== undefined && src !== '' ? `${dest}, ${src}` : dest;
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

  public generate(
    instructions: TACInstruction[],
    regAllocation?: RegisterAllocationResult
  ): AsmInstruction[] {
    _asmId = 0;
    this.output = [];
    this.addrCounter = 0;

    // Use passed allocation or run register allocator
    const allocator = new RegisterAllocator();
    const allocation = regAllocation || allocator.allocate(instructions);
    const { allocations, spills, spillOffsets } = allocation;

    const resolveOperand = (val?: string): string => {
      if (!val) return '';
      if (/^-?\d+(\.\d+)?$/.test(val)) return val; // Immediate constant
      if (allocations[val]) return allocations[val]; // Hardware register
      if (spillOffsets[val] !== undefined) return `[rbp${spillOffsets[val]}]`; // Spilled stack
      return val;
    };

    // Assembly Prologue
    this.emit('push', 'rbp', undefined, 'save base pointer');
    this.emit('mov', 'rbp', 'rsp', 'establish new stack frame');

    // Calculate stack allocation size for spilled variables
    const spillSize = spills.length > 0 ? spills.length * 8 : 16;
    this.emit('sub', 'rsp', `${spillSize}`, 'reserve stack space');

    for (const instr of instructions) {
      this.genInstruction(instr, resolveOperand, allocations);
    }

    // Assembly Epilogue
    this.emitLabel('epilogue');
    this.emit('mov', 'rsp', 'rbp', 'restore stack pointer');
    this.emit('pop', 'rbp', undefined, 'restore base pointer');
    this.emit('ret', '', undefined, 'return to caller');

    return this.output;
  }

  private genInstruction(
    i: TACInstruction,
    resolve: (val?: string) => string,
    allocations: Record<string, string>
  ): void {
    switch (i.kind) {
      case 'label':
        this.emitLabel(i.label!);
        break;

      case 'assign':
      case 'copy': {
        const dest = resolve(i.result);
        const src = resolve(i.arg1);
        if (dest !== src) {
          this.emit('mov', dest, src, `${i.result} = ${i.arg1}`);
        }
        break;
      }

      case 'binary': {
        const dest = resolve(i.result);
        const left = resolve(i.arg1);
        const right = resolve(i.arg2);

        if (dest !== left) {
          this.emit('mov', dest, left, `load ${i.arg1}`);
        }

        const comment = `${i.result} = ${i.arg1} ${i.op} ${i.arg2}`;

        switch (i.op) {
          case '+': this.emit('add', dest, right, comment); break;
          case '-': this.emit('sub', dest, right, comment); break;
          case '*': this.emit('imul', dest, right, comment); break;
          case '/':
            if (dest !== 'rax') this.emit('mov', 'rax', dest, 'idiv prep');
            this.emit('cqo', '', undefined, 'sign extend rax');
            this.emit('idiv', right, undefined, comment);
            if (dest !== 'rax') this.emit('mov', dest, 'rax', 'store quotient');
            break;
          case '%':
            if (dest !== 'rax') this.emit('mov', 'rax', dest, 'idiv prep');
            this.emit('cqo', '', undefined, 'sign extend rax');
            this.emit('idiv', right, undefined, comment);
            if (dest !== 'rdx') this.emit('mov', dest, 'rdx', 'store remainder');
            break;
          case '<':  this.emitRelational(dest, right, 'setl',  comment); break;
          case '>':  this.emitRelational(dest, right, 'setg',  comment); break;
          case '<=': this.emitRelational(dest, right, 'setle', comment); break;
          case '>=': this.emitRelational(dest, right, 'setge', comment); break;
          case '==': this.emitRelational(dest, right, 'sete',  comment); break;
          case '!=': this.emitRelational(dest, right, 'setne', comment); break;
          default:   this.emit('add', dest, right, comment);
        }
        break;
      }

      case 'unary': {
        const dest = resolve(i.result);
        const arg = resolve(i.arg1);
        if (dest !== arg) this.emit('mov', dest, arg, `load ${i.arg1}`);
        if (i.op === '-') {
          this.emit('neg', dest, undefined, `${i.result} = -${i.arg1}`);
        } else if (i.op === '!') {
          this.emit('test', dest, dest, 'test for zero');
          this.emit('sete', 'al', undefined, 'set al if zero');
          this.emit('movzx', dest, 'al', 'zero extend');
        }
        break;
      }

      case 'jump':
        this.emit('jmp', i.label!, undefined, `goto ${i.label}`);
        break;

      case 'cjump': {
        const cond = resolve(i.arg1);
        this.emit('cmp', cond, '0', `check condition ${i.arg1}`);
        this.emit('jne', i.label!, undefined, `jump if true to ${i.label}`);
        break;
      }

      case 'param':
        if (i.arg1) {
          const val = resolve(i.arg1);
          this.emit('push', val, undefined, `push argument: ${i.arg1}`);
        }
        break;

      case 'call':
        this.emit('call', i.arg1!, undefined, `call ${i.arg1}`);
        if (i.nArgs && i.nArgs > 0) {
          this.emit('add', 'rsp', `${i.nArgs * 8}`, 'clean stack args');
        }
        if (i.result) {
          const dest = resolve(i.result);
          if (dest !== 'rax') {
            this.emit('mov', dest, 'rax', `capture return value in ${i.result}`);
          }
        }
        break;

      case 'return':
        if (i.arg1) {
          const retVal = resolve(i.arg1);
          if (retVal !== 'rax') {
            this.emit('mov', 'rax', retVal, `return ${i.arg1}`);
          }
        }
        this.emit('jmp', 'epilogue', undefined, 'jump to epilogue');
        break;

      default:
        break;
    }
  }

  private emitRelational(dest: string, src: string, setOp: string, comment: string): void {
    this.emit('cmp', dest, src, comment);
    this.emit(setOp, 'al', undefined, 'set condition flag byte');
    this.emit('movzx', dest, 'al', 'zero-extend result');
  }
}
