'use client';

import React, { useState } from 'react';
import { ASTNode } from '@/lib/compiler/types';
import { useCompilerStore } from '@/lib/store/useCompilerStore';
import { ChevronDown, ChevronRight, CircleDot } from 'lucide-react';
import { Badge } from '../common/Badge';

interface TreeNodeProps {
  node: ASTNode;
  depth?: number;
  searchTerm?: string;
  forceExpand?: boolean;
  isLast?: boolean;
}

// Helper: flatten all structural children of a node
function getASTChildren(n: ASTNode): ASTNode[] {
  const kids: ASTNode[] = [];
  const push = (v: unknown) => {
    if (!v) return;
    if (Array.isArray(v)) v.forEach((c) => c && kids.push(c));
    else kids.push(v as ASTNode);
  };
  push(n.body);
  push(n.statements);
  push(n.init);
  push(n.condition);
  push(n.consequent);
  push(n.alternate);
  push(n.update);
  push(n.initializer);
  push(n.expression);
  push(n.argument);
  push(n.left);
  push(n.right);
  push(n.args);
  push(n.children);
  return kids;
}

function getNodeBadgeColor(type: string): 'purple' | 'blue' | 'emerald' | 'amber' | 'rose' | 'gray' | 'indigo' {
  switch (type) {
    case 'Program': return 'purple';
    case 'FunctionDeclaration': return 'indigo';
    case 'VariableDeclaration': return 'blue';
    case 'IfStatement':
    case 'WhileStatement':
    case 'ForStatement': return 'amber';
    case 'BinaryExpression':
    case 'UnaryExpression':
    case 'AssignmentExpression': return 'emerald';
    case 'CallExpression': return 'indigo';
    case 'ReturnStatement': return 'rose';
    case 'Literal':
    case 'Identifier': return 'gray';
    default: return 'purple';
  }
}



export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  depth = 0,
  searchTerm = '',
  forceExpand,
  isLast = true,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { selectedItem, setSelectedItem } = useCompilerStore();

  if (!node) return null;

  const isSelected = selectedItem?.id === node.id;
  const isEffectivelyCollapsed = forceExpand !== undefined ? !forceExpand : collapsed;
  const children = getASTChildren(node);
  const hasChildren = children.length > 0;

  const matchesSearch =
    searchTerm &&
    (node.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (node.name && String(node.name).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (node.value !== undefined &&
        String(node.value).toLowerCase().includes(searchTerm.toLowerCase())));

  // Connector dimensions
  const INDENT = 20; // px per depth level
  const ROW_MID = 18; // half row height for horizontal branch

  return (
    <div className="relative flex flex-col font-mono text-xs select-none" style={{ paddingLeft: depth === 0 ? 0 : INDENT }}>
      {/* Connector lines for non-root nodes */}
      {depth > 0 && (
        <>
          {/* Horizontal branch ─── */}
          <span
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: ROW_MID,
              width: INDENT - 4,
              height: 1,
              background: 'var(--tree-line, #cbd5e1)',
            }}
          />
          {/* Vertical segment above branch */}
          <span
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: 0,
              width: 1,
              height: isLast ? ROW_MID : '100%',
              background: 'var(--tree-line, #cbd5e1)',
            }}
          />
        </>
      )}

      {/* Node row */}
      <div
        onClick={() => setSelectedItem(node, 'astNode')}
        className={`flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition-colors border border-transparent ${
          isSelected
            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-500/40 text-indigo-900 dark:text-indigo-200 font-semibold'
            : matchesSearch
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200'
            : 'hover:bg-slate-100 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300'
        }`}
      >
        {/* Toggle or leaf dot */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            className="p-0.5 rounded text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
          >
            {isEffectivelyCollapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        ) : (
          <CircleDot className="w-3 h-3 text-slate-300 dark:text-zinc-600 shrink-0" />
        )}

        {/* Node badge */}
        <Badge variant={getNodeBadgeColor(node.type)} size="sm">
          {node.type}
        </Badge>

        {/* Inline meta */}
        {node.name && (
          <span className="font-semibold text-sky-600 dark:text-sky-400 truncate max-w-[120px]">
            &quot;{node.name}&quot;
          </span>
        )}
        {node.varType && (
          <span className="text-purple-600 dark:text-purple-400">:{node.varType}</span>
        )}
        {node.operator && (
          <span className="font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-zinc-800 border border-amber-200 dark:border-zinc-700 px-1.5 rounded text-[10px]">
            {node.operator}
          </span>
        )}
        {node.value !== undefined && (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {String(node.value)}
          </span>
        )}
        {node.callee && (
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
            {node.callee}()
          </span>
        )}
        {node.inferredType && (
          <span className="ml-auto text-[10px] text-slate-500 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-1 rounded shrink-0">
            :{node.inferredType}
          </span>
        )}
        {isEffectivelyCollapsed && hasChildren && (
          <span className="ml-auto text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">
            +{children.length}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && !isEffectivelyCollapsed && (
        <div className="relative" style={{ paddingLeft: INDENT }}>
          {/* Vertical guide running alongside all but the last child */}
          <span
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: 0,
              width: 1,
              // Stop just before last child row midpoint
              bottom: ROW_MID,
              background: 'var(--tree-line, #cbd5e1)',
            }}
          />
          {children.map((child, idx) => {
            const last = idx === children.length - 1;
            return (
              <TreeNode
                key={child.id || `child-${depth}-${idx}`}
                node={child}
                depth={depth + 1}
                searchTerm={searchTerm}
                forceExpand={forceExpand}
                isLast={last}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
