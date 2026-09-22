'use client';

import React from 'react';
import { PhaseCard } from './PhaseCard';
import { ChevronRight } from 'lucide-react';

export const PipelineVisualizer: React.FC = () => {
  return (
    <div className="w-full bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors duration-150">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          Compiler Pipeline Architecture Flow
        </h2>
        <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
          Front-End Analysis Pipeline
        </span>
      </div>

      {/* Horizontal Scrollable Stages Flow */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <PhaseCard
          phaseKey="lexical"
          stepNumber={1}
          title="Lexical Analysis"
          subtitle="Token Stream"
          itemUnit="tokens"
        />

        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-zinc-600 shrink-0" />

        <PhaseCard
          phaseKey="syntax"
          stepNumber={2}
          title="Syntax Analysis"
          subtitle="Parse Tree (AST)"
          itemUnit="AST nodes"
        />

        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-zinc-600 shrink-0" />

        <PhaseCard
          phaseKey="semantic"
          stepNumber={3}
          title="Semantic Analysis"
          subtitle="Scope & Type Check"
          itemUnit="symbols"
        />

        <ChevronRight className="w-4 h-4 text-zinc-700 shrink-0" />

        <PhaseCard
          phaseKey="intermediate"
          stepNumber={4}
          title="Intermediate Code"
          subtitle="Three-Address Code"
          itemUnit="TAC lines"
          isPhase2={true}
        />

        <ChevronRight className="w-4 h-4 text-zinc-700 shrink-0" />

        <PhaseCard
          phaseKey="optimizer"
          stepNumber={5}
          title="Code Optimizer"
          subtitle="Dead Code & CSE"
          itemUnit="optimizations"
          isPhase2={true}
        />

        <ChevronRight className="w-4 h-4 text-zinc-700 shrink-0" />

        <PhaseCard
          phaseKey="target"
          stepNumber={6}
          title="Target Code Gen"
          subtitle="Assembly / Machine"
          itemUnit="instructions"
          isPhase2={true}
        />
      </div>
    </div>
  );
};
