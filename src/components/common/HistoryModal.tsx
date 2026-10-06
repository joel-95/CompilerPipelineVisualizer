'use client';

import React, { useState } from 'react';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import {
  X,
  History,
  Trash2,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Search,
} from 'lucide-react';

export const HistoryModal: React.FC = () => {
  const {
    isHistoryOpen,
    setHistoryOpen,
    sessions,
    isLoadingSessions,
    loadSessionById,
    deleteSessionById,
    saveCurrentSession,
  } = useCompilerStore();

  const [search, setSearch] = useState('');

  if (!isHistoryOpen) return null;

  const filtered = sessions.filter(
    (s) =>
      s.sourceSnippet.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Compilation Session History
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Inspect, reload, and manage past compilation runs
              </p>
            </div>
          </div>
          <button
            onClick={() => setHistoryOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Search Bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search sessions by code snippet or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={() => saveCurrentSession()}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-xs shrink-0"
          >
            Save Current Session
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-auto p-4 space-y-2.5">
          {isLoadingSessions ? (
            <div className="text-center py-10 text-slate-400 text-xs">Loading sessions...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No compilation sessions found. Save a compilation to view it here.
            </div>
          ) : (
            filtered.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 flex items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-zinc-700 transition"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        s.status === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {s.status === 'success' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {s.status.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(s.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="font-mono text-xs text-slate-800 dark:text-zinc-200 truncate">
                    {s.sourceSnippet}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span>{s.tokenCount} tokens</span>
                    <span>•</span>
                    <span>{s.irCount} TAC lines</span>
                    {s.errorCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-rose-600 font-medium">{s.errorCount} errors</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      loadSessionById(s.id);
                      setHistoryOpen(false);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-medium transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Load</span>
                  </button>

                  <button
                    onClick={() => deleteSessionById(s.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
