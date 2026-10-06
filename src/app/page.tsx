'use client';

import React, { useEffect } from 'react';
import { CodeEditor } from '@/components/CodeEditor/CodeEditor';
import { PipelineVisualizer } from '@/components/Pipeline/PipelineVisualizer';
import { TokenList } from '@/components/TokenList/TokenList';
import { SyntaxTreeViewer } from '@/components/SyntaxTree/SyntaxTreeViewer';
import { SymbolTableViewer } from '@/components/SymbolTable/SymbolTableViewer';
import { IRViewer } from '@/components/Pipeline/IRViewer';
import { OptimizerViewer } from '@/components/Pipeline/OptimizerViewer';
import { TargetCodeViewer } from '@/components/Pipeline/TargetCodeViewer';
import { DebuggerPanel } from '@/components/Debugger/DebuggerPanel';
import { ErrorPanel } from '@/components/ErrorPanel/ErrorPanel';
import { InfoPanel } from '@/components/InfoPanel/InfoPanel';
import { HistoryModal } from '@/components/common/HistoryModal';
import { SettingsModal } from '@/components/common/SettingsModal';
import { ExportModal } from '@/components/common/ExportModal';
import { useCompilerStore, CompilerPhaseKey } from '@/lib/store/useCompilerStore';
import {
  Binary,
  Network,
  Database,
  ListTree,
  Zap,
  Cpu,
  Activity,
  Terminal,
  Info,
} from 'lucide-react';

export default function Home() {
  const {
    initFromStorage,
    compileAll,
    activePhase,
    setActivePhase,
    tokens,
    ast,
    symbolTable,
    tac,
    optimizations,
    assembly,
    errors,
  } = useCompilerStore();

  // Initialize store from localStorage after mount & compile on initial render
  useEffect(() => {
    initFromStorage();
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
      key: 'intermediate',
      label: 'Intermediate (TAC)',
      icon: ListTree,
      count: tac.length,
      badgeVariant: 'purple',
    },
    {
      key: 'optimizer',
      label: 'Optimizer',
      icon: Zap,
      count: optimizations.length,
      badgeVariant: 'amber',
    },
    {
      key: 'target',
      label: 'Target Code',
      icon: Cpu,
      count: assembly.length,
      badgeVariant: 'blue',
    },
    {
      key: 'debugger',
      label: 'Virtual CPU',
      icon: Activity,
      badgeVariant: 'emerald',
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
      case 'intermediate':
        return <IRViewer />;
      case 'optimizer':
        return <OptimizerViewer />;
      case 'target':
        return <TargetCodeViewer />;
      case 'debugger':
        return <DebuggerPanel />;
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
        {/* Left Column: Monaco Code Editor (5 cols on lg, 5 on xl) */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col h-[600px] lg:h-[calc(100vh-210px)]">
          <CodeEditor />
        </div>

        {/* Right Column: Visualization Tabs & Inspector (7 cols on lg, 7 on xl) */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col h-[600px] lg:h-[calc(100vh-200px)] bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors duration-150">
          {/* Tab Header Bar */}
          <div className="flex items-center justify-between px-3 bg-slate-50 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800 overflow-x-auto scrollbar-thin">
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
                            : tab.badgeVariant === 'purple'
                            ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                            : tab.badgeVariant === 'amber'
                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            : tab.badgeVariant === 'blue'
                            ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
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

      {/* Modals */}
      <HistoryModal />
      <SettingsModal />
      <ExportModal />
    </div>
  );
}
