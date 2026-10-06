import { describe, it, expect } from 'vitest';
import { TargetCodeGenerator } from '../lib/compiler/TargetCodeGenerator';
import { TACInstruction } from '../lib/compiler/types';

describe('TargetCodeGenerator (Ebin & Kevin)', () => {
  it('13. Emits x86-64 function prologue and epilogue', () => {
    const generator = new TargetCodeGenerator();
    const instrs: TACInstruction[] = [
      { id: '1', kind: 'assign', result: 'x', arg1: '10' },
      { id: '2', kind: 'return', arg1: 'x' },
    ];

    const asm = generator.generate(instrs);

    expect(asm.some((a) => a.opcode === 'push' && a.operands === 'rbp')).toBe(true);
    expect(asm.some((a) => a.opcode === 'mov' && a.operands === 'rbp, rsp')).toBe(true);
    expect(asm.some((a) => a.opcode === 'ret')).toBe(true);
  });

  it('14. Translates binary operations to corresponding assembly instructions', () => {
    const generator = new TargetCodeGenerator();
    const instrs: TACInstruction[] = [
      { id: '1', kind: 'binary', result: 'sum', arg1: 'a', op: '+', arg2: 'b' },
      { id: '2', kind: 'binary', result: 'diff', arg1: 'a', op: '-', arg2: 'b' },
      { id: '3', kind: 'binary', result: 'prod', arg1: 'a', op: '*', arg2: 'b' },
    ];

    const asm = generator.generate(instrs);

    expect(asm.some((a) => a.opcode === 'add')).toBe(true);
    expect(asm.some((a) => a.opcode === 'sub')).toBe(true);
    expect(asm.some((a) => a.opcode === 'imul')).toBe(true);
  });

  it('15. Translates relational checks to cmp and setcc instructions', () => {
    const generator = new TargetCodeGenerator();
    const instrs: TACInstruction[] = [
      { id: '1', kind: 'binary', result: 'cmpRes', arg1: 'a', op: '<', arg2: 'b' },
    ];

    const asm = generator.generate(instrs);

    expect(asm.some((a) => a.opcode === 'cmp')).toBe(true);
    expect(asm.some((a) => a.opcode === 'setl')).toBe(true);
    expect(asm.some((a) => a.opcode === 'movzx')).toBe(true);
  });
});
