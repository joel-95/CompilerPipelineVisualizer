'use client';

import React from 'react';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import { CODE_PRESETS } from '@/lib/examples/codePresets';
import {
  Play,
  RotateCcw,
  Sparkles,
  Type,
  ArrowRight,
  Code2,
} from 'lucide-react';

export const EditorControls: React.FC = () => {
  const {
    compileAll,
    stepToPhase,
    clearAll,
    loadPreset,
    fontSize,
    setFontSize,
    isCompiling,
  } = useCompilerStore();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs transition-colors">
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
            className="bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs rounded-lg px-2.5 py-1 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
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
          title="Clear source code"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Right controls: Font size, Stepping, Compile */}
      <div className="flex items-center gap-2">
        {/* Font size dropdown */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-800/60 rounded-lg px-2 py-0.5 border border-slate-200 dark:border-zinc-700/60 shadow-2xs">
          <Type className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="bg-transparent text-slate-700 dark:text-zinc-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value={12} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">12px</option>
            <option value={14} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">14px</option>
            <option value={16} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">16px</option>
            <option value={18} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">18px</option>
          </select>
        </div>

        {/* Stepping controls */}
        <div className="hidden xl:flex items-center gap-1">
          <button
            onClick={() => stepToPhase('lexical')}
            disabled={isCompiling}
            className="px-2 py-1 rounded-md bg-white hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition text-[11px] border border-slate-200 dark:border-zinc-700 shadow-2xs"
            title="Step through to Lexer output"
          >
            Lex
          </button>
          <button
            onClick={() => stepToPhase('syntax')}
            disabled={isCompiling}
            className="px-2 py-1 rounded-md bg-white hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition text-[11px] border border-slate-200 dark:border-zinc-700 shadow-2xs"
            title="Step through to Syntax AST"
          >
            Syntax
          </button>
          <button
            onClick={() => stepToPhase('semantic')}
            disabled={isCompiling}
            className="px-2 py-1 rounded-md bg-white hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition text-[11px] border border-slate-200 dark:border-zinc-700 shadow-2xs"
            title="Step through to Semantic Analysis"
          >
            Semantic
          </button>
        </div>

        {/* Primary Compile button */}
        <button
          onClick={() => compileAll()}
          disabled={isCompiling}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-xs active:scale-95 transition disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Compile</span>
        </button>
      </div>
    </div>
  );
};
