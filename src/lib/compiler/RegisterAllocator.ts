// Register Allocator with Liveness Analysis, Interference Graph, and Graph Coloring
import { TACInstruction, RegisterAllocationResult, LiveRange, InterferenceGraph } from './types';

export const DEFAULT_AVAILABLE_REGISTERS = [
  'rax',
  'rbx',
  'rcx',
  'rdx',
  'rsi',
  'rdi',
  'r8',
  'r9',
  'r10',
  'r11',
];

export class RegisterAllocator {
  private availableRegisters: string[];

  constructor(availableRegisters: string[] = DEFAULT_AVAILABLE_REGISTERS) {
    this.availableRegisters = availableRegisters;
  }

  /**
   * Allocates registers for a sequence of TAC instructions
   */
  public allocate(instructions: TACInstruction[]): RegisterAllocationResult {
    const liveRanges = this.computeLiveRanges(instructions);
    const interferenceGraph = this.buildInterferenceGraph(liveRanges, instructions);
    const pressure = this.computeRegisterPressure(instructions, liveRanges);
    const maxPressure = pressure.reduce((max, p) => Math.max(max, p.pressureCount), 0);

    const { allocations, spills, spillOffsets } = this.colorGraph(
      interferenceGraph,
      this.availableRegisters
    );

    return {
      allocations,
      spills,
      spillOffsets,
      interferenceGraph,
      liveRanges,
      registerPressure: pressure,
      maxPressure,
      availableRegisters: this.availableRegisters,
    };
  }

  /**
   * Live Range Analysis: identifies when each variable/temp is first defined and last used
   */
  public computeLiveRanges(instructions: TACInstruction[]): LiveRange[] {
    const rangeMap = new Map<string, { start: number; end: number }>();

    const record = (v?: string, idx?: number) => {
      if (!v || typeof v !== 'string') return;
      // Filter out constants, labels, keywords
      if (/^-?\d+(\.\d+)?$/.test(v) || v.startsWith('"') || v.startsWith('L') || v === 'undefined') return;

      const current = rangeMap.get(v);
      if (!current) {
        rangeMap.set(v, { start: idx!, end: idx! });
      } else {
        rangeMap.set(v, {
          start: Math.min(current.start, idx!),
          end: Math.max(current.end, idx!),
        });
      }
    };

    instructions.forEach((instr, idx) => {
      if (instr.result) record(instr.result, idx);
      if (instr.arg1) record(instr.arg1, idx);
      if (instr.arg2) record(instr.arg2, idx);
    });

    return Array.from(rangeMap.entries()).map(([variable, { start, end }]) => ({
      variable,
      start,
      end,
    }));
  }

  /**
   * Constructs the Interference Graph where an edge represents overlapping live ranges
   */
  public buildInterferenceGraph(
    liveRanges: LiveRange[],
    instructions: TACInstruction[]
  ): InterferenceGraph {
    const nodes = liveRanges.map((r) => r.variable);
    const edges: [string, string][] = [];
    const adjacency: Record<string, string[]> = {};

    for (const node of nodes) {
      adjacency[node] = [];
    }

    for (let i = 0; i < liveRanges.length; i++) {
      for (let j = i + 1; j < liveRanges.length; j++) {
        const r1 = liveRanges[i];
        const r2 = liveRanges[j];

        // Two ranges overlap if they are alive simultaneously
        const overlaps = Math.max(r1.start, r2.start) <= Math.min(r1.end, r2.end);
        if (overlaps) {
          edges.push([r1.variable, r2.variable]);
          adjacency[r1.variable].push(r2.variable);
          adjacency[r2.variable].push(r1.variable);
        }
      }
    }

    return { nodes, edges, adjacency };
  }

  /**
   * Graph Coloring (Chaitin-Briggs style Kempe heuristic)
   */
  public colorGraph(
    graph: InterferenceGraph,
    registers: string[]
  ): {
    allocations: Record<string, string>;
    spills: string[];
    spillOffsets: Record<string, number>;
  } {
    const k = registers.length;
    const allocations: Record<string, string> = {};
    const spills: string[] = [];
    const spillOffsets: Record<string, number> = {};

    // Clone adjacency for degree simplification
    const adj: Record<string, Set<string>> = {};
    for (const node of graph.nodes) {
      adj[node] = new Set(graph.adjacency[node]);
    }

    const stack: string[] = [];
    const removed = new Set<string>();

    // Simplification & Spill Selection Loop
    while (stack.length + spills.length < graph.nodes.length) {
      // Find a node with degree < K that hasn't been removed
      const lowDegreeNode = graph.nodes.find(
        (n) => !removed.has(n) && adj[n].size < k
      );

      if (lowDegreeNode) {
        stack.push(lowDegreeNode);
        removed.add(lowDegreeNode);
        // Remove from neighbours' active adjacencies
        for (const neighbour of adj[lowDegreeNode]) {
          adj[neighbour].delete(lowDegreeNode);
        }
      } else {
        // Potential spill: pick node with maximum degree
        const spillCandidate = graph.nodes
          .filter((n) => !removed.has(n))
          .sort((a, b) => adj[b].size - adj[a].size)[0];

        if (!spillCandidate) break;

        stack.push(spillCandidate);
        removed.add(spillCandidate);
        for (const neighbour of adj[spillCandidate]) {
          adj[neighbour].delete(spillCandidate);
        }
      }
    }

    // Reconstruct and assign colors
    let nextSpillOffset = -8;
    while (stack.length > 0) {
      const node = stack.pop()!;
      const neighborColors = new Set<string>();

      for (const neighbor of graph.adjacency[node] || []) {
        if (allocations[neighbor]) {
          neighborColors.add(allocations[neighbor]);
        }
      }

      // Pick first available register
      const freeReg = registers.find((r) => !neighborColors.has(r));

      if (freeReg) {
        allocations[node] = freeReg;
      } else {
        // Must spill to stack
        spills.push(node);
        spillOffsets[node] = nextSpillOffset;
        nextSpillOffset -= 8;
      }
    }

    return { allocations, spills, spillOffsets };
  }

  /**
   * Tracks live variable count at each instruction step
   */
  public computeRegisterPressure(
    instructions: TACInstruction[],
    liveRanges: LiveRange[]
  ): { line: number; activeVariables: string[]; pressureCount: number }[] {
    return instructions.map((_, idx) => {
      const active = liveRanges
        .filter((r) => idx >= r.start && idx <= r.end)
        .map((r) => r.variable);

      return {
        line: idx + 1,
        activeVariables: active,
        pressureCount: active.length,
      };
    });
  }
}
