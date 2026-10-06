import { describe, it, expect } from 'vitest';
import { RegisterAllocator } from '../lib/compiler/RegisterAllocator';
import { TACInstruction } from '../lib/compiler/types';

describe('RegisterAllocator (Kevin - Backend)', () => {
  it('1. Computes live ranges for TAC variables accurately', () => {
    const allocator = new RegisterAllocator();
    const instrs: TACInstruction[] = [
      { id: '1', kind: 'assign', result: 'a', arg1: '10' },
      { id: '2', kind: 'assign', result: 'b', arg1: '20' },
      { id: '3', kind: 'binary', result: 't0', arg1: 'a', op: '+', arg2: 'b' },
      { id: '4', kind: 'assign', result: 'c', arg1: 't0' },
    ];

    const ranges = allocator.computeLiveRanges(instrs);
    const rangeA = ranges.find((r) => r.variable === 'a');
    const rangeB = ranges.find((r) => r.variable === 'b');
    const rangeT0 = ranges.find((r) => r.variable === 't0');

    expect(rangeA).toBeDefined();
    expect(rangeA?.start).toBe(0);
    expect(rangeA?.end).toBe(2);

    expect(rangeB?.start).toBe(1);
    expect(rangeB?.end).toBe(2);

    expect(rangeT0?.start).toBe(2);
    expect(rangeT0?.end).toBe(3);
  });

  it('2. Builds interference graph edges between overlapping live ranges', () => {
    const allocator = new RegisterAllocator();
    const instrs: TACInstruction[] = [
      { id: '1', kind: 'assign', result: 'x', arg1: '5' },
      { id: '2', kind: 'assign', result: 'y', arg1: '15' },
      { id: '3', kind: 'binary', result: 't0', arg1: 'x', op: '*', arg2: 'y' },
    ];

    const ranges = allocator.computeLiveRanges(instrs);
    const graph = allocator.buildInterferenceGraph(ranges, instrs);

    expect(graph.nodes).toContain('x');
    expect(graph.nodes).toContain('y');
    // x and y overlap between inst 1 and 2
    expect(graph.adjacency['x']).toContain('y');
    expect(graph.adjacency['y']).toContain('x');
  });

  it('3. Colors interference graph without collisions when K is sufficient', () => {
    const allocator = new RegisterAllocator(['rax', 'rbx', 'rcx']);
    const instrs: TACInstruction[] = [
      { id: '1', kind: 'assign', result: 'x', arg1: '5' },
      { id: '2', kind: 'assign', result: 'y', arg1: '10' },
      { id: '3', kind: 'binary', result: 'sum', arg1: 'x', op: '+', arg2: 'y' },
    ];

    const result = allocator.allocate(instrs);

    expect(result.spills.length).toBe(0);
    expect(result.allocations['x']).toBeDefined();
    expect(result.allocations['y']).toBeDefined();
    expect(result.allocations['x']).not.toBe(result.allocations['y']);
  });

  it('4. Successfully spills variables to stack slots when registers are exhausted', () => {
    // Only 1 register available, but 2 variables overlap
    const allocator = new RegisterAllocator(['rax']);
    const instrs: TACInstruction[] = [
      { id: '1', kind: 'assign', result: 'p', arg1: '10' },
      { id: '2', kind: 'assign', result: 'q', arg1: '20' },
      { id: '3', kind: 'binary', result: 'r', arg1: 'p', op: '+', arg2: 'q' },
    ];

    const result = allocator.allocate(instrs);

    expect(result.spills.length).toBeGreaterThan(0);
    expect(Object.keys(result.spillOffsets).length).toBeGreaterThan(0);
  });
});
