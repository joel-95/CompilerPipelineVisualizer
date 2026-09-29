'use client';

import React, { useState } from 'react';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import { TreeNode } from './TreeNode';
import { Network, Search, ChevronsDown, ChevronsUp, Code, ListTree } from 'lucide-react';

export const SyntaxTreeViewer: React.FC = () => {
  const { ast } = useCompilerStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [forceExpand, setForceExpand] = useState<boolean | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'tree' | 'json'>('tree');

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800/80 overflow-hidden shadow-2xs transition-colors">
      {/* Header controls */}
      <div className="p-2.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Network className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
            Abstract Syntax Tree (AST)
          </h3>
          {ast && (
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
              ({ast.body.length} root nodes)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search nodes */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 dark:text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search AST..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs pl-7 pr-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 w-32 sm:w-44 shadow-2xs"
            />
          </div>

          {/* Expand/Collapse All */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-zinc-800/80 p-0.5 rounded-md border border-slate-200 dark:border-zinc-700/60">
            <button
              onClick={() => setForceExpand(true)}
              className="p-1 rounded hover:bg-white dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition"
              title="Expand All Nodes"
            >
              <ChevronsDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setForceExpand(false)}
              className="p-1 rounded hover:bg-white dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition"
              title="Collapse All Nodes"
            >
              <ChevronsUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Switch Tree / JSON */}
          <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-md border border-slate-200 dark:border-zinc-700">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-2 py-0.5 rounded text-xs transition flex items-center gap-1 ${
                viewMode === 'tree'
                  ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white font-medium shadow-2xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <ListTree className="w-3 h-3" />
              <span>Tree</span>
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-2 py-0.5 rounded text-xs transition flex items-center gap-1 ${
                viewMode === 'json'
                  ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white font-medium shadow-2xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-auto p-3 max-h-[480px]">
        {!ast ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-zinc-500 text-xs font-mono">
            No Syntax Tree built yet. Click "Compile" or "Run Pipeline".
          </div>
        ) : viewMode === 'json' ? (
          <pre className="text-[11px] font-mono bg-slate-50 dark:bg-zinc-900/80 p-3 rounded-lg text-emerald-700 dark:text-emerald-400 overflow-auto max-h-[440px] border border-slate-200 dark:border-zinc-800">
            {JSON.stringify(ast, null, 2)}
          </pre>
        ) : (
          <div className="space-y-1">
            <TreeNode
              node={ast}
              depth={0}
              searchTerm={searchTerm}
              forceExpand={forceExpand}
            />
          </div>
        )}
      </div>
    </div>
  );
};
