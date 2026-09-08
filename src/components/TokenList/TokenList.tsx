'use client';

import React, { useState, useMemo } from 'react';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import { Token, TokenType } from '@/lib/compiler/types';
import { Badge } from '../common/Badge';
import { Search, Filter, Hash, Eye } from 'lucide-react';

export const TokenList: React.FC = () => {
  const { tokens, setSelectedItem, selectedItem } = useCompilerStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      const matchesSearch =
        token.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        selectedTypeFilter === 'ALL' || token.type === selectedTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [tokens, searchTerm, selectedTypeFilter]);

  const getBadgeVariant = (type: TokenType) => {
    switch (type) {
      case 'KEYWORD':
        return 'purple';
      case 'IDENTIFIER':
        return 'blue';
      case 'NUMBER_LITERAL':
      case 'STRING_LITERAL':
      case 'BOOLEAN_LITERAL':
        return 'emerald';
      case 'OPERATOR':
        return 'amber';
      case 'ERROR':
        return 'rose';
      default:
        return 'gray';
    }
  };

  const tokenTypesList = [
    'ALL',
    'KEYWORD',
    'IDENTIFIER',
    'NUMBER_LITERAL',
    'STRING_LITERAL',
    'BOOLEAN_LITERAL',
    'OPERATOR',
    'DELIMITER',
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
      {/* Header controls: Search & Filter */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold text-zinc-200">
            Lexical Token Stream
          </h3>
          <span className="text-[11px] text-zinc-400 font-mono">
            ({filteredTokens.length} / {tokens.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search value or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-800 text-zinc-200 text-xs pl-8 pr-3 py-1 rounded-lg border border-zinc-700 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded-lg border border-zinc-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {tokenTypesList.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-auto max-h-[480px]">
        {filteredTokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-xs font-mono">
            {tokens.length === 0
              ? 'No tokens generated yet. Click "Compile" or "Run Pipeline".'
              : 'No tokens matched your filter criteria.'}
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-900/90 text-zinc-400 sticky top-0 border-b border-zinc-800 text-[11px] font-mono">
              <tr>
                <th className="py-2 px-3">#</th>
                <th className="py-2 px-3">Token Type</th>
                <th className="py-2 px-3">Lexeme / Value</th>
                <th className="py-2 px-3">Line</th>
                <th className="py-2 px-3">Col</th>
                <th className="py-2 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-mono text-[11px]">
              {filteredTokens.map((token, index) => {
                const isSelected = selectedItem?.id === token.id;
                return (
                  <tr
                    key={token.id || index}
                    onClick={() => setSelectedItem(token, 'token')}
                    className={`cursor-pointer transition hover:bg-zinc-900/70 ${
                      isSelected ? 'bg-indigo-950/40 text-indigo-200' : 'text-zinc-300'
                    }`}
                  >
                    <td className="py-2 px-3 text-zinc-400">{index + 1}</td>
                    <td className="py-2 px-3">
                      <Badge variant={getBadgeVariant(token.type)}>
                        {token.type}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 font-semibold text-zinc-100 max-w-[200px] truncate">
                      {token.value}
                    </td>
                    <td className="py-2 px-3 text-zinc-400">{token.line}</td>
                    <td className="py-2 px-3 text-zinc-400">{token.column}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(token, 'token');
                        }}
                        className="text-zinc-400 hover:text-indigo-400 transition"
                        title="Inspect Token Details"
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
