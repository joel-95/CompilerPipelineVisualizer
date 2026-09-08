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
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-zinc-900/90 border-b border-zinc-800 text-zinc-300 text-xs">
      {/* Left controls: Presets & Clear */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Code2 className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-zinc-200">Source Editor</span>
        </div>

        <div className="h-4 w-[1px] bg-zinc-700 mx-1" />

        {/* Load Example Dropdown */}
        <div className="relative flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <select
            onChange={(e) => {
              if (e.target.value) {
                loadPreset(e.target.value);
              }
            }}
            defaultValue=""
            className="bg-zinc-800 text-zinc-200 text-xs rounded-lg px-2.5 py-1 border border-zinc-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="" disabled>
              Load Example Preset...
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
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 transition"
          title="Clear source code"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Right controls: Font size, Stepping, Compile */}
      <div className="flex items-center gap-2">
        {/* Font size dropdown */}
        <div className="flex items-center gap-1 bg-zinc-800/60 rounded-lg px-2 py-0.5 border border-zinc-700/60">
          <Type className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="bg-transparent text-zinc-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value={12} className="bg-zinc-900">12px</option>
            <option value={14} className="bg-zinc-900">14px</option>
            <option value={16} className="bg-zinc-900">16px</option>
            <option value={18} className="bg-zinc-900">18px</option>
          </select>
        </div>

        {/* Stepping controls */}
        <div className="hidden xl:flex items-center gap-1">
          <button
            onClick={() => stepToPhase('lexical')}
            disabled={isCompiling}
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition text-[11px] border border-zinc-700"
            title="Step through to Lexer output"
          >
            Step: Lex
          </button>
          <button
            onClick={() => stepToPhase('syntax')}
            disabled={isCompiling}
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition text-[11px] border border-zinc-700"
            title="Step through to Syntax AST"
          >
            Step: Syntax
          </button>
          <button
            onClick={() => stepToPhase('semantic')}
            disabled={isCompiling}
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition text-[11px] border border-zinc-700"
            title="Step through to Semantic Analysis"
          >
            Step: Semantic
          </button>
        </div>

        {/* Primary Compile button */}
        <button
          onClick={() => compileAll()}
          disabled={isCompiling}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow shadow-indigo-500/20 active:scale-95 transition disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Compile</span>
          <span className="hidden sm:inline text-[10px] text-indigo-200 bg-indigo-700/50 px-1 py-0.2 rounded font-mono">
            Ctrl+↵
          </span>
        </button>
      </div>
    </div>
  );
};
