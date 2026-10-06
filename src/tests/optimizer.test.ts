import { describe, it, expect } from 'vitest';
import { Optimizer } from '../lib/compiler/Optimizer';
import { TACInstruction } from '../lib/compiler/types';

describe('Optimizer (Ebin - Backend Lead)', () => {
  it('9. Performs constant folding on literal arithmetic expressions', () => {
    const optimizer = new Optimizer();
    const instrs: TACInstruction[] = [
      { id: '1', kind: 'binary', result: 't0', arg1: '3', op: '+', arg2: '4' },
      { id: '2', kind: 'assign', result: 'x', arg1: 't0' },
    ];

    const result = optimizer.optimize(instrs);

    expect(result.records.some((r) => r.kind === 'constant-folding')).toBe(true);
    expect(result.optimized.some((i) => i.arg1 === '7')).toBe(true);
  });

  it('10. Propagates constants to subsequent instructions', () => {
    const optimizer = new Optimizer();
    const instrs: TACInstruction[] = [
      { id: '1', kind: 'assign', result: 't0', arg1: '10' },
      { id: '2', kind: 'binary', result: 't1', arg1: 't0', op: '+', arg2: '5' },
      { id: '3', kind: 'assign', result: 'res', arg1: 't1' },
    ];

    const result = optimizer.optimize(instrs);

    expect(result.records.some((r) => r.kind === 'constant-propagation')).toBe(true);
  });

  it('11. Eliminates common subexpressions (CSE)', () => {
    const optimizer = new Optimizer();
    const instrs: TACInstruction[] = [
      { id: '1', kind: 'binary', result: 't1', arg1: 'a', op: '+', arg2: 'b' },
      { id: '2', kind: 'assign', result: 'x', arg1: 't1' },
      { id: '3', kind: 'binary', result: 't2', arg1: 'a', op: '+', arg2: 'b' },
      { id: '4', kind: 'assign', result: 'y', arg1: 't2' },
    ];

    const result = optimizer.optimize(instrs);

    expect(result.records.some((r) => r.kind === 'common-subexpression-elimination')).toBe(true);
    expect(result.optimized.some((i) => i.result === 'y' && i.arg1 === 't1')).toBe(true);
  });

  it('12. Eliminates dead code temporaries that are never used', () => {
    const optimizer = new Optimizer();
    const instrs: TACInstruction[] = [
      { id: '1', kind: 'assign', result: 't99', arg1: '100' }, // Never read
      { id: '2', kind: 'assign', result: 'x', arg1: '10' },
    ];

    const result = optimizer.optimize(instrs);

    expect(result.records.some((r) => r.kind === 'dead-code-elimination')).toBe(true);
    expect(result.optimized.some((i) => i.result === 't99')).toBe(false);
    expect(result.optimized.some((i) => i.result === 'x')).toBe(true);
  });
});
