// Virtual Machine Execution Simulator for Step-by-Step Interactive Debugging
import { TACInstruction, SimulationStep, AsmInstruction, RegisterAllocationResult } from './types';
import { IRGenerator } from './IRGenerator';

export class VirtualSimulator {
  /**
   * Generates step-by-step execution trace of TAC instructions
   */
  public static simulate(
    tac: TACInstruction[],
    regAlloc?: RegisterAllocationResult,
    maxSteps = 100
  ): SimulationStep[] {
    const steps: SimulationStep[] = [];
    const registers: Record<string, number | string | boolean> = {
      rax: 0,
      rbx: 0,
      rcx: 0,
      rdx: 0,
      rsi: 0,
      rdi: 0,
      r8: 0,
      r9: 0,
      r10: 0,
      r11: 0,
    };
    const memory: Record<string, any> = {};
    const stack: { offset: number; name?: string; value: any }[] = [];
    const output: string[] = [];

    // Map labels to instruction indices
    const labelMap = new Map<string, number>();
    tac.forEach((instr, idx) => {
      if (instr.kind === 'label' && instr.label) {
        labelMap.set(instr.label, idx);
      }
    });

    let pc = 0;
    let stepCount = 0;

    while (pc >= 0 && pc < tac.length && stepCount < maxSteps) {
      const instr = tac[pc];
      const instrText = IRGenerator.format(instr);

      const resolveVal = (arg?: string): any => {
        if (!arg) return 0;
        if (/^-?\d+(\.\d+)?$/.test(arg)) return parseFloat(arg);
        if (arg === 'true') return true;
        if (arg === 'false') return false;
        if (arg.startsWith('"') && arg.endsWith('"')) return arg.slice(1, -1);
        if (memory[arg] !== undefined) return memory[arg];
        // Check register
        if (regAlloc?.allocations[arg] && registers[regAlloc.allocations[arg]] !== undefined) {
          return registers[regAlloc.allocations[arg]];
        }
        return 0;
      };

      const setVal = (target?: string, val?: any) => {
        if (!target) return;
        memory[target] = val;
        if (regAlloc?.allocations[target]) {
          const reg = regAlloc.allocations[target];
          registers[reg] = val;
        } else if (regAlloc?.spillOffsets[target] !== undefined) {
          const offset = regAlloc.spillOffsets[target];
          const existing = stack.find((s) => s.offset === offset);
          if (existing) {
            existing.value = val;
          } else {
            stack.push({ offset, name: target, value: val });
          }
        }
      };

      let nextPc = pc + 1;

      switch (instr.kind) {
        case 'assign':
        case 'copy': {
          const val = resolveVal(instr.arg1);
          setVal(instr.result, val);
          break;
        }
        case 'binary': {
          const left = resolveVal(instr.arg1);
          const right = resolveVal(instr.arg2);
          let res: any = 0;
          switch (instr.op) {
            case '+': res = left + right; break;
            case '-': res = left - right; break;
            case '*': res = left * right; break;
            case '/': res = right !== 0 ? Math.floor(left / right) : 0; break;
            case '%': res = right !== 0 ? left % right : 0; break;
            case '<': res = left < right; break;
            case '>': res = left > right; break;
            case '<=': res = left <= right; break;
            case '>=': res = left >= right; break;
            case '==': res = left === right; break;
            case '!=': res = left !== right; break;
            default: res = left + right;
          }
          setVal(instr.result, res);
          break;
        }
        case 'unary': {
          const val = resolveVal(instr.arg1);
          const res = instr.op === '-' ? -val : instr.op === '!' ? !val : val;
          setVal(instr.result, res);
          break;
        }
        case 'jump': {
          if (instr.label && labelMap.has(instr.label)) {
            nextPc = labelMap.get(instr.label)!;
          }
          break;
        }
        case 'cjump': {
          const cond = resolveVal(instr.arg1);
          if (cond && instr.label && labelMap.has(instr.label)) {
            nextPc = labelMap.get(instr.label)!;
          }
          break;
        }
        case 'call': {
          if (instr.arg1 === 'printf') {
            output.push(`[stdout] ${resolveVal(instr.arg1)}`);
          }
          setVal(instr.result, 0);
          break;
        }
        case 'return': {
          if (instr.arg1) {
            registers.rax = resolveVal(instr.arg1);
          }
          nextPc = tac.length; // Halt
          break;
        }
        default:
          break;
      }

      steps.push({
        step: stepCount + 1,
        instructionIndex: pc,
        instructionText: instrText,
        sourceLineRef: instr.sourceLineRef,
        registers: { ...registers },
        memory: { ...memory },
        stack: stack.map((s) => ({ ...s })),
        output: [...output],
      });

      pc = nextPc;
      stepCount++;
    }

    return steps;
  }
}
