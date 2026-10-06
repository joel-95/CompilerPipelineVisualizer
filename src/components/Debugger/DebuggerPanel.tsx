'use client';

import React from 'react';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Terminal,
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const DebuggerPanel: React.FC = () => {
  const {
    simulationSteps,
    currentStepIndex,
    isPlayingSimulation,
    simulationSpeed,
    metrics,
    nextStep,
    prevStep,
    setStepIndex,
    togglePlaySimulation,
    setSimulationSpeed,
    initSimulation,
  } = useCompilerStore();

  if (!simulationSteps || simulationSteps.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-400 dark:text-zinc-500 text-sm gap-2">
        <Activity className="w-8 h-8 text-indigo-500/50 animate-pulse" />
        <p>No execution trace found. Run the compiler and click &quot;Initialize Simulation&quot;.</p>
        <button
          onClick={initSimulation}
          className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-xs"
        >
          Initialize Virtual CPU
        </button>
      </div>
    );
  }

  const currentStep = simulationSteps[currentStepIndex] || simulationSteps[0];

  return (
    <div className="h-full flex flex-col gap-3 text-xs font-sans overflow-hidden">
      {/* Simulation Playback Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 disabled:opacity-40 transition"
            title="Previous step"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={togglePlaySimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition shadow-xs"
          >
            {isPlayingSimulation ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Step Play</span>
              </>
            )}
          </button>

          <button
            onClick={nextStep}
            disabled={currentStepIndex >= simulationSteps.length - 1}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 disabled:opacity-40 transition"
            title="Next step"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setStepIndex(0)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 transition"
            title="Reset to step 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Counter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
            Step <strong className="text-indigo-600 dark:text-indigo-400">{currentStepIndex + 1}</strong> of{' '}
            {simulationSteps.length}
          </span>
          <div className="w-32 bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-200"
              style={{ width: `${((currentStepIndex + 1) / simulationSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 dark:text-zinc-400">Speed:</span>
          <select
            value={simulationSpeed}
            onChange={(e) => setSimulationSpeed(Number(e.target.value))}
            className="bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-0.5 text-xs text-slate-700 dark:text-zinc-300 outline-none"
          >
            <option value={1500}>0.5x (Slow)</option>
            <option value={800}>1x (Normal)</option>
            <option value={300}>2x (Fast)</option>
          </select>
        </div>
      </div>

      {/* Active Instruction Highlight Card */}
      <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs">
            PC:{currentStep.instructionIndex + 1}
          </div>
          <div>
            <div className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold uppercase tracking-wider">
              Executing IR Instruction
            </div>
            <div className="font-mono text-sm font-bold text-slate-900 dark:text-zinc-100">
              {currentStep.instructionText}
            </div>
          </div>
        </div>
        {currentStep.sourceLineRef && (
          <span className="px-2 py-1 rounded bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-400 font-mono text-xs border border-indigo-200 dark:border-indigo-800">
            Source Line {currentStep.sourceLineRef}
          </span>
        )}
      </div>

      {/* Main Grid: Registers, Variables, Memory, and Console */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 overflow-hidden">
        {/* Left: CPU Registers (6 cols) */}
        <div className="md:col-span-6 flex flex-col border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 overflow-hidden">
          <div className="bg-slate-50 dark:bg-zinc-900 px-3 py-2 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-2 font-semibold text-slate-700 dark:text-zinc-300">
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            <span>Virtual CPU Registers</span>
          </div>

          <div className="p-3 overflow-auto flex-1 grid grid-cols-2 gap-2 font-mono">
            {Object.entries(currentStep.registers).map(([reg, val]) => (
              <div
                key={reg}
                className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between"
              >
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">%{reg}</span>
                <span className="text-slate-900 dark:text-zinc-100 font-semibold">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Variable State & Terminal Output (6 cols) */}
        <div className="md:col-span-6 flex flex-col gap-3 overflow-hidden">
          {/* Active Variable Values */}
          <div className="flex-1 flex flex-col border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 overflow-hidden">
            <div className="bg-slate-50 dark:bg-zinc-900 px-3 py-2 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-2 font-semibold text-slate-700 dark:text-zinc-300">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>Variable Watcher</span>
            </div>
            <div className="p-2.5 overflow-auto flex-1 font-mono space-y-1.5">
              {Object.keys(currentStep.memory).length === 0 ? (
                <p className="text-slate-400 italic text-center py-4">No variable states recorded yet.</p>
              ) : (
                Object.entries(currentStep.memory).map(([varName, val]) => (
                  <div
                    key={varName}
                    className="flex items-center justify-between px-2.5 py-1 rounded bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80"
                  >
                    <span className="text-slate-700 dark:text-zinc-300 font-bold">{varName}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{String(val)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Console / Output Box */}
          <div className="h-28 flex flex-col border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-950 text-emerald-400 overflow-hidden font-mono text-[11px]">
            <div className="bg-zinc-900 px-3 py-1.5 border-b border-zinc-800 flex items-center gap-1.5 text-zinc-400 text-xs">
              <Terminal className="w-3.5 h-3.5" />
              <span>Program Standard Output</span>
            </div>
            <div className="p-2.5 overflow-auto flex-1 space-y-1">
              {currentStep.output.length === 0 ? (
                <span className="text-zinc-600 italic">Program running... No output yet.</span>
              ) : (
                currentStep.output.map((out, idx) => <div key={idx}>{out}</div>)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
