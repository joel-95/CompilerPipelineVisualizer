'use client';

import React, { useEffect } from 'react';
import { CodeEditor } from '@/components/CodeEditor/CodeEditor';
import { PipelineVisualizer } from '@/components/Pipeline/PipelineVisualizer';
import { TokenList } from '@/components/TokenList/TokenList';
import { SyntaxTreeViewer } from '@/components/SyntaxTree/SyntaxTreeViewer';
import { SymbolTableViewer } from '@/components/SymbolTable/SymbolTableViewer';
import { ErrorPanel } from '@/components/ErrorPanel/ErrorPanel';
import { InfoPanel } from '@/components/InfoPanel/InfoPanel';
import { useCompilerStore, CompilerPhaseKey } from '@/lib/store/useCompilerStore';
import {
  Binary,
  Network,
  Database,
  Terminal,
  Info,
  Layers,
} from 'lucide-react';

export default function Home() {
  const {
    compileAll,
    activePhase,
    setActivePhase,
    tokens,
    ast,
    symbolTable,
    errors,
  } = useCompilerStore();

  // Auto compile on initial render
  useEffect(() => {
    compileAll();
  }, []);

  const errorCount = errors.filter((e) => e.severity === 'ERROR').length;

  const tabs: {
    key: CompilerPhaseKey | 'errors' | 'inspector';
    label: string;
    icon: any;
    count?: number;
    badgeVariant?: 'purple' | 'blue' | 'emerald' | 'amber' | 'rose' | 'gray';
  }[] = [
    {
      key: 'lexical',
      label: 'Tokens',
      icon: Binary,
      count: tokens.filter((t) => t.type !== 'EOF').length,
    },
    {
      key: 'syntax',
      label: 'Syntax Tree',
      icon: Network,
      count: ast ? ast.body.length : 0,
    },
    {
      key: 'semantic',
      label: 'Symbol Table',
      icon: Database,
      count: symbolTable.length,
    },
    {
      key: 'errors',
      label: 'Diagnostics',
      icon: Terminal,
      count: errors.length,
      badgeVariant: errorCount > 0 ? 'rose' : 'gray',
    },
    {
      key: 'inspector',
      label: 'Inspector',
      icon: Info,
    },
  ];

  const renderTabContent = () => {
    switch (activePhase) {
      case 'lexical':
        return <TokenList />;
      case 'syntax':
        return <SyntaxTreeViewer />;
      case 'semantic':
        return <SymbolTableViewer />;
      case 'errors' as any:
        return <ErrorPanel />;
      case 'inspector' as any:
        return <InfoPanel />;
      default:
        return <TokenList />;
    }
  };

  return (
    <div className="flex flex-col gap-4 flex-1">
      {/* Top: Pipeline Stages Flow */}
      <PipelineVisualizer />

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-stretch">
        {/* Left Column: Monaco Code Editor (5 cols on lg, 6 on xl) */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col h-[580px] lg:h-[calc(100vh-210px)]">
          <CodeEditor />
        </div>

        {/* Right Column: Visualization Tabs & Inspector (7 cols on lg, 7 on xl) */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col h-[580px] lg:h-[calc(100vh-200px)] bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors duration-150">
          {/* Tab Header Bar */}
          <div className="flex items-center justify-between px-3 bg-slate-50 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 py-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activePhase === (tab.key as any);
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActivePhase(tab.key as any)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                      isActive
                        ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-zinc-700'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-medium ${
                          tab.badgeVariant === 'rose'
                            ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold'
                            : isActive
                            ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                            : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-hidden p-2.5 bg-slate-50/50 dark:bg-zinc-950/70">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
