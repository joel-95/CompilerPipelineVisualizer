'use client';

import React, { useState } from 'react';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Lightbulb,
  Code,
  Terminal,
} from 'lucide-react';

export const ErrorPanel: React.FC = () => {
  const { errors } = useCompilerStore();
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'ERROR' | 'WARNING'>('ALL');

  const filteredErrors = errors.filter((err) => {
    if (severityFilter === 'ALL') return true;
    return err.severity === severityFilter;
  });

  const errorCount = errors.filter((e) => e.severity === 'ERROR').length;
  const warningCount = errors.filter((e) => e.severity === 'WARNING').length;

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold text-zinc-200">
            Diagnostics & Error Logs
          </h3>
          <div className="flex items-center gap-1 text-[11px] font-mono">
            <span className="px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
              {errorCount} Errors
            </span>
            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {warningCount} Warnings
            </span>
          </div>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded-lg border border-zinc-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="ERROR">Errors Only</option>
            <option value="WARNING">Warnings Only</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-3 space-y-2.5 max-h-[480px]">
        {filteredErrors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-xs font-mono">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mb-2" />
            <p className="text-zinc-400">Zero diagnostic errors reported.</p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Source code successfully conforms to lexical, syntactic, and semantic rules.
            </p>
          </div>
        ) : (
          filteredErrors.map((err) => {
            const isError = err.severity === 'ERROR';
            return (
              <div
                key={err.id}
                className={`p-3 rounded-lg border text-xs transition ${
                  isError
                    ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                    : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                }`}
              >
                {/* Error Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono">
                    {isError ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        isError
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {err.phase} {err.severity}
                    </span>
                    <span className="text-zinc-400 text-[11px]">
                      Line {err.line}, Column {err.column}
                    </span>
                  </div>
                </div>

                {/* Message */}
                <p className="mt-1.5 text-zinc-200 font-sans leading-relaxed">
                  {err.message}
                </p>

                {/* Code Snippet */}
                {err.codeSnippet && (
                  <pre className="mt-2 p-2 bg-zinc-900/90 rounded border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
                    {err.codeSnippet}
                  </pre>
                )}

                {/* Suggestion */}
                {err.suggestion && (
                  <div className="mt-2 flex items-start gap-1.5 text-[11px] text-zinc-400 bg-zinc-900/50 p-2 rounded border border-zinc-800/80">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-zinc-300">Suggestion:</strong>{' '}
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
