'use client';

import React, { useState } from 'react';
import { ASTNode } from '@/lib/compiler/types';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import { ChevronDown, ChevronRight, CircleDot, Box } from 'lucide-react';
import { Badge } from '../common/Badge';

interface TreeNodeProps {
  node: ASTNode;
  depth?: number;
  searchTerm?: string;
  forceExpand?: boolean;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  depth = 0,
  searchTerm = '',
  forceExpand,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { selectedItem, setSelectedItem } = useCompilerStore();

  if (!node) return null;

  const isSelected = selectedItem?.id === node.id;

  // Extract children from known AST node structures
  const getChildren = (n: ASTNode): { key: string; val: ASTNode | ASTNode[] }[] => {
    const list: { key: string; val: ASTNode | ASTNode[] }[] = [];

    if (n.body && Array.isArray(n.body)) {
      list.push({ key: 'body', val: n.body });
    }
    if (n.statements && Array.isArray(n.statements)) {
      list.push({ key: 'statements', val: n.statements });
    }
    if (n.initializer) {
      list.push({ key: 'initializer', val: n.initializer });
    }
    if (n.condition) {
      list.push({ key: 'condition', val: n.condition });
    }
    if (n.consequent) {
      list.push({ key: 'consequent', val: n.consequent });
    }
    if (n.alternate) {
      list.push({ key: 'alternate', val: n.alternate });
    }
    if (n.init) {
      list.push({ key: 'init', val: n.init });
    }
    if (n.update) {
      list.push({ key: 'update', val: n.update });
    }
    if (n.argument) {
      list.push({ key: 'argument', val: n.argument });
    }
    if (n.expression) {
      list.push({ key: 'expression', val: n.expression });
    }
    if (n.left) {
      list.push({ key: 'left', val: n.left });
    }
    if (n.right) {
      list.push({ key: 'right', val: n.right });
    }
    if (n.args && Array.isArray(n.args)) {
      list.push({ key: 'arguments', val: n.args });
    }

    return list;
  };

  const childEntries = getChildren(node);
  const hasChildren = childEntries.length > 0;
  const isEffectivelyCollapsed = forceExpand !== undefined ? !forceExpand : collapsed;

  const matchesSearch =
    searchTerm &&
    (node.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (node.name && String(node.name).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (node.value !== undefined && String(node.value).toLowerCase().includes(searchTerm.toLowerCase())));

  const getNodeBadgeColor = (type: string) => {
    switch (type) {
      case 'Program':
        return 'purple';
      case 'FunctionDeclaration':
        return 'indigo';
      case 'VariableDeclaration':
        return 'blue';
      case 'IfStatement':
      case 'WhileStatement':
      case 'ForStatement':
        return 'amber';
      case 'BinaryExpression':
      case 'UnaryExpression':
        return 'emerald';
      case 'Literal':
      case 'Identifier':
        return 'gray';
      default:
        return 'purple';
    }
  };

  return (
    <div className="font-mono text-xs select-none">
      <div
        onClick={() => setSelectedItem(node, 'astNode')}
        className={`flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition border border-transparent ${
          isSelected
            ? 'bg-indigo-950/50 border-indigo-500/40 text-indigo-200'
            : matchesSearch
            ? 'bg-amber-950/40 text-amber-200 border-amber-500/30'
            : 'hover:bg-zinc-900/60 text-zinc-300'
        }`}
        style={{ paddingLeft: `${Math.max(8, depth * 18 + 8)}px` }}
      >
        {/* Toggle Chevron */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            className="p-0.5 hover:text-white text-zinc-500"
          >
            {isEffectivelyCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <CircleDot className="w-3.5 h-3.5 text-zinc-600 shrink-0 ml-0.5" />
        )}

        {/* Node Type Badge */}
        <Badge variant={getNodeBadgeColor(node.type)} size="sm">
          {node.type}
        </Badge>

        {/* Quick inline identifiers / values */}
        {node.name && (
          <span className="font-semibold text-sky-400">
            name: &quot;{node.name}&quot;
          </span>
        )}
        {node.varType && (
          <span className="text-purple-400">
            type: {node.varType}
          </span>
        )}
        {node.operator && (
          <span className="font-bold text-amber-400 bg-zinc-800 px-1.5 py-0.2 rounded">
            op: {node.operator}
          </span>
        )}
        {node.value !== undefined && (
          <span className="text-emerald-400">
            val: {String(node.value)}
          </span>
        )}
        {node.callee && (
          <span className="text-indigo-400 font-semibold">
            callee: {node.callee}()
          </span>
        )}
        {node.inferredType && (
          <span className="text-[10px] text-zinc-500 bg-zinc-800/80 px-1 rounded ml-auto">
            :{node.inferredType}
          </span>
        )}
      </div>

      {/* Children recursive rendering */}
      {hasChildren && !isEffectivelyCollapsed && (
        <div className="relative border-l border-zinc-800/80 ml-4">
          {childEntries.map((entry, idx) => {
            if (Array.isArray(entry.val)) {
              return entry.val.map((cNode, cIdx) => (
                <TreeNode
                  key={cNode.id || `${entry.key}-${cIdx}`}
                  node={cNode}
                  depth={depth + 1}
                  searchTerm={searchTerm}
                  forceExpand={forceExpand}
                />
              ));
            }
            return (
              <TreeNode
                key={entry.val.id || `${entry.key}-${idx}`}
                node={entry.val}
                depth={depth + 1}
                searchTerm={searchTerm}
                forceExpand={forceExpand}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
