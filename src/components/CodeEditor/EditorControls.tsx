'use client';

import React from 'react';
import { useCompilerStore, CompilerPhaseKey } from '@/lib/store/useCompilerStore';
import { CODE_PRESETS } from '@/lib/examples/codePresets';
import {
  Play,
  RotateCcw,
  Sparkles,
  History,
  Sliders,
  Download,
  Code2,
  FastForward,
} from 'lucide-react';

export const EditorControls: React.FC = () => {
  const {
    compileAll,
    stepToPhase,
    clearAll,
    loadPreset,
    isCompiling,
    setHistoryOpen,
    setSettingsOpen,
    setExportOpen,
  } = useCompilerStore();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs transition-colors">
      {/* Left controls: Presets & Clear */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
          <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold text-slate-800 dark:text-zinc-200">Editor</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-zinc-700 mx-0.5" />

        {/* Load Example Dropdown */}
        <div className="relative flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <select
            onChange={(e) => {
              if (e.target.value) {
                loadPreset(e.target.value);
              }
            }}
            defaultValue=""
            className="bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs rounded-lg px-2 py-1 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs max-w-[150px] truncate"
          >
            <option value="" disabled>
              Load Preset...
            </option>
            {CODE_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={clearAll}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 border border-slate-200 dark:border-zinc-700/60 transition"
          title="Clear editor code"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      {/* Right controls: Step selector, History, Settings, Export, Compile */}
      <div className="flex items-center gap-1.5">
        {/* Step to Phase Select */}
        <div className="flex items-center gap-1">
          <FastForward className="w-3.5 h-3.5 text-slate-400" />
          <select
            onChange={(e) => {
              if (e.target.value) {
                stepToPhase(e.target.value as CompilerPhaseKey);
              }
            }}
            defaultValue=""
            className="bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-[11px] rounded-lg px-2 py-1 border border-slate-200 dark:border-zinc-700 outline-none cursor-pointer shadow-2xs"
          >
            <option value="" disabled>
              Step To Phase...
            </option>
            <option value="lexical">1. Lexer (Tokens)</option>
            <option value="syntax">2. Parser (AST)</option>
            <option value="semantic">3. Semantic (Symbols)</option>
            <option value="intermediate">4. IR (TAC)</option>
            <option value="optimizer">5. Optimizer</option>
            <option value="target">6. Target (ASM)</option>
            <option value="debugger">7. Virtual Debugger</option>
          </select>
        </div>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-zinc-700 mx-0.5" />

        {/* History Modal Button */}
        <button
          onClick={() => setHistoryOpen(true)}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 transition"
          title="Session History"
        >
          <History className="w-3.5 h-3.5" />
        </button>

        {/* Export Modal Button */}
        <button
          onClick={() => setExportOpen(true)}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 transition"
          title="Export Session / Report"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {/* Settings Modal Button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 transition"
          title="Workbench Settings"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Primary Run Button */}
        <button
          onClick={() => compileAll()}
          disabled={isCompiling}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-xs active:scale-95 transition disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Run</span>
        </button>
      </div>
    </div>
  );
};
