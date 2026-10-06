// Global State Management using Zustand with Phase 2 Extensions
import { create } from 'zustand';
import {
  Token,
  ProgramNode,
  SymbolEntry,
  CompilationError,
  PipelineResult,
  TACInstruction,
  OptimizationRecord,
  AsmInstruction,
  BasicBlock,
  RegisterAllocationResult,
  CompilationMetrics,
  SimulationStep,
} from '../compiler/types';
import { CompilerPipeline } from '../compiler/Pipeline';
import { VirtualSimulator } from '../compiler/VirtualSimulator';
import { CODE_PRESETS } from '../examples/codePresets';
import { SessionSummary } from '../db/repository';

export type CompilerPhaseKey =
  | 'lexical'
  | 'syntax'
  | 'semantic'
  | 'intermediate'
  | 'optimizer'
  | 'target'
  | 'debugger'
  | 'errors'
  | 'inspector'
  | 'history';

interface CompilerStore {
  sourceCode: string;
  fontSize: number;
  theme: 'dark' | 'light';
  isCompiling: boolean;
  activePhase: CompilerPhaseKey;
  highlightedLine: number | null;

  // Compiler Artefacts
  tokens: Token[];
  ast: ProgramNode | null;
  symbolTable: SymbolEntry[];
  errors: CompilationError[];
  tac: TACInstruction[];
  optimizedTac: TACInstruction[];
  optimizations: OptimizationRecord[];
  basicBlocks: BasicBlock[];
  registerAllocation: RegisterAllocationResult;
  assembly: AsmInstruction[];
  metrics: CompilationMetrics;
  phases: PipelineResult['phases'];

  // Inspection & Selection
  selectedItem: any | null;
  selectedItemType: 'token' | 'astNode' | 'symbol' | 'tac' | 'asm' | null;

  // Step-Through & Debugging Simulation
  simulationSteps: SimulationStep[];
  currentStepIndex: number;
  isPlayingSimulation: boolean;
  simulationSpeed: number; // in ms per step

  // Session Management & History
  sessions: SessionSummary[];
  isLoadingSessions: boolean;
  activeSessionId: string | null;

  // Modals & Preferences
  isSettingsOpen: boolean;
  isHistoryOpen: boolean;
  isExportOpen: boolean;
  autoCompile: boolean;

  // Actions
  initFromStorage: () => void;
  setSourceCode: (code: string) => void;
  setFontSize: (size: number) => void;
  toggleTheme: () => void;
  setActivePhase: (phase: CompilerPhaseKey) => void;
  setHighlightedLine: (line: number | null) => void;
  setSelectedItem: (item: any | null, type: 'token' | 'astNode' | 'symbol' | 'tac' | 'asm' | null) => void;
  loadPreset: (presetId: string) => void;
  clearAll: () => void;
  compileAll: () => Promise<void>;
  stepToPhase: (targetPhase: CompilerPhaseKey) => Promise<void>;

  // Simulation controls
  initSimulation: () => void;
  setStepIndex: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  togglePlaySimulation: () => void;
  startAutoPlay: () => void;
  pauseAutoPlay: () => void;
  setSimulationSpeed: (speed: number) => void;

  // Session History
  fetchSessions: () => Promise<void>;
  loadSessionById: (sessionId: string) => Promise<void>;
  deleteSessionById: (sessionId: string) => Promise<void>;
  saveCurrentSession: () => Promise<string | null>;

  // UI Modals
  setSettingsOpen: (open: boolean) => void;
  setHistoryOpen: (open: boolean) => void;
  setExportOpen: (open: boolean) => void;
  setAutoCompile: (enabled: boolean) => void;

  // Export utilities
  exportAsJSON: () => string;
  exportAsMarkdown: () => string;
}

const DEFAULT_CODE = CODE_PRESETS[0].code;

