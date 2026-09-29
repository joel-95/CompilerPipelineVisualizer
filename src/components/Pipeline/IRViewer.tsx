'use client';

import React from 'react';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import { TACInstruction } from '@/lib/compiler/types';

export const IRViewer: React.FC = () => {
  const { tac } = useCompilerStore();

  if (!tac || tac.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 dark:text-zinc-500 text-sm">
        No Intermediate Representation generated. Run the compiler to see the TAC.
      </div>
    );
  }

  const renderInstruction = (instr: TACInstruction) => {
    switch (instr.kind) {
      case 'label':
        return <span className="text-purple-600 dark:text-purple-400 font-bold">{instr.label}:</span>;
      case 'jump':
        return (
          <>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">goto</span>{' '}
            <span className="text-purple-600 dark:text-purple-400">{instr.label}</span>
          </>
        );
      case 'cjump':
        return (
          <>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">if</span>{' '}
            <span className="text-orange-600 dark:text-orange-400">{instr.arg1}</span>{' '}
            <span className="text-blue-600 dark:text-blue-400 font-semibold">goto</span>{' '}
            <span className="text-purple-600 dark:text-purple-400">{instr.label}</span>
          </>
        );
      case 'param':
        return (
          <>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">param</span>{' '}
            <span className="text-orange-600 dark:text-orange-400">{instr.arg1}</span>
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
            <span className="text-emerald-600 dark:text-emerald-400">{instr.arg1}</span>
            <span className="text-slate-500">, {instr.nArgs}</span>
          </>
        );
      case 'return':
        return (
          <>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">return</span>
            {instr.arg1 && (
              <>
                {' '}
                <span className="text-orange-600 dark:text-orange-400">{instr.arg1}</span>
              </>
            )}
          </>
        );
      case 'unary':
        return (
          <>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{instr.result}</span>{' '}
            <span className="text-slate-500">=</span>{' '}
            <span className="text-pink-600 dark:text-pink-400">{instr.op}</span>
            <span className="text-orange-600 dark:text-orange-400">{instr.arg1}</span>
          </>
        );
      case 'binary':
        return (
          <>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{instr.result}</span>{' '}
            <span className="text-slate-500">=</span>{' '}
            <span className="text-orange-600 dark:text-orange-400">{instr.arg1}</span>{' '}
            <span className="text-pink-600 dark:text-pink-400">{instr.op}</span>{' '}
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
    <div className="h-full bg-slate-50/50 dark:bg-[#0a0a0a] overflow-auto p-4 md:p-6 font-mono text-sm leading-relaxed">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 mb-4 tracking-tight">
          Intermediate Representation (TAC)
        </h2>
        <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-zinc-900/80 border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-zinc-400 w-16 text-center">#</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-zinc-400">Instruction</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-zinc-400 text-right">Line ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
              {tac.map((instr, idx) => (
                <tr
                  key={instr.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="py-2.5 px-4 text-slate-400 dark:text-zinc-600 text-xs text-center border-r border-slate-100 dark:border-zinc-800/50">
                    {idx + 1}
                  </td>
                  <td className={`py-2.5 px-4 ${instr.kind === 'label' ? 'pl-2' : 'pl-8'}`}>
                    {renderInstruction(instr)}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 dark:text-zinc-600 text-xs text-right">
                    {instr.sourceLineRef ? `L${instr.sourceLineRef}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
