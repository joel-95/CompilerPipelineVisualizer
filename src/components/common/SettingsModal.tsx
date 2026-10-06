'use client';

import React from 'react';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import {
  X,
  Sliders,
  Sun,
  Moon,
  Type,
  Zap,
  RotateCcw,
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    fontSize,
    setFontSize,
    theme,
    toggleTheme,
    autoCompile,
    setAutoCompile,
    simulationSpeed,
    setSimulationSpeed,
  } = useCompilerStore();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Compiler Workbench Settings
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Configure editor, theme, and simulation parameters
              </p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">Color Theme</span>
              <p className="text-[11px] text-slate-500">Switch between light and dark workspace theme</p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              <span className="capitalize">{theme}</span>
            </button>
          </div>

          {/* Font Size */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">Editor Font Size</span>
              <p className="text-[11px] text-slate-500">Adjust code editor typography size</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
              {[12, 14, 16, 18].map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition ${
                    fontSize === size
                      ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>

          {/* Auto Compile */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">Live Auto-Compile</span>
              <p className="text-[11px] text-slate-500">Recompile automatically as you type</p>
            </div>
            <button
              onClick={() => setAutoCompile(!autoCompile)}
              className={`w-11 h-6 rounded-full transition-colors p-1 relative flex items-center ${
                autoCompile ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  autoCompile ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Step Speed */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">Simulation Step Speed</span>
              <p className="text-[11px] text-slate-500">Delay per execution step in debugger</p>
            </div>
            <select
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(Number(e.target.value))}
              className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200 outline-none"
            >
              <option value={1500}>1500ms (Slow)</option>
              <option value={800}>800ms (Normal)</option>
              <option value={300}>300ms (Fast)</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={() => setSettingsOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition text-xs shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
