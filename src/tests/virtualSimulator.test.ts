import { describe, it, expect } from 'vitest';
import { VirtualSimulator } from '../lib/compiler/VirtualSimulator';
import { TACInstruction } from '../lib/compiler/types';

describe('VirtualSimulator (Joel - Frontend Lead & Simulation)', () => {
  it('20. Simulates linear assignment and arithmetic operations step-by-step', () => {
    const tac: TACInstruction[] = [
      { id: '1', kind: 'assign', result: 'a', arg1: '10' },
      { id: '2', kind: 'assign', result: 'b', arg1: '25' },
      { id: '3', kind: 'binary', result: 'sum', arg1: 'a', op: '+', arg2: 'b' },
    ];

    const steps = VirtualSimulator.simulate(tac);

    expect(steps.length).toBe(3);
    expect(steps[0].memory['a']).toBe(10);
    expect(steps[1].memory['b']).toBe(25);
    expect(steps[2].memory['sum']).toBe(35);
  });

  it('21. Simulates jumps and conditional branching execution trace', () => {
    const tac: TACInstruction[] = [
      { id: '1', kind: 'assign', result: 'x', arg1: '5' },
      { id: '2', kind: 'cjump', arg1: 'x', label: 'target' },
      { id: '3', kind: 'assign', result: 'y', arg1: '99' }, // Skipped
      { id: '4', kind: 'label', label: 'target' },
      { id: '5', kind: 'assign', result: 'z', arg1: '42' },
    ];

    const steps = VirtualSimulator.simulate(tac);

    const executedInstructions = steps.map((s) => s.instructionText);
    expect(executedInstructions.some((text) => text.includes('z = 42'))).toBe(true);
    expect(executedInstructions.some((text) => text.includes('y = 99'))).toBe(false);
  });
});
