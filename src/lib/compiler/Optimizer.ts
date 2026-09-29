// TAC Optimizer
// Runs classical dataflow optimizations over the TAC instruction list.
import { TACInstruction, OptimizationRecord, OptimizationKind } from './types';

let _optId = 0;
function optId(): string { return `opt-${++_optId}`; }

function tacToString(i: TACInstruction): string {
  switch (i.kind) {
    case 'binary':  return `${i.result} = ${i.arg1} ${i.op} ${i.arg2}`;
    case 'unary':   return `${i.result} = ${i.op}${i.arg1}`;
    case 'assign':
    case 'copy':    return `${i.result} = ${i.arg1}`;
    case 'label':   return `${i.label}:`;
    case 'jump':    return `goto ${i.label}`;
    case 'cjump':   return `if ${i.arg1} goto ${i.label}`;
    case 'param':   return `param ${i.arg1}`;
    case 'call':    return `${i.result} = call ${i.arg1}, ${i.nArgs}`;
    case 'return':  return `return${i.arg1 ? ' ' + i.arg1 : ''}`;
    default:        return 'nop';
  }
}

function isNumeric(s: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(s);
}

function foldBinary(a: number, op: string, b: number): number | null {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b !== 0 ? Math.floor(a / b) : null;
    case '<': return a < b  ? 1 : 0;
    case '>': return a > b  ? 1 : 0;
    case '<=': return a <= b ? 1 : 0;
    case '>=': return a >= b ? 1 : 0;
    case '==': return a === b ? 1 : 0;
    case '!=': return a !== b ? 1 : 0;
    default: return null;
  }
}

export interface OptimizationResult {
  optimized: TACInstruction[];
  records: OptimizationRecord[];
}

export class Optimizer {
  public optimize(instructions: TACInstruction[]): OptimizationResult {
    _optId = 0;
    let current = instructions.map(i => ({ ...i })); // deep copy
    const records: OptimizationRecord[] = [];

    // Run passes until stable (max 5 iterations)
    for (let pass = 0; pass < 5; pass++) {
      const before = current.length;
      current = this.constantFolding(current, records);
      current = this.constantPropagation(current, records);
      current = this.copyPropagation(current, records);
      current = this.deadCodeElimination(current, records);
      if (current.length === before) break; // stable
    }

    return { optimized: current, records };
  }

  // ── Pass 1: Constant Folding ──────────────────────────────────────────────
  // binary result = 2 + 3  →  result = 5
  private constantFolding(instrs: TACInstruction[], records: OptimizationRecord[]): TACInstruction[] {
    return instrs.map(i => {
      if (i.kind === 'binary' && i.arg1 && i.arg2 && i.op && isNumeric(i.arg1) && isNumeric(i.arg2)) {
        const folded = foldBinary(parseFloat(i.arg1), i.op, parseFloat(i.arg2));
        if (folded !== null) {
          const before = tacToString(i);
          const newInstr: TACInstruction = { ...i, kind: 'assign', arg1: String(folded), arg2: undefined, op: undefined };
          records.push({ id: optId(), kind: 'constant-folding', description: `Folded compile-time constant expression`, before, after: tacToString(newInstr) });
          return newInstr;
        }
      }
      return i;
    });
  }

  // ── Pass 2: Constant Propagation ─────────────────────────────────────────
  // After t0 = 5, replace all uses of t0 with 5
  private constantPropagation(instrs: TACInstruction[], records: OptimizationRecord[]): TACInstruction[] {
    const constMap = new Map<string, string>();

    return instrs.map(i => {
      let changed = false;
      const before = tacToString(i);
      let result = { ...i };

      // Substitute known constants into operands
      if (result.arg1 && constMap.has(result.arg1)) {
        result = { ...result, arg1: constMap.get(result.arg1)! };
        changed = true;
      }
      if (result.arg2 && constMap.has(result.arg2)) {
        result = { ...result, arg2: constMap.get(result.arg2)! };
        changed = true;
      }

      // Track new constant definitions
      if ((result.kind === 'assign' || result.kind === 'copy') && result.result && result.arg1 && isNumeric(result.arg1)) {
        constMap.set(result.result, result.arg1);
      }
      // Invalidate if variable reassigned to non-const
      if (result.result && constMap.has(result.result) && !(result.arg1 && isNumeric(result.arg1))) {
        if (result.kind !== 'assign' && result.kind !== 'copy') {
          constMap.delete(result.result);
        }
      }

      if (changed) {
        records.push({ id: optId(), kind: 'constant-propagation', description: `Propagated constant value into operand`, before, after: tacToString(result) });
      }
      return result;
    });
  }

  // ── Pass 3: Copy Propagation ─────────────────────────────────────────────
  // After t1 = x, replace uses of t1 with x
  private copyPropagation(instrs: TACInstruction[], records: OptimizationRecord[]): TACInstruction[] {
    const copyMap = new Map<string, string>();

    return instrs.map(i => {
      let changed = false;
      const before = tacToString(i);
      let result = { ...i };

      const resolve = (v: string): string => {
        let cur = v;
        const seen = new Set<string>();
        while (copyMap.has(cur) && !seen.has(cur)) {
          seen.add(cur);
          cur = copyMap.get(cur)!;
        }
        return cur;
      };

      if (result.arg1) { const r = resolve(result.arg1); if (r !== result.arg1) { result = { ...result, arg1: r }; changed = true; } }
      if (result.arg2) { const r = resolve(result.arg2); if (r !== result.arg2) { result = { ...result, arg2: r }; changed = true; } }

      // Track copy assignments
      if ((result.kind === 'assign' || result.kind === 'copy') && result.result && result.arg1 && !isNumeric(result.arg1)) {
        copyMap.set(result.result, result.arg1);
      }
      // Invalidate if target reassigned
      if (result.result) {
        copyMap.delete(result.result);
      }

      if (changed) {
        records.push({ id: optId(), kind: 'copy-propagation', description: `Replaced redundant copy with original variable`, before, after: tacToString(result) });
      }
      return result;
    });
  }

  // ── Pass 4: Dead Code Elimination ────────────────────────────────────────
  // Remove instructions that write to temporaries never read anywhere
  private deadCodeElimination(instrs: TACInstruction[], records: OptimizationRecord[]): TACInstruction[] {
    // Collect all read uses
    const used = new Set<string>();
    for (const i of instrs) {
      if (i.arg1) used.add(i.arg1);
      if (i.arg2) used.add(i.arg2);
      if (i.label) used.add(i.label);
    }

    // Collect all jump targets to protect labels
    const jumpTargets = new Set<string>();
    for (const i of instrs) {
      if ((i.kind === 'jump' || i.kind === 'cjump') && i.label) {
        jumpTargets.add(i.label);
      }
    }

    return instrs.filter(i => {
      // Keep all non-result-producing instructions
      if (!i.result) return true;
      // Keep if result is a named variable (not a temp)
      if (!i.result.startsWith('t') || !/^\d+$/.test(i.result.slice(1))) return true;
      // Keep if the temp is actually used somewhere
      if (used.has(i.result)) return true;
      // Dead temporary — eliminate
      records.push({
        id: optId(),
        kind: 'dead-code-elimination',
        description: `Removed unused temporary "${i.result}"`,
        before: tacToString(i),
        after: 'removed',
      });
      return false;
    });
  }
}
