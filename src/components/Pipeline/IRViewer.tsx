'use client';

import React, { useState } from 'react';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import { TACInstruction } from '@/lib/compiler/types';
import { IRGenerator } from '@/lib/compiler/IRGenerator';
import { Network, ListTree, Filter, Search, ArrowDown } from 'lucide-react';

export const IRViewer: React.FC = () => {
  const { tac, basicBlocks } = useCompilerStore();
  const [viewTab, setViewTab] = useState<'tac' | 'cfg'>('tac');
  const [searchQuery, setSearchQuery] = useState('');

  if (!tac || tac.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-400 dark:text-zinc-500 text-sm gap-2">
        <ListTree className="w-8 h-8 text-indigo-500/50 animate-pulse" />
        <p>No Intermediate Representation generated. Run the compiler to see Three-Address Code.</p>
      </div>
    );
  }

  const filteredTac = searchQuery
    ? tac.filter(
        (i) =>
          IRGenerator.format(i).toLowerCase().includes(searchQuery.toLowerCase()) ||
          (i.result && i.result.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : tac;

  const renderInstruction = (instr: TACInstruction) => {
    switch (instr.kind) {
      case 'label':
        return <span className="text-purple-600 dark:text-purple-400 font-bold">{instr.label}:</span>;
      case 'jump':
        return (
          <>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">goto</span>{' '}
            <span className="text-purple-600 dark:text-purple-400 font-semibold">{instr.label}</span>
          </>
        );
      case 'cjump':
        return (
          <>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">if</span>{' '}
            <span className="text-orange-600 dark:text-orange-400 font-bold">{instr.arg1}</span>{' '}
            <span className="text-blue-600 dark:text-blue-400 font-semibold">goto</span>{' '}
            <span className="text-purple-600 dark:text-purple-400 font-semibold">{instr.label}</span>
          </>
        );
      case 'param':
        return (
          <>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">param</span>{' '}
            <span className="text-orange-600 dark:text-orange-400 font-bold">{instr.arg1}</span>
          </>
        );
      case 'call':
        return (
          <>
            {instr.result && (
              <>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{instr.result}</span>{' '}
                <span className="text-slate-500">=</span>{' '}
              </>
            )}
            <span className="text-blue-600 dark:text-blue-400 font-semibold">call</span>{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{instr.arg1}</span>
            <span className="text-slate-500">, {instr.nArgs || 0}</span>
          </>
        );
      case 'return':
        return (
          <>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">return</span>
            {instr.arg1 && (
              <>
                {' '}
                <span className="text-orange-600 dark:text-orange-400 font-bold">{instr.arg1}</span>
              </>
            )}
          </>
        );
      case 'unary':
        return (
          <>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{instr.result}</span>{' '}
            <span className="text-slate-500">=</span>{' '}
            <span className="text-pink-600 dark:text-pink-400 font-bold">{instr.op}</span>
            <span className="text-orange-600 dark:text-orange-400">{instr.arg1}</span>
          </>
        );
      case 'binary':
        return (
          <>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{instr.result}</span>{' '}
            <span className="text-slate-500">=</span>{' '}
            <span className="text-orange-600 dark:text-orange-400">{instr.arg1}</span>{' '}
            <span className="text-pink-600 dark:text-pink-400 font-bold">{instr.op}</span>{' '}
            <span className="text-orange-600 dark:text-orange-400">{instr.arg2}</span>
          </>
        );
      case 'assign':
      case 'copy':
        return (
          <>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{instr.result}</span>{' '}
            <span className="text-slate-500">=</span>{' '}
            <span className="text-orange-600 dark:text-orange-400">{instr.arg1}</span>
          </>
        );
      default:
        return <span className="text-slate-500">nop</span>;
    }
  };

  return (
    <div className="h-full flex flex-col gap-3 font-sans text-xs overflow-hidden">
      {/* View Switcher & Search Bar */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
          <button
            onClick={() => setViewTab('tac')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition ${
              viewTab === 'tac'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            Linear TAC ({tac.length} instrs)
          </button>
          <button
            onClick={() => setViewTab('cfg')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition ${
              viewTab === 'cfg'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            Basic Blocks & CFG ({basicBlocks.length} blocks)
          </button>
        </div>

        {viewTab === 'tac' && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search instructions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 outline-none focus:border-indigo-500 w-44"
            />
          </div>
        )}
      </div>

      {/* Main View Container */}
      <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
        {viewTab === 'tac' && (
          <div className="font-mono text-xs">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 dark:border-zinc-800 text-[11px] text-slate-500 font-sans">
                <tr>
                  <th className="py-2 px-3 w-12 text-center">#</th>
                  <th className="py-2 px-3">Three-Address Code Instruction</th>
                  <th className="py-2 px-3 text-right w-24">Source Line</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {filteredTac.map((instr, idx) => (
                  <tr
                    key={instr.id}
                    className="hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <td className="py-2 px-3 text-slate-400 dark:text-zinc-600 text-center select-none">
                      {idx + 1}
                    </td>
                    <td className={`py-2 px-3 ${instr.kind === 'label' ? 'pl-2' : 'pl-6'}`}>
                      {renderInstruction(instr)}
                    </td>
                    <td className="py-2 px-3 text-slate-400 dark:text-zinc-600 text-right">
                      {instr.sourceLineRef ? `L${instr.sourceLineRef}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewTab === 'cfg' && (
          <div className="space-y-4">
            <div className="text-[11px] text-slate-500 mb-2">
              Control Flow Graph partition with basic block boundaries and jump targets:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {basicBlocks.map((bb) => (
                <div
                  key={bb.id}
                  className="flex flex-col border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50/50 dark:bg-zinc-900/30 overflow-hidden shadow-xs"
                >
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 border-b border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
                    <span className="font-bold text-indigo-700 dark:text-indigo-400 font-mono text-xs">
                      {bb.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {bb.instructions.length} instrs
                    </span>
                  </div>

                  <div className="p-2.5 font-mono text-[11px] space-y-1 flex-1 overflow-auto bg-white dark:bg-zinc-950">
                    {bb.instructions.map((ins) => (
                      <div key={ins.id} className="text-slate-800 dark:text-zinc-300">
                        {renderInstruction(ins)}
                      </div>
                    ))}
                  </div>

                  {bb.successors.length > 0 && (
                    <div className="p-2 border-t border-slate-200 dark:border-zinc-800 bg-slate-100/50 dark:bg-zinc-900/50 text-[10px] text-slate-500 flex items-center gap-1">
                      <ArrowDown className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span>Branches to: {bb.successors.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
