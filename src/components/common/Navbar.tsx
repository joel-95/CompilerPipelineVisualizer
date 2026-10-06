'use client';

import React from 'react';
import Link from 'next/link';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import {
  BookOpen,
  Moon,
  Sun,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  Terminal,
} from 'lucide-react';

export const CompilerLogo: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <img
      src="/iconLightmode.png"
      alt="Compiler Pipeline Visualizer"
      className="w-full h-full object-contain block dark:hidden"
    />
    <img
      src="/iconDarkMode.png"
      alt="Compiler Pipeline Visualizer"
      className="w-full h-full object-contain hidden dark:block"
    />
  </div>
);

export const Navbar: React.FC = () => {
  const { isCompiling, errors, phases, theme, toggleTheme, compileAll } = useCompilerStore();

  const totalErrors = errors.filter((e) => e.severity === 'ERROR').length;

  return (
    <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-150">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding & Minimal Version Tag */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center shadow-xs overflow-hidden p-1 transition-all hover:scale-105">
            <CompilerLogo className="w-8 h-8" />
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/" className="font-bold text-base tracking-tight text-slate-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Compiler Pipeline Visualizer
            </Link>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700/60 hidden sm:inline-block">
              Workbench
            </span>
          </div>
        </div>

        {/* Center: Live Status Indicator */}
        <div className="hidden md:flex items-center gap-3">
          {isCompiling ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 text-xs font-mono animate-pulse">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Pipeline...</span>
            </div>
          ) : totalErrors > 0 ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{totalErrors} Compile Error{totalErrors > 1 ? 's' : ''}</span>
            </div>
          ) : phases.lexical.status === 'success' ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pipeline Validated</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 text-xs font-mono">
              <Terminal className="w-3.5 h-3.5" />
              <span>Ready</span>
            </div>
          )}
        </div>

        {/* Right: Action buttons, Docs, Theme */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => compileAll()}
            disabled={isCompiling}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-xs font-medium text-white shadow-sm transition disabled:opacity-50"
            title="Compile code (Ctrl+Enter)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Pipeline</span>
            <kbd className="hidden lg:inline-block text-[10px] bg-indigo-700/60 px-1.5 py-0.2 rounded text-indigo-100 font-mono ml-0.5">
              Ctrl+↵
            </kbd>
          </button>

          <Link
            href="/docs"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 text-xs font-medium transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Docs</span>
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 border border-slate-200 dark:border-zinc-800 transition"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};
