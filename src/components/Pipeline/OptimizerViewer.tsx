'use client';

import React, { useState } from 'react';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import { TACInstruction } from '@/lib/compiler/types';
import { IRGenerator } from '@/lib/compiler/IRGenerator';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  TrendingDown,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const OptimizerViewer: React.FC = () => {
  const { tac, optimizedTac, optimizations, metrics } = useCompilerStore();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'diff' | 'passes' | 'split'>('diff');

  if (!tac || tac.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-400 dark:text-zinc-500 text-sm gap-2">
        <Sparkles className="w-8 h-8 text-amber-500/50 animate-pulse" />
        <p>No optimization data available. Compile code to view optimization passes.</p>
      </div>
    );
  }

  const filteredRecords = activeFilter === 'all'
    ? optimizations
    : optimizations.filter((r) => r.kind === activeFilter);

  const getPassBadgeColor = (kind: string) => {
    switch (kind) {
      case 'constant-folding':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'constant-propagation':
        return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'copy-propagation':
        return 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'dead-code-elimination':
        return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case 'common-subexpression-elimination':
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700';
    }
  };

  return (
    <div className="h-full flex flex-col gap-3 font-sans text-xs overflow-hidden">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 flex items-center gap-2.5 shadow-xs">
          <div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Code Reduction</span>
            <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              {metrics.sizeReductionPercent}%
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 flex items-center gap-2.5 shadow-xs">
          <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Passes Applied</span>
            <p className="text-base font-bold text-slate-800 dark:text-zinc-100 font-mono">
              {optimizations.length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 flex items-center gap-2.5 shadow-xs">
          <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Before / After TAC</span>
            <p className="text-base font-bold text-slate-800 dark:text-zinc-100 font-mono">
              {tac.length} → {optimizedTac.length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 flex items-center gap-2.5 shadow-xs">
          <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Dead Code Saved</span>
            <p className="text-base font-bold text-slate-800 dark:text-zinc-100 font-mono">
              {tac.length - optimizedTac.length} instrs
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
          <button
            onClick={() => setViewMode('diff')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              viewMode === 'diff'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            Unified Diff
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              viewMode === 'split'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            Side-by-Side
          </button>
          <button
            onClick={() => setViewMode('passes')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              viewMode === 'passes'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            Optimization Logs ({optimizations.length})
          </button>
        </div>

        {/* Filter Dropdown */}
        {viewMode === 'passes' && (
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-zinc-300 outline-none"
            >
              <option value="all">All Passes ({optimizations.length})</option>
              <option value="constant-folding">Constant Folding</option>
              <option value="constant-propagation">Constant Propagation</option>
              <option value="copy-propagation">Copy Propagation</option>
              <option value="common-subexpression-elimination">CSE</option>
              <option value="dead-code-elimination">Dead Code Elimination</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
        {viewMode === 'diff' && (
          <div className="font-mono text-xs space-y-1">
            <div className="text-[11px] text-slate-400 dark:text-zinc-500 mb-2 font-sans font-medium">
              Optimized Three-Address Code with optimization indicators:
            </div>
            {optimizedTac.map((instr, idx) => (
              <div
                key={instr.id}
                className="flex items-center gap-3 py-1 px-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition"
              >
                <span className="w-8 text-slate-400 dark:text-zinc-600 text-right select-none">{idx + 1}</span>
                <span className="text-slate-800 dark:text-zinc-200 flex-1">
                  {IRGenerator.format(instr)}
                </span>
                {instr.sourceLineRef && (
                  <span className="text-[10px] text-slate-400 dark:text-zinc-600 bg-slate-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded">
                    L{instr.sourceLineRef}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {viewMode === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Raw TAC */}
            <div className="flex flex-col border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <div className="bg-slate-100 dark:bg-zinc-900 px-3 py-1.5 border-b border-slate-200 dark:border-zinc-800 font-semibold text-slate-700 dark:text-zinc-300">
                Original IR (Raw TAC) — {tac.length} instrs
              </div>
              <div className="p-2 overflow-auto font-mono text-xs flex-1 space-y-1">
                {tac.map((i, idx) => (
                  <div key={i.id} className="flex gap-2 text-slate-700 dark:text-zinc-300">
                    <span className="w-6 text-slate-400 text-right">{idx + 1}</span>
                    <span>{IRGenerator.format(i)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimized TAC */}
            <div className="flex flex-col border border-emerald-200 dark:border-emerald-950 rounded-lg overflow-hidden">
              <div className="bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 border-b border-emerald-200 dark:border-emerald-900 font-semibold text-emerald-800 dark:text-emerald-300">
                Optimized IR (Clean TAC) — {optimizedTac.length} instrs
              </div>
              <div className="p-2 overflow-auto font-mono text-xs flex-1 space-y-1 bg-emerald-50/20 dark:bg-emerald-950/10">
                {optimizedTac.map((i, idx) => (
                  <div key={i.id} className="flex gap-2 text-emerald-900 dark:text-emerald-200">
                    <span className="w-6 text-emerald-600/60 text-right">{idx + 1}</span>
                    <span>{IRGenerator.format(i)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'passes' && (
          <div className="space-y-2.5">
            {filteredRecords.length === 0 ? (
              <p className="text-slate-400 text-center py-6">No optimization transformations recorded for this filter.</p>
            ) : (
              filteredRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40 space-y-2 hover:border-indigo-300 dark:hover:border-zinc-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${getPassBadgeColor(
                        rec.kind
                      )}`}
                    >
                      {rec.kind.toUpperCase().replace(/-/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">{rec.description}</span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs bg-white dark:bg-zinc-950 p-2 rounded-md border border-slate-200 dark:border-zinc-800/60">
                    <span className="text-rose-600 dark:text-rose-400 line-through shrink-0">{rec.before}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{rec.after}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
