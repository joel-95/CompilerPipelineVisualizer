'use client';

import React from 'react';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import { Info, HelpCircle, Code2, Layers, BookOpen } from 'lucide-react';
import { Badge } from '../common/Badge';

export const InfoPanel: React.FC = () => {
  const { selectedItem, selectedItemType } = useCompilerStore();

  const renderTokenInspector = (token: any) => (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <span className="text-zinc-400">Inspected Item:</span>
        <Badge variant="blue">Lexical Token</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
          <span className="text-zinc-500 block">Token Type</span>
          <span className="text-indigo-400 font-semibold">{token.type}</span>
        </div>
        <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
          <span className="text-zinc-500 block">Lexeme Value</span>
          <span className="text-emerald-400 font-semibold">{token.value}</span>
        </div>
        <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
          <span className="text-zinc-500 block">Line Position</span>
          <span className="text-zinc-200">{token.line}</span>
        </div>
        <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
          <span className="text-zinc-500 block">Column Position</span>
          <span className="text-zinc-200">{token.column}</span>
        </div>
      </div>

      <div className="p-2.5 bg-zinc-900/50 rounded-lg border border-zinc-800 text-[11px] font-sans text-zinc-400">
        <strong className="text-zinc-200 block mb-1">Lexer Role:</strong>
        Converts the raw source character stream into discrete categorized atomic symbols (tokens) while tracking coordinates for syntax error location mapping.
      </div>
    </div>
  );

  const renderASTInspector = (node: any) => (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <span className="text-zinc-400">Inspected Item:</span>
        <Badge variant="purple">AST Node</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800 col-span-2">
          <span className="text-zinc-500 block">Node Type</span>
          <span className="text-indigo-400 font-semibold">{node.type}</span>
        </div>
        {node.inferredType && (
          <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
            <span className="text-zinc-500 block">Inferred Type</span>
            <span className="text-purple-400 font-semibold">{node.inferredType}</span>
          </div>
        )}
        {node.operator && (
          <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
            <span className="text-zinc-500 block">Operator</span>
            <span className="text-amber-400 font-semibold">{node.operator}</span>
          </div>
        )}
        {node.name && (
          <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
            <span className="text-zinc-500 block">Identifier Name</span>
            <span className="text-sky-400 font-semibold">{node.name}</span>
          </div>
        )}
        {node.value !== undefined && (
          <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
            <span className="text-zinc-500 block">Literal Value</span>
            <span className="text-emerald-400 font-semibold">{String(node.value)}</span>
          </div>
        )}
        <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
          <span className="text-zinc-500 block">Location</span>
          <span className="text-zinc-200">L:{node.line}, C:{node.column}</span>
        </div>
      </div>

      <div className="p-2.5 bg-zinc-900/50 rounded-lg border border-zinc-800 text-[11px] font-sans text-zinc-400">
        <strong className="text-zinc-200 block mb-1">Syntax Parser Role:</strong>
        Recursively analyzes grammar rules to organize linear tokens into a hierarchical Abstract Syntax Tree representing nested program logic and operator precedence.
      </div>
    </div>
  );

  const renderSymbolInspector = (symbol: any) => (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <span className="text-zinc-400">Inspected Item:</span>
        <Badge variant="emerald">Symbol Entry</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
          <span className="text-zinc-500 block">Identifier</span>
          <span className="text-sky-400 font-semibold">{symbol.name}</span>
        </div>
        <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
          <span className="text-zinc-500 block">Declared Type</span>
          <span className="text-purple-400 font-semibold">{symbol.type}</span>
        </div>
        <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
          <span className="text-zinc-500 block">Scope</span>
          <span className="text-zinc-200">{symbol.scope}</span>
        </div>
        <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
          <span className="text-zinc-500 block">Scope Depth</span>
          <span className="text-zinc-200">{symbol.scopeLevel}</span>
        </div>
        <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
          <span className="text-zinc-500 block">Symbol Kind</span>
          <span className="text-zinc-200 capitalize">{symbol.kind}</span>
        </div>
        <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
          <span className="text-zinc-500 block">Declaration</span>
          <span className="text-zinc-200">Line {symbol.line}</span>
        </div>
      </div>

      {symbol.params && symbol.params.length > 0 && (
        <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800 text-[11px]">
          <span className="text-zinc-500 block mb-1">Parameters ({symbol.params.length})</span>
          <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
            {symbol.params.map((p: any, idx: number) => (
              <li key={idx}>
                <span className="text-sky-400">{p.name}</span>: <span className="text-purple-400">{p.type}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-2.5 bg-zinc-900/50 rounded-lg border border-zinc-800 text-[11px] font-sans text-zinc-400">
        <strong className="text-zinc-200 block mb-1">Semantic Table Role:</strong>
        Maintains scoped symbol bindings across lexical block boundaries to enforce static type safety, variable initialization, and visibility rules.
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold text-zinc-200">
            Inspector & Context Info
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-3 overflow-auto">
        {selectedItemType === 'token' && selectedItem ? (
          renderTokenInspector(selectedItem)
        ) : selectedItemType === 'astNode' && selectedItem ? (
          renderASTInspector(selectedItem)
        ) : selectedItemType === 'symbol' && selectedItem ? (
          renderSymbolInspector(selectedItem)
        ) : (
          <div className="space-y-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold border-b border-zinc-800 pb-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Compiler Pipeline Concepts</span>
            </div>

            <div className="p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-400 text-[11px]">
                <span className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px]">1</span>
                Lexical Analysis (Scanner)
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Scans source characters with regular expressions, stripping comments and converting valid lexemes into tokens.
              </p>
            </div>

            <div className="p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-purple-400 text-[11px]">
                <span className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">2</span>
                Syntax Analysis (Parser)
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Validates code structure against context-free grammar using recursive descent, building an Abstract Syntax Tree (AST).
              </p>
            </div>

            <div className="p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400 text-[11px]">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">3</span>
                Semantic Analysis & Symbol Table
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Enforces type compatibility, verifies variable declarations, and binds identifiers to hierarchical scope frames.
              </p>
            </div>

            <p className="text-[11px] text-zinc-500 italic text-center pt-2">
              💡 Tip: Click on any token, AST node, or symbol row to inspect its exact internal compiler attributes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
