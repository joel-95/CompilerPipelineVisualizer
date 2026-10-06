'use client';

import React, { useState } from 'react';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import {
  X,
  Download,
  Copy,
  Check,
  FileCode,
  FileText,
} from 'lucide-react';

export const ExportModal: React.FC = () => {
  const { isExportOpen, setExportOpen, exportAsJSON, exportAsMarkdown } = useCompilerStore();
  const [format, setFormat] = useState<'json' | 'markdown'>('markdown');
  const [copied, setCopied] = useState(false);

  if (!isExportOpen) return null;

  const content = format === 'json' ? exportAsJSON() : exportAsMarkdown();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = format === 'json' ? 'compiler-pipeline-session.json' : 'compiler-report.md';
    const blob = new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Export Compilation Report & Artefacts
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Download JSON session data or formatted Markdown report
              </p>
            </div>
          </div>
          <button
            onClick={() => setExportOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 bg-slate-200/80 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => setFormat('markdown')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
                format === 'markdown'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown Report (.md)</span>
            </button>
            <button
              onClick={() => setFormat('json')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
                format === 'json'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Full JSON Session (.json)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 text-xs font-medium transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Code Preview */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed">
          <pre>{content}</pre>
        </div>
      </div>
    </div>
  );
};
