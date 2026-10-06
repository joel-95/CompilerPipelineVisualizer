// TAC Optimizer (Ebin - Backend)
// Runs Constant Folding, Constant Propagation, Copy Propagation, CSE, and Dead Code Elimination.
import { TACInstruction, OptimizationRecord } from './types';
import { IRGenerator } from './IRGenerator';

let _optId = 0;
function optId(): string {
  return `opt-${++_optId}`;
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
    case '%': return b !== 0 ? a % b : null;
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
  reductionPercent: number;
}

export class Optimizer {
  public optimize(instructions: TACInstruction[]): OptimizationResult {
    _optId = 0;
    let current = instructions.map((i) => ({ ...i }));
    const records: OptimizationRecord[] = [];
    const initialCount = instructions.length;

    // Run passes until stable (up to 6 iterations)
    for (let pass = 0; pass < 6; pass++) {
      const beforeCount = current.length;
      current = this.constantFolding(current, records);
      current = this.constantPropagation(current, records);
      current = this.copyPropagation(current, records);
      current = this.commonSubexpressionElimination(current, records);
      current = this.deadCodeElimination(current, records);

      if (current.length === beforeCount && records.length > 0 && pass > 1) {
        break; // Fixed point achieved
      }
    }

    const reductionPercent = initialCount > 0
      ? Number((((initialCount - current.length) / initialCount) * 100).toFixed(1))
      : 0;

    return {
      optimized: current,
      records,
      reductionPercent: Math.max(0, reductionPercent),
    };
  }

  // ── Pass 1: Constant Folding ──────────────────────────────────────────────
  private constantFolding(instrs: TACInstruction[], records: OptimizationRecord[]): TACInstruction[] {
    return instrs.map((i) => {
      if (i.kind === 'binary' && i.arg1 && i.arg2 && i.op && isNumeric(i.arg1) && isNumeric(i.arg2)) {
        const folded = foldBinary(parseFloat(i.arg1), i.op, parseFloat(i.arg2));
        if (folded !== null) {
          const before = IRGenerator.format(i);
          const newInstr: TACInstruction = {
            ...i,
            kind: 'assign',
            arg1: String(folded),
            arg2: undefined,
            op: undefined,
          };
          records.push({
            id: optId(),
            kind: 'constant-folding',
            description: `Folded constant expression: ${i.arg1} ${i.op} ${i.arg2} → ${folded}`,
            before,
            after: IRGenerator.format(newInstr),
          });
          return newInstr;
        }
      }
      return i;
    });
  }

  // ── Pass 2: Constant Propagation ─────────────────────────────────────────
  private constantPropagation(instrs: TACInstruction[], records: OptimizationRecord[]): TACInstruction[] {
    const constMap = new Map<string, string>();

    return instrs.map((i) => {
      let changed = false;
      const before = IRGenerator.format(i);
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
      } else if (result.result && constMap.has(result.result)) {
        constMap.delete(result.result);
      }

      if (changed) {
        records.push({
          id: optId(),
          kind: 'constant-propagation',
          description: `Propagated constant value into expression`,
          before,
          after: IRGenerator.format(result),
        });
      }
      return result;
    });
  }

  // ── Pass 3: Copy Propagation ─────────────────────────────────────────────
  private copyPropagation(instrs: TACInstruction[], records: OptimizationRecord[]): TACInstruction[] {
    const copyMap = new Map<string, string>();

    return instrs.map((i) => {
      let changed = false;
      const before = IRGenerator.format(i);
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

      if (result.arg1) {
        const r = resolve(result.arg1);
        if (r !== result.arg1) {
          result = { ...result, arg1: r };
          changed = true;
        }
      }
      if (result.arg2) {
        const r = resolve(result.arg2);
        if (r !== result.arg2) {
          result = { ...result, arg2: r };
          changed = true;
        }
      }

      // Track copy assignments
      if ((result.kind === 'assign' || result.kind === 'copy') && result.result && result.arg1 && !isNumeric(result.arg1)) {
        copyMap.set(result.result, result.arg1);
      } else if (result.result) {
        copyMap.delete(result.result);
      }

      if (changed) {
        records.push({
          id: optId(),
          kind: 'copy-propagation',
          description: `Propagated copied variable alias`,
          before,
          after: IRGenerator.format(result),
        });
      }
      return result;
    });
  }

  // ── Pass 4: Common Subexpression Elimination (CSE) ────────────────────────
  private commonSubexpressionElimination(instrs: TACInstruction[], records: OptimizationRecord[]): TACInstruction[] {
    const exprMap = new Map<string, string>(); // "arg1 op arg2" -> temp/variable

    return instrs.map((i) => {
      if (i.kind === 'label' || i.kind === 'jump' || i.kind === 'cjump') {
        exprMap.clear(); // Clear across basic block boundaries
        return i;
      }

      if (i.kind === 'binary' && i.result && i.arg1 && i.arg2 && i.op) {
        const exprKey = `${i.arg1} ${i.op} ${i.arg2}`;
        if (exprMap.has(exprKey)) {
          const prevTarget = exprMap.get(exprKey)!;
          const before = IRGenerator.format(i);
          const newInstr: TACInstruction = {
            ...i,
            kind: 'copy',
            arg1: prevTarget,
            arg2: undefined,
            op: undefined,
          };
          records.push({
            id: optId(),
            kind: 'common-subexpression-elimination',
            description: `Eliminated common subexpression: reused ${prevTarget} for ${exprKey}`,
            before,
            after: IRGenerator.format(newInstr),
          });
          return newInstr;
        } else {
          exprMap.set(exprKey, i.result);
        }
      }

      // Invalidate expressions when operands are overwritten
      if (i.result) {
        Array.from(exprMap.keys()).forEach((key) => {
          const [left, , right] = key.split(' ');
          if (left === i.result || right === i.result) {
            exprMap.delete(key);
          }
        });
      }

      return i;
    });
  }

  // ── Pass 5: Dead Code Elimination ────────────────────────────────────────
  private deadCodeElimination(instrs: TACInstruction[], records: OptimizationRecord[]): TACInstruction[] {
    const used = new Set<string>();
    for (const i of instrs) {
      if (i.arg1) used.add(i.arg1);
      if (i.arg2) used.add(i.arg2);
      if (i.label) used.add(i.label);
    }

    return instrs.filter((i) => {
      if (!i.result) return true;
      // Keep user named variables, only prune dead temporary variables (e.g. t0, t1)
      if (!i.result.startsWith('t') || !/^\d+$/.test(i.result.slice(1))) return true;
      if (used.has(i.result)) return true;

      records.push({
        id: optId(),
        kind: 'dead-code-elimination',
        description: `Eliminated dead temporary variable: ${i.result}`,
        before: IRGenerator.format(i),
        after: 'removed',
      });
      return false;
    });
  }
}
