'use client';

import React from 'react';
import Link from 'next/link';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import {
  Binary,
  BookOpen,
  Moon,
  Sun,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isCompiling, errors, phases, theme, toggleTheme, compileAll } = useCompilerStore();

  const totalErrors = errors.filter((e) => e.severity === 'ERROR').length;
  const totalWarnings = errors.filter((e) => e.severity === 'WARNING').length;

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Binary className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Compiler Pipeline Visualizer
              </h1>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Phase 1
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Interactive Educational Architecture • Ebin • Kevin • Aadi • Joel
            </p>
          </div>
        </div>

        {/* Center: Live Status Indicator */}
        <div className="hidden md:flex items-center gap-3">
          {isCompiling ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono animate-pulse">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Pipeline...</span>
            </div>
          ) : totalErrors > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{totalErrors} Compile Error{totalErrors > 1 ? 's' : ''}</span>
            </div>
          ) : phases.lexical.status === 'success' ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pipeline Validated</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-400 text-xs font-mono">
              <Layers className="w-3.5 h-3.5" />
              <span>Ready for Input</span>
            </div>
          )}
        </div>

        {/* Right: Action buttons, Docs, Theme */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => compileAll()}
            disabled={isCompiling}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition text-xs font-medium text-white shadow-md shadow-indigo-600/30 disabled:opacity-50"
            title="Compile code (Ctrl+Enter)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Run Pipeline</span>
          </button>

          <Link
            href="/docs"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Docs & API</span>
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 transition"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
