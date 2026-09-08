import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Database,
  Layers,
  Server,
  Code,
  Users,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-8 text-zinc-300">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Visualizer Workspace</span>
        </Link>
      </div>

      {/* Hero */}
      <div className="border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono mb-2">
          <BookOpen className="w-4 h-4" />
          <span>SOFTWARE ARCHITECTURE SPECIFICATION</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Compiler Pipeline Visualizer Documentation
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Complete Phase 1 Architecture, REST API Reference, Database Schema, and Team Deliverables.
        </p>
      </div>

      {/* Team Division Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-lg">
          <Users className="w-5 h-5 text-indigo-400" />
          <h2>Phase 1 Team Work Split & Ownership</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Ebin */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-100 text-sm">Ebin (Backend Lead)</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                Core Engine & DB
              </span>
            </div>
            <ul className="space-y-1 text-zinc-400 list-disc list-inside">
              <li>Next.js 14+ TypeScript project architecture</li>
              <li>Neon PostgreSQL schema with connection pooling & Prisma ORM</li>
              <li>Lexical Analyzer (tokenization, regex, coordinates, error recovery)</li>
              <li>Symbol Table class with hierarchical scoping</li>
              <li>API route `/api/compile/lex`</li>
            </ul>
          </div>

          {/* Kevin */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-100 text-sm">Kevin (Backend)</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                Syntax & Semantics
              </span>
            </div>
            <ul className="space-y-1 text-zinc-400 list-disc list-inside">
              <li>Recursive descent parser for C-like language with operator precedence</li>
              <li>Abstract Syntax Tree (AST) structure generation</li>
              <li>Semantic Analyzer (type checking, redeclaration, undefined symbols)</li>
              <li>Comprehensive Error Management System with code snippets</li>
              <li>API routes `/api/compile/syntax`, `/api/compile/semantic`, `/api/compile/:id/errors`</li>
            </ul>
          </div>

          {/* Aadi */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-100 text-sm">Aadi (Frontend)</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                Layout & Editor
              </span>
            </div>
            <ul className="space-y-1 text-zinc-400 list-disc list-inside">
              <li>Next.js App Router layout with Tailwind CSS styling</li>
              <li>Monaco Editor integration with C-like syntax highlighting</li>
              <li>Editor shortcuts (`Ctrl+Enter` compile) and localStorage persistence</li>
              <li>Control panel with compile buttons, font size, and preset templates</li>
              <li>Responsive 2-column layout wrapper</li>
            </ul>
          </div>

          {/* Joel */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-100 text-sm">Joel (Frontend)</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                Visualizer & State
              </span>
            </div>
            <ul className="space-y-1 text-zinc-400 list-disc list-inside">
              <li>Pipeline Visualizer flow framework with 6 phase cards</li>
              <li>TokenList component with syntax badge highlighting, search, and type filters</li>
              <li>SyntaxTreeViewer with interactive collapsible AST tree nodes</li>
              <li>SymbolTableViewer with scope filtering and column sorting</li>
              <li>Context-aware InfoPanel and Zustand global state management</li>
            </ul>
          </div>
        </div>
      </section>

      {/* REST API Reference */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-lg">
          <Server className="w-5 h-5 text-indigo-400" />
          <h2>REST API Reference</h2>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {/* Endpoint 1: Lex */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                POST
              </span>
              <span className="text-zinc-200">/api/compile/lex</span>
            </div>
            <p className="text-zinc-400 font-sans text-xs">
              Tokenizes source code string into an array of lexical tokens with coordinates.
            </p>
            <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 text-zinc-300 text-[11px]">
              {`// Request Body
{ "sourceCode": "int x = 10;" }

// Response Body
{
  "success": true,
  "tokens": [
    { "id": "tok-1", "type": "KEYWORD", "value": "int", "line": 1, "column": 1 },
    { "id": "tok-2", "type": "IDENTIFIER", "value": "x", "line": 1, "column": 5 },
    { "id": "tok-3", "type": "OPERATOR", "value": "=", "line": 1, "column": 7 },
    { "id": "tok-4", "type": "NUMBER_LITERAL", "value": "10", "line": 1, "column": 9 },
    { "id": "tok-5", "type": "DELIMITER", "value": ";", "line": 1, "column": 11 }
  ]
}`}
            </div>
          </div>

          {/* Endpoint 2: Syntax */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                POST
              </span>
              <span className="text-zinc-200">/api/compile/syntax</span>
            </div>
            <p className="text-zinc-400 font-sans text-xs">
              Parses tokens or source code into a hierarchical Abstract Syntax Tree (AST).
            </p>
          </div>

          {/* Endpoint 3: Semantic */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                POST
              </span>
              <span className="text-zinc-200">/api/compile/semantic</span>
            </div>
            <p className="text-zinc-400 font-sans text-xs">
              Runs type checking, scope resolution, and populates the scoped symbol table.
            </p>
          </div>

          {/* Endpoint 4: Pipeline */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                POST
              </span>
              <span className="text-zinc-200">/api/compile/pipeline</span>
            </div>
            <p className="text-zinc-400 font-sans text-xs">
              Executes the complete compilation pipeline end-to-end and persists results into the database.
            </p>
          </div>

          {/* Endpoint 5: Errors */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                GET
              </span>
              <span className="text-zinc-200">/api/compile/:sessionId/errors</span>
            </div>
            <p className="text-zinc-400 font-sans text-xs">
              Retrieves all compilation errors, warnings, and code snippets for a session.
            </p>
          </div>
        </div>
      </section>

      {/* Database Schema Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-lg">
          <Database className="w-5 h-5 text-indigo-400" />
          <h2>Database Schema (PostgreSQL / Neon)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-zinc-900/70 rounded-lg border border-zinc-800">
            <span className="text-indigo-400 font-bold block mb-1">compilation_sessions</span>
            <p className="text-zinc-400 font-sans">id (UUID PK), user_id, source_code, created_at</p>
          </div>
          <div className="p-3 bg-zinc-900/70 rounded-lg border border-zinc-800">
            <span className="text-indigo-400 font-bold block mb-1">lexical_tokens</span>
            <p className="text-zinc-400 font-sans">id (UUID PK), session_id (FK), type, value, line, column</p>
          </div>
          <div className="p-3 bg-zinc-900/70 rounded-lg border border-zinc-800">
            <span className="text-indigo-400 font-bold block mb-1">syntax_tree</span>
            <p className="text-zinc-400 font-sans">id (UUID PK), session_id (FK), tree_json</p>
          </div>
          <div className="p-3 bg-zinc-900/70 rounded-lg border border-zinc-800">
            <span className="text-indigo-400 font-bold block mb-1">symbol_table</span>
            <p className="text-zinc-400 font-sans">id (UUID PK), session_id (FK), name, type, scope, metadata</p>
          </div>
          <div className="p-3 bg-zinc-900/70 rounded-lg border border-zinc-800">
            <span className="text-indigo-400 font-bold block mb-1">compilation_errors</span>
            <p className="text-zinc-400 font-sans">id (UUID PK), session_id (FK), phase, error_msg, severity, line, column</p>
          </div>
          <div className="p-3 bg-zinc-900/70 rounded-lg border border-zinc-800">
            <span className="text-indigo-400 font-bold block mb-1">intermediate_code (Phase 2)</span>
            <p className="text-zinc-400 font-sans">id (UUID PK), session_id (FK), ir_code, line_number</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="pt-6 border-t border-zinc-800 text-center text-xs text-zinc-500">
        Compiler Pipeline Visualizer • Software Architecture Project • Phase 1 Complete
      </div>
    </div>
  );
}
