'use client';

import React, { useState } from 'react';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Lightbulb,
  Terminal,
  ArrowUpRight,
} from 'lucide-react';

export const ErrorPanel: React.FC = () => {
  const { errors, setHighlightedLine } = useCompilerStore();
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'ERROR' | 'WARNING'>('ALL');
  const [phaseFilter, setPhaseFilter] = useState<string>('ALL');

  const filteredErrors = errors.filter((err) => {
    if (severityFilter !== 'ALL' && err.severity !== severityFilter) return false;
    if (phaseFilter !== 'ALL' && err.phase !== phaseFilter) return false;
    return true;
  });

  const errorCount = errors.filter((e) => e.severity === 'ERROR').length;
  const warningCount = errors.filter((e) => e.severity === 'WARNING').length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-2xs transition-colors">
      {/* Header bar */}
      <div className="p-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
            Compiler Diagnostics & Diagnostics Engine
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 font-bold">
              {errorCount} Errors
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 font-bold">
              {warningCount} Warnings
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700 outline-none"
          >
            <option value="ALL">All Phases</option>
            <option value="LEXICAL">Lexical</option>
            <option value="SYNTAX">Syntax</option>
            <option value="SEMANTIC">Semantic</option>
            <option value="STATIC_ANALYSIS">Static Analysis</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700 outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="ERROR">Errors Only</option>
            <option value="WARNING">Warnings Only</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-3 space-y-2.5">
        {filteredErrors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-zinc-500 text-xs font-mono">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mb-2" />
            <p className="text-slate-700 dark:text-zinc-300 font-medium">No diagnostic errors reported</p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
              Source code successfully passed lexical, syntactic, semantic, and static analysis.
            </p>
          </div>
        ) : (
          filteredErrors.map((err) => {
            const isError = err.severity === 'ERROR';
            return (
              <div
                key={err.id}
                className={`p-3 rounded-xl border text-xs transition cursor-pointer hover:shadow-xs ${
                  isError
                    ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30 text-rose-900 dark:text-rose-200 hover:border-rose-400'
                    : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 hover:border-amber-400'
                }`}
                onClick={() => setHighlightedLine(err.line)}
                title="Click to highlight line in editor"
              >
                {/* Error Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono">
                    {isError ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        isError
                          ? 'bg-rose-200/70 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300/60'
                          : 'bg-amber-200/70 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300/60'
                      }`}
                    >
                      {err.phase} {err.severity}
                    </span>
                    <span className="text-slate-500 dark:text-zinc-400 text-[11px]">
                      Line {err.line}, Column {err.column}
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                    <span>Jump to line</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>

                {/* Message */}
                <p className="mt-1.5 text-slate-800 dark:text-zinc-200 font-sans leading-relaxed font-medium">
                  {err.message}
                </p>

                {/* Code Snippet */}
                {err.codeSnippet && (
                  <pre className="mt-2 p-2 bg-white dark:bg-zinc-900 rounded-lg border border-rose-200/80 dark:border-zinc-800 text-[11px] font-mono text-slate-800 dark:text-zinc-300 overflow-x-auto shadow-2xs">
                    {err.codeSnippet}
                  </pre>
                )}

                {/* Suggestion */}
                {err.suggestion && (
                  <div className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-zinc-400 bg-white/80 dark:bg-zinc-900/60 p-2 rounded-lg border border-slate-200 dark:border-zinc-800">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-800 dark:text-zinc-300">Suggestion:</strong>{' '}
                      {err.suggestion}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
