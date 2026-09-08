'use client';

import React from 'react';
import { useCompilerStore, CompilerPhaseKey } from '@/lib/store/useCompilerStore';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Layers,
  Sparkles,
  Lock,
} from 'lucide-react';

interface PhaseCardProps {
  phaseKey: CompilerPhaseKey;
  stepNumber: number;
  title: string;
  subtitle: string;
  itemUnit: string;
  isPhase2?: boolean;
}

export const PhaseCard: React.FC<PhaseCardProps> = ({
  phaseKey,
  stepNumber,
  title,
  subtitle,
  itemUnit,
  isPhase2 = false,
}) => {
  const { activePhase, setActivePhase, phases } = useCompilerStore();
  const phaseData = phases[phaseKey as keyof typeof phases] || {
    status: 'idle',
    executionTimeMs: 0,
    itemCount: 0,
  };

  const isActive = activePhase === phaseKey;

  const getStatusBadge = () => {
    if (isPhase2) {
      return (
        <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
          <Lock className="w-2.5 h-2.5" /> Phase 2
        </span>
      );
    }

    switch (phaseData.status) {
      case 'success':
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Pass
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" /> Error
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3 h-3" /> Warning
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse">
            Running...
          </span>
        );
      default:
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
            Idle
          </span>
        );
    }
  };

  return (
    <button
      onClick={() => setActivePhase(phaseKey)}
      className={`relative flex-1 min-w-[150px] p-3 text-left rounded-xl border transition-all duration-200 ${
        isActive
          ? 'bg-zinc-900/90 border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
          : 'bg-zinc-950/60 hover:bg-zinc-900/50 border-zinc-800/80'
      }`}
    >
      {/* Top row: step number + status */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
            isActive
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {stepNumber}
        </span>
        {getStatusBadge()}
      </div>

      {/* Title & subtitle */}
      <h3 className="font-medium text-xs text-zinc-200 tracking-tight leading-snug">
        {title}
      </h3>
      <p className="text-[11px] text-zinc-400 mt-0.5">{subtitle}</p>

      {/* Metrics footer */}
      <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
        <div>
          {phaseData.itemCount > 0 ? (
            <span className="text-zinc-300 font-semibold">
              {phaseData.itemCount} {itemUnit}
            </span>
          ) : (
            <span>-</span>
          )}
        </div>
        {phaseData.executionTimeMs > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            <span>{phaseData.executionTimeMs}ms</span>
          </div>
        )}
      </div>
    </button>
  );
};
