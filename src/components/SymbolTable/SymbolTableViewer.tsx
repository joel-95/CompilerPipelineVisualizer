'use client';

import React, { useState, useMemo } from 'react';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import { SymbolEntry } from '@/lib/compiler/types';
import { Badge } from '../common/Badge';
import { Table, Filter, ArrowUpDown, Eye, Database } from 'lucide-react';

export const SymbolTableViewer: React.FC = () => {
  const { symbolTable, setSelectedItem, selectedItem } = useCompilerStore();
  const [selectedScope, setSelectedScope] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'name' | 'type' | 'scope' | 'line'>('line');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Extract unique scopes
  const uniqueScopes = useMemo(() => {
    const scopes = new Set<string>();
    symbolTable.forEach((s) => scopes.add(s.scope));
    return ['ALL', ...Array.from(scopes)];
  }, [symbolTable]);

  // Filter and sort symbols
  const processedSymbols = useMemo(() => {
    let list = symbolTable.filter((s) => {
      if (selectedScope === 'ALL') return true;
      return s.scope === selectedScope;
    });

    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [symbolTable, selectedScope, sortField, sortAsc]);

  const toggleSort = (field: 'name' | 'type' | 'scope' | 'line') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getKindBadgeVariant = (kind: string) => {
    switch (kind) {
      case 'variable':
        return 'blue';
      case 'function':
        return 'purple';
      case 'parameter':
        return 'emerald';
      default:
        return 'gray';
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
      {/* Header controls: Scope filter and stats */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold text-zinc-200">
            Scoped Symbol Table
          </h3>
          <span className="text-[11px] text-zinc-400 font-mono">
            ({processedSymbols.length} entries)
          </span>
        </div>

        {/* Scope Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs text-zinc-400">Scope:</span>
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded-lg border border-zinc-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {uniqueScopes.map((scope) => (
              <option key={scope} value={scope}>
                {scope === 'ALL' ? 'All Scopes' : scope}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-auto max-h-[480px]">
        {processedSymbols.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-xs font-mono">
            {symbolTable.length === 0
              ? 'No symbols registered yet. Compile source code to inspect symbol table.'
              : 'No symbols found in selected scope.'}
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-900/90 text-zinc-400 sticky top-0 border-b border-zinc-800 text-[11px] font-mono select-none">
              <tr>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-2 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Identifier Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('type')}
                  className="py-2 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Data Type</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2 px-3">Kind</th>
                <th
                  onClick={() => toggleSort('scope')}
                  className="py-2 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Scope</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('line')}
                  className="py-2 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Decl. Line</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-mono text-[11px]">
              {processedSymbols.map((sym, index) => {
                const isSelected = selectedItem?.id === sym.id;
                return (
                  <tr
                    key={sym.id || index}
                    onClick={() => setSelectedItem(sym, 'symbol')}
                    className={`cursor-pointer transition hover:bg-zinc-900/70 ${
                      isSelected ? 'bg-indigo-950/40 text-indigo-200' : 'text-zinc-300'
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold text-sky-400">
                      {sym.name}
                    </td>
                    <td className="py-2 px-3 text-purple-400">
                      {sym.type}
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant={getKindBadgeVariant(sym.kind)}>
                        {sym.kind}
                      </Badge>
                    </td>
                    <td className="py-2 px-3">
                      <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded text-[10px]">
                        {sym.scope}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-zinc-400">
                      L:{sym.line}, C:{sym.column}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(sym, 'symbol');
                        }}
                        className="text-zinc-400 hover:text-indigo-400 transition"
                      >
                        <Eye className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
