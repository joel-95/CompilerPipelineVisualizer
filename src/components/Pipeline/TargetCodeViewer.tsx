'use client';

import React, { useState } from 'react';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import {
  Cpu,
  Database,
  Layers,
  Activity,
  Table,
  GitBranch,
} from 'lucide-react';

export const TargetCodeViewer: React.FC = () => {
  const { assembly, registerAllocation, metrics } = useCompilerStore();
  const [subView, setSubView] = useState<'asm' | 'registers' | 'graph' | 'stack'>('asm');

  if (!assembly || assembly.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-400 dark:text-zinc-500 text-sm gap-2">
        <Cpu className="w-8 h-8 text-indigo-500/50 animate-pulse" />
        <p>No target assembly generated. Run the compiler pipeline to view x86-64 code.</p>
      </div>
    );
  }

  const { allocations, spills, spillOffsets, interferenceGraph, liveRanges, registerPressure, maxPressure } = registerAllocation;

  return (
    <div className="h-full flex flex-col gap-3 text-xs font-sans overflow-hidden">
      {/* Target Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 flex items-center gap-2.5 shadow-xs">
          <div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Target Instructions</span>
            <p className="text-base font-bold text-slate-800 dark:text-zinc-100 font-mono">{assembly.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 flex items-center gap-2.5 shadow-xs">
          <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Max Reg Pressure</span>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {maxPressure} registers
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 flex items-center gap-2.5 shadow-xs">
          <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Allocated Variables</span>
            <p className="text-base font-bold text-purple-600 dark:text-purple-400 font-mono">
              {Object.keys(allocations).length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 flex items-center gap-2.5 shadow-xs">
          <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Spilled to Stack</span>
            <p className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono">{spills.length}</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg border border-slate-200 dark:border-zinc-800 shrink-0">
        <button
          onClick={() => setSubView('asm')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition ${
            subView === 'asm'
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
          }`}
        >
          x86-64 Assembly ({assembly.length})
        </button>

        <button
          onClick={() => setSubView('registers')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition ${
            subView === 'registers'
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
          }`}
        >
          Register Mapping ({Object.keys(allocations).length})
        </button>

        <button
          onClick={() => setSubView('graph')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition ${
            subView === 'graph'
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
          }`}
        >
          Interference Graph & Liveness
        </button>

        <button
          onClick={() => setSubView('stack')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition ${
            subView === 'stack'
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
          }`}
        >
          Stack Frame Layout
        </button>
      </div>

      {/* Main Sub-View Container */}
      <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
        {/* Assembly Code Listing */}
        {subView === 'asm' && (
          <div className="font-mono text-xs space-y-1">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800 text-[11px] text-slate-400 font-sans">
              <span>Address</span>
              <span className="flex-1 ml-10">Instruction</span>
              <span>Annotation</span>
            </div>
            {assembly.map((line) => (
              <div
                key={line.id}
                className={`flex items-center gap-4 py-1 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition ${
                  line.isLabel ? 'font-bold text-purple-600 dark:text-purple-400' : ''
                }`}
              >
                <span className="w-14 text-slate-400 dark:text-zinc-600 select-none text-[11px]">{line.address}</span>
                {line.isLabel ? (
                  <span className="flex-1">{line.labelName}:</span>
                ) : (
                  <span className="flex-1 ml-4 flex items-center gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold w-12">{line.opcode}</span>
                    <span className="text-slate-800 dark:text-zinc-200">{line.operands}</span>
                  </span>
                )}
                {line.comment && (
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500 italic">
                    ; {line.comment}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Register Allocations Table */}
        {subView === 'registers' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-zinc-200 mb-2">
                Variable to Physical Hardware Register Mapping
              </h3>
              <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-left font-mono">
                  <thead className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 text-[11px] text-slate-500 font-sans">
                    <tr>
                      <th className="p-2.5">Variable / Temporary</th>
                      <th className="p-2.5">Assigned Location</th>
                      <th className="p-2.5">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {Object.entries(allocations).map(([varName, reg]) => (
                      <tr key={varName} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                        <td className="p-2.5 font-bold text-slate-800 dark:text-zinc-200">{varName}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                            %{reg}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-500 dark:text-zinc-400 font-sans text-xs">
                          Hardware General Purpose Register
                        </td>
                      </tr>
                    ))}
                    {spills.map((spill) => (
                      <tr key={spill} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                        <td className="p-2.5 font-bold text-amber-600 dark:text-amber-400">{spill}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                            [rbp{spillOffsets[spill]}]
                          </span>
                        </td>
                        <td className="p-2.5 text-amber-600 dark:text-amber-400 font-sans text-xs">
                          Stack Memory Spill Slot
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Interference Graph & Liveness */}
        {subView === 'graph' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                Live Range Intervals
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">
                Instruction intervals where variables are actively held in scope:
              </p>
              <div className="space-y-1.5 border border-slate-200 dark:border-zinc-800 p-3 rounded-lg bg-slate-50/50 dark:bg-zinc-900/40 font-mono text-xs">
                {liveRanges.map((lr) => (
                  <div key={lr.variable} className="flex items-center gap-3">
                    <span className="w-16 font-bold text-indigo-600 dark:text-indigo-400">{lr.variable}</span>
                    <span className="text-slate-400 text-[11px] w-28">
                      Inst {lr.start + 1} → {lr.end + 1}
                    </span>
                    <div className="flex-1 bg-slate-200 dark:bg-zinc-800 h-3 rounded-full overflow-hidden relative">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{
                          marginLeft: `${(lr.start / Math.max(1, assembly.length)) * 100}%`,
                          width: `${Math.max(8, ((lr.end - lr.start + 1) / Math.max(1, assembly.length)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                Interference Graph Edges ({interferenceGraph.edges.length} conflicts)
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {interferenceGraph.edges.map(([u, v], idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-mono text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-1.5"
                  >
                    <span className="text-indigo-600 font-bold">{u}</span>
                    <span className="text-slate-400">↔</span>
                    <span className="text-purple-600 font-bold">{v}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stack Memory Layout */}
        {subView === 'stack' && (
          <div className="space-y-3 font-sans">
            <h3 className="font-semibold text-slate-800 dark:text-zinc-200">
              Stack Frame Memory Architecture
            </h3>
            <div className="max-w-md mx-auto border-2 border-slate-300 dark:border-zinc-700 rounded-xl overflow-hidden font-mono text-xs">
              <div className="bg-slate-200 dark:bg-zinc-800 p-2.5 text-center font-bold text-slate-700 dark:text-zinc-300 border-b border-slate-300 dark:border-zinc-700">
                Caller Return Address (+8)
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-950/60 p-2.5 text-center font-bold text-indigo-800 dark:text-indigo-300 border-b border-indigo-200 dark:border-indigo-900">
                Saved RBP Frame Pointer (0x00)
              </div>
              {spills.length > 0 ? (
                spills.map((spill, idx) => (
                  <div
                    key={spill}
                    className="bg-amber-50 dark:bg-amber-950/40 p-2.5 text-center border-b border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 font-semibold flex justify-between px-4"
                  >
                    <span>Spill [{spill}]</span>
                    <span>rbp{spillOffsets[spill]}</span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-slate-400 italic">
                  No spilled variables (all held in CPU registers)
                </div>
              )}
              <div className="bg-slate-100 dark:bg-zinc-900 p-2 text-center text-slate-500 text-[11px]">
                Stack Growth (↓ RSP)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
