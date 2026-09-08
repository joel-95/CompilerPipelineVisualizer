// Global State Management using Zustand
import { create } from 'zustand';
import {
  Token,
  ProgramNode,
  SymbolEntry,
  CompilationError,
  PipelineResult,
} from '../compiler/types';
import { CompilerPipeline } from '../compiler/Pipeline';
import { CODE_PRESETS } from '../examples/codePresets';

export type CompilerPhaseKey = 'lexical' | 'syntax' | 'semantic' | 'intermediate' | 'optimizer' | 'target';

interface CompilerStore {
  sourceCode: string;
  fontSize: number;
  theme: 'dark' | 'light';
  isCompiling: boolean;
  activePhase: CompilerPhaseKey;
  tokens: Token[];
  ast: ProgramNode | null;
  symbolTable: SymbolEntry[];
  errors: CompilationError[];
  phases: PipelineResult['phases'];
  selectedItem: any | null;
  selectedItemType: 'token' | 'astNode' | 'symbol' | null;

  // Actions
  setSourceCode: (code: string) => void;
  setFontSize: (size: number) => void;
  toggleTheme: () => void;
  setActivePhase: (phase: CompilerPhaseKey) => void;
  setSelectedItem: (item: any | null, type: 'token' | 'astNode' | 'symbol' | null) => void;
  loadPreset: (presetId: string) => void;
  clearAll: () => void;
  compileAll: () => Promise<void>;
  stepToPhase: (targetPhase: 'lexical' | 'syntax' | 'semantic') => Promise<void>;
}

const DEFAULT_CODE = CODE_PRESETS[0].code;

export const useCompilerStore = create<CompilerStore>((set, get) => ({
  sourceCode: typeof window !== 'undefined' ? localStorage.getItem('cpv_source_code') || DEFAULT_CODE : DEFAULT_CODE,
  fontSize: 14,
  theme: 'dark',
  isCompiling: false,
  activePhase: 'lexical',
  tokens: [],
  ast: null,
  symbolTable: [],
  errors: [],
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

  setSourceCode: (code: string) => {
    set({ sourceCode: code });
    if (typeof window !== 'undefined') {
      localStorage.setItem('cpv_source_code', code);
    }
  },

  setFontSize: (fontSize: number) => set({ fontSize }),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') {
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { theme: next };
    }),

  setActivePhase: (phase: CompilerPhaseKey) => set({ activePhase: phase }),

  setSelectedItem: (item: any | null, type: 'token' | 'astNode' | 'symbol' | null) =>
    set({ selectedItem: item, selectedItemType: type }),

  loadPreset: (presetId: string) => {
    const preset = CODE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      get().setSourceCode(preset.code);
      // Auto compile on preset load
      get().compileAll();
    }
  },

  clearAll: () => {
    get().setSourceCode('');
    set({
      tokens: [],
      ast: null,
      symbolTable: [],
      errors: [],
      selectedItem: null,
      selectedItemType: null,
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
      // First try API route, with client-side fallback if server is starting
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
        // Fallback to in-browser pipeline
      }

      if (!resData) {
        const localPipeline = new CompilerPipeline();
        resData = localPipeline.run(sourceCode);
      }

      set({
        tokens: resData.tokens,
        ast: resData.ast,
        symbolTable: resData.symbolTable,
        errors: resData.errors,
        phases: resData.phases,
        isCompiling: false,
      });
    } catch (err) {
      console.error('Compilation failed:', err);
      set({ isCompiling: false });
    }
  },

  stepToPhase: async (targetPhase: 'lexical' | 'syntax' | 'semantic') => {
    await get().compileAll();
    set({ activePhase: targetPhase });
  },
}));