const INITIAL_REG_ALLOC: RegisterAllocationResult = {
  allocations: {},
  spills: [],
  spillOffsets: {},
  interferenceGraph: { nodes: [], edges: [], adjacency: {} },
  liveRanges: [],
  registerPressure: [],
  maxPressure: 0,
  availableRegisters: [],
};

const INITIAL_METRICS: CompilationMetrics = {
  cyclomaticComplexity: 1,
  astDepth: 0,
  tokenCount: 0,
  lineCount: 0,
  tacCount: 0,
  optimizedTacCount: 0,
  asmCount: 0,
  sizeReductionPercent: 0,
  spillCount: 0,
};

let playIntervalTimer: any = null;

export const useCompilerStore = create<CompilerStore>((set, get) => ({
  sourceCode: DEFAULT_CODE,
  fontSize: 14,
  theme: 'dark',
  isCompiling: false,
  activePhase: 'lexical',
  highlightedLine: null,

  tokens: [],
  ast: null,
  symbolTable: [],
  errors: [],
  tac: [],
  optimizedTac: [],
  optimizations: [],
  basicBlocks: [],
  registerAllocation: INITIAL_REG_ALLOC,
  assembly: [],
  metrics: INITIAL_METRICS,
  phases: {
    lexical: { status: 'idle', executionTimeMs: 0, itemCount: 0 },
    syntax: { status: 'idle', executionTimeMs: 0, itemCount: 0 },
    semantic: { status: 'idle', executionTimeMs: 0, itemCount: 0 },
    intermediate: { status: 'idle', executionTimeMs: 0, itemCount: 0 },
    optimizer: { status: 'idle', executionTimeMs: 0, itemCount: 0 },
    target: { status: 'idle', executionTimeMs: 0, itemCount: 0 },
  },

  selectedItem: null,
  selectedItemType: null,

  simulationSteps: [],
  currentStepIndex: 0,
  isPlayingSimulation: false,
  simulationSpeed: 800,

  sessions: [],
  isLoadingSessions: false,
  activeSessionId: null,

  isSettingsOpen: false,
  isHistoryOpen: false,
  isExportOpen: false,
  autoCompile: false,

  initFromStorage: () => {
    if (typeof window === 'undefined') return;
    const savedCode = localStorage.getItem('cpv_source_code');
    const savedTheme = localStorage.getItem('cpv_theme') as 'dark' | 'light' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    set({
      sourceCode: savedCode !== null ? savedCode : get().sourceCode,
      theme,
    });
  },

  setSourceCode: (code: string) => {
    set({ sourceCode: code });
    if (typeof window !== 'undefined') {
      localStorage.setItem('cpv_source_code', code);
    }
    if (get().autoCompile) {
      get().compileAll();
    }
  },

  setFontSize: (fontSize: number) => set({ fontSize }),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('cpv_theme', next);
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { theme: next };
    }),

  setActivePhase: (phase: CompilerPhaseKey) => {
    set({ activePhase: phase });
    if (phase === 'debugger' && get().simulationSteps.length === 0) {
      get().initSimulation();
    }
  },

  setHighlightedLine: (line: number | null) => set({ highlightedLine: line }),

  setSelectedItem: (item, type) => set({ selectedItem: item, selectedItemType: type }),

  loadPreset: (presetId: string) => {
    const preset = CODE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      get().setSourceCode(preset.code);
      get().compileAll();
    }
  },

  clearAll: () => {
    get().setSourceCode('');
    if (playIntervalTimer) clearInterval(playIntervalTimer);
    set({
      tokens: [],
      ast: null,
      symbolTable: [],
      errors: [],
      tac: [],
      optimizedTac: [],
      optimizations: [],
      basicBlocks: [],
      registerAllocation: INITIAL_REG_ALLOC,
      assembly: [],
      metrics: INITIAL_METRICS,
      simulationSteps: [],
      currentStepIndex: 0,
      isPlayingSimulation: false,
      selectedItem: null,
      selectedItemType: null,
      highlightedLine: null,
      phases: {
        lexical: { status: 'idle', executionTimeMs: 0, itemCount: 0 },
        syntax: { status: 'idle', executionTimeMs: 0, itemCount: 0 },
        semantic: { status: 'idle', executionTimeMs: 0, itemCount: 0 },
        intermediate: { status: 'idle', executionTimeMs: 0, itemCount: 0 },
        optimizer: { status: 'idle', executionTimeMs: 0, itemCount: 0 },
        target: { status: 'idle', executionTimeMs: 0, itemCount: 0 },
      },
    });
  },

  compileAll: async () => {
    const { sourceCode } = get();
    set({ isCompiling: true });

    try {
      let resData: PipelineResult | null = null;
      try {
        const response = await fetch('/api/compile/pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceCode }),
        });
        if (response.ok) {
          resData = await response.json();
        }
      } catch (err) {
        // Fallback to in-browser compiler pipeline
      }

      if (!resData) {
        const localPipeline = new CompilerPipeline();
        resData = localPipeline.run(sourceCode);
      }

      const simTac = resData.optimizedTac.length > 0 ? resData.optimizedTac : resData.tac;
      const simSteps = VirtualSimulator.simulate(simTac, resData.registerAllocation);

      set({
        tokens: resData.tokens,
        ast: resData.ast,
        symbolTable: resData.symbolTable,
        errors: resData.errors,
        tac: resData.tac,
        optimizedTac: resData.optimizedTac,
        optimizations: resData.optimizations,
        basicBlocks: resData.basicBlocks || [],
        registerAllocation: resData.registerAllocation || INITIAL_REG_ALLOC,
        assembly: resData.assembly,
        metrics: resData.metrics || INITIAL_METRICS,
        phases: resData.phases,
        simulationSteps: simSteps,
        currentStepIndex: 0,
        activeSessionId: resData.sessionId,
        isCompiling: false,
      });
    } catch (err) {
      console.error('Compilation failed:', err);
      set({ isCompiling: false });
    }
  },

  stepToPhase: async (targetPhase: CompilerPhaseKey) => {
    await get().compileAll();
    set({ activePhase: targetPhase });
  },

  initSimulation: () => {
    const { tac, optimizedTac, registerAllocation } = get();
    const simTac = optimizedTac.length > 0 ? optimizedTac : tac;
    const steps = VirtualSimulator.simulate(simTac, registerAllocation);
    set({ simulationSteps: steps, currentStepIndex: 0 });
  },

  setStepIndex: (index: number) => {
    const { simulationSteps } = get();
    if (index >= 0 && index < simulationSteps.length) {
      const step = simulationSteps[index];
      set({
        currentStepIndex: index,
        highlightedLine: step.sourceLineRef || null,
      });
    }
  },

  nextStep: () => {
    const { currentStepIndex, simulationSteps } = get();
    if (currentStepIndex < simulationSteps.length - 1) {
      get().setStepIndex(currentStepIndex + 1);
    } else {
      get().pauseAutoPlay();
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      get().setStepIndex(currentStepIndex - 1);
    }
  },

  togglePlaySimulation: () => {
    const { isPlayingSimulation } = get();
    if (isPlayingSimulation) {
      get().pauseAutoPlay();
    } else {
      get().startAutoPlay();
    }
  },

  startAutoPlay: () => {
    const { simulationSpeed } = get();
    if (playIntervalTimer) clearInterval(playIntervalTimer);
    set({ isPlayingSimulation: true });

    playIntervalTimer = setInterval(() => {
      const { currentStepIndex, simulationSteps } = get();
      if (currentStepIndex >= simulationSteps.length - 1) {
        get().pauseAutoPlay();
      } else {
        get().nextStep();
      }
    }, simulationSpeed);
  },

  pauseAutoPlay: () => {
    if (playIntervalTimer) {
      clearInterval(playIntervalTimer);
      playIntervalTimer = null;
    }
    set({ isPlayingSimulation: false });
  },

  setSimulationSpeed: (speed: number) => {
    set({ simulationSpeed: speed });
    if (get().isPlayingSimulation) {
      get().pauseAutoPlay();
      get().startAutoPlay();
    }
  },

  fetchSessions: async () => {
    set({ isLoadingSessions: true });
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        set({ sessions: data.sessions || [], isLoadingSessions: false });
      }
    } catch (err) {
      set({ isLoadingSessions: false });
    }
  },

  loadSessionById: async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.session?.sourceCode) {
          get().setSourceCode(data.session.sourceCode);
          await get().compileAll();
          set({ activeSessionId: sessionId });
        }
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  },

  deleteSessionById: async (sessionId: string) => {
    try {
      await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      await get().fetchSessions();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  },

  saveCurrentSession: async () => {
    const { sourceCode } = get();
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCode }),
      });
      if (res.ok) {
        const data = await res.json();
        await get().fetchSessions();
        return data.sessionId;
      }
    } catch (err) {
      console.error('Failed to save session:', err);
    }
    return null;
  },

  setSettingsOpen: (open: boolean) => set({ isSettingsOpen: open }),
  setHistoryOpen: (open: boolean) => {
    set({ isHistoryOpen: open });
    if (open) get().fetchSessions();
  },
  setExportOpen: (open: boolean) => set({ isExportOpen: open }),
  setAutoCompile: (enabled: boolean) => set({ autoCompile: enabled }),

  exportAsJSON: () => {
    const state = get();
    const exportData = {
      sessionId: state.activeSessionId,
      timestamp: new Date().toISOString(),
      sourceCode: state.sourceCode,
      metrics: state.metrics,
      phases: state.phases,
      tokens: state.tokens,
      ast: state.ast,
      symbolTable: state.symbolTable,
      errors: state.errors,
      tac: state.tac,
      optimizedTac: state.optimizedTac,
      optimizations: state.optimizations,
      registerAllocation: state.registerAllocation,
      assembly: state.assembly,
    };
    return JSON.stringify(exportData, null, 2);
  },

  exportAsMarkdown: () => {
    const state = get();
    return `# Compiler Pipeline Execution Report
**Date:** ${new Date().toLocaleString()}
**Session ID:** \`${state.activeSessionId || 'N/A'}\`

## Source Code
\`\`\`c
${state.sourceCode}
\`\`\`

## Compiler Metrics
- **Lines of Code:** ${state.metrics.lineCount}
- **Tokens Generated:** ${state.metrics.tokenCount}
- **Cyclomatic Complexity:** ${state.metrics.cyclomaticComplexity}
- **AST Depth:** ${state.metrics.astDepth}
- **TAC Instructions:** ${state.metrics.tacCount}
- **Optimized TAC:** ${state.metrics.optimizedTacCount} (${state.metrics.sizeReductionPercent}% reduction)
- **Target Instructions:** ${state.metrics.asmCount}
- **Stack Spills:** ${state.metrics.spillCount}

## Intermediate Representation (Three-Address Code)
\`\`\`
${state.tac.map((i) => `${i.result ? i.result + ' = ' : ''}${i.arg1 || ''} ${i.op || ''} ${i.arg2 || ''}`).join('\n')}
\`\`\`

## Generated Assembly (x86-64)
\`\`\`nasm
${state.assembly.map((a) => `${a.isLabel ? a.labelName + ':' : `  ${a.opcode.padEnd(8)} ${a.operands.padEnd(20)} ; ${a.comment || ''}`}`).join('\n')}
\`\`\`

## Diagnostics (${state.errors.length})
${state.errors.length === 0 ? '✅ No errors detected.' : state.errors.map((e) => `- [${e.severity}] [${e.phase}] Line ${e.line}:${e.column} - ${e.message}`).join('\n')}
`;
  },
}));
