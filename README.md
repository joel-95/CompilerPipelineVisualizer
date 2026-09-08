# Compiler Pipeline Visualizer

An interactive, educational compiler pipeline visualizer built with **Next.js 14+ (App Router)**, **TypeScript**, **Tailwind CSS**, **Monaco Editor**, and **Neon PostgreSQL (Prisma ORM)**.

Developed for Software Architecture (Sem 5) by a 4-person team:
- **Ebin** (Backend Lead) — Core Compiler Engine, Lexer, Symbol Table, Database Setup
- **Kevin** (Backend) — Recursive Descent Parser (AST), Semantic Analysis, Error Tracking
- **Aadi** (Frontend) — UI Layout, Monaco Code Editor, Compilation Controls, Responsive Views
- **Joel** (Frontend) — Pipeline Visualizer Framework, Token List, Interactive AST Tree, Scoped Symbol Table

---

## 🔷 Phase 1 Deliverables (Core Infrastructure & Foundation)

### Backend (Ebin & Kevin)
- ✅ **Database Schema & ORM**: PostgreSQL schema with Neon connection pooling and Prisma ORM covering:
  - `compilation_sessions`
  - `lexical_tokens`
  - `syntax_tree`
  - `symbol_table`
  - `semantic_info`
  - `intermediate_code`
  - `compilation_errors`
- ✅ **Lexical Analyzer (`LexicalAnalyzer.ts`)**:
  - Regex-based tokenization engine for C-like grammar (`int`, `float`, `string`, `bool`, `void`, `if`, `else`, `while`, `for`, `return`, `function`, etc.)
  - Line and column coordinates tracking for error diagnostics
  - Single-line (`//`) and multi-line (`/* ... */`) comments stripping
  - Graceful error recovery for unrecognized characters
- ✅ **Syntax Analyzer (`SyntaxAnalyzer.ts`)**:
  - Recursive descent parser with operator precedence (`||`, `&&`, equality, relational, additive, multiplicative)
  - Constructs hierarchical Abstract Syntax Tree (`ASTNode`)
  - Statement parsing (`if`, `while`, `for`, `return`, variable declarations, function declarations, expression statements)
  - Panic-mode synchronization error recovery on statement boundaries
- ✅ **Semantic Analyzer (`SemanticAnalyzer.ts`) & Scoped Symbol Table (`SymbolTable.ts`)**:
  - Scoped symbol table managing nested scope hierarchy (`global` -> `func_*` -> `block_*`)
  - Scope chain traversal for symbol resolution and shadowing
  - Static type checking: type compatibility in assignments, binary operations, relational checks
  - Undeclared identifier and duplicate redeclaration detection
  - Function signature and parameter count/type validation
- ✅ **Error Management System (`ErrorManager.ts`)**:
  - Categorized errors (`LEXICAL`, `SYNTAX`, `SEMANTIC`)
  - Error severity levels (`ERROR`, `WARNING`)
  - Visual code snippets with pointer markers and actionable suggestions
- ✅ **REST API Endpoints**:
  - `POST /api/compile/lex`: Tokenize source code into token array with positions
  - `POST /api/compile/syntax`: Parse tokens/code into AST structure
  - `POST /api/compile/semantic`: Perform scope resolution and type checking
  - `POST /api/compile/pipeline`: End-to-end multi-phase compilation pipeline with session persistence
  - `GET /api/compile/:sessionId/errors`: Retrieve compilation errors by session ID
- ✅ **Unit & Integration Test Suite**: 27 comprehensive test cases using Vitest.

### Frontend (Aadi & Joel)
- ✅ **Layout & Structure**:
  - Responsive 2-column layout (Monaco Editor on left, Visualization tabs on right)
  - Top navigation bar with compiler status indicators, execution timers, theme toggle, and docs link
- ✅ **Monaco Code Editor**:
  - C-like syntax highlighting
  - Dark/light mode theme synchronization
  - Customizable font sizes (12px, 14px, 16px, 18px)
  - Keyboard shortcuts (`Ctrl+Enter` / `Cmd+Enter` to compile)
  - LocalStorage persistence
- ✅ **Input Management & Presets**:
  - "Run Pipeline" / "Compile" actions
  - Step-by-step actions ("Step: Lex", "Step: Syntax", "Step: Semantic")
  - "Clear All" action
  - 5 educational presets:
    1. *Variables & Arithmetic*
    2. *Function with Parameters*
    3. *Conditional Branches (If/Else)*
    4. *Loops (While & For)*
    5. *Semantic & Type Errors (Diagnostic Demo)*
- ✅ **Data Visualization Components**:
  - **Pipeline Flow Overview**: 6 phase cards displaying status badges (`Pass`, `Error`, `Warning`, `Idle`), execution times in ms, and artifact counts
  - **Token Stream Viewer**: Filterable, searchable table displaying Type, Lexeme Value, Line, Column with syntax pills
  - **Syntax Tree Viewer**: Interactive hierarchical AST tree with collapsible nodes (`[-]`/`[+]`), Expand/Collapse All controls, search filter, and JSON raw mode
  - **Scoped Symbol Table**: Table displaying Name, Type, Scope, Kind, Declaration Line with scope filtering and column sorting
  - **Error Panel**: Severity color-coded diagnostics with snippets and compiler suggestions
  - **Context Inspector**: Live metadata inspector for any clicked token, AST node, or symbol entry

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional for Neon DB)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Provide your Neon PostgreSQL connection string in `DATABASE_URL`. If left unconfigured, the app runs with an in-memory repository fallback seamlessly.

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Run Unit Tests
```bash
npm test
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Visit [http://localhost:3000/docs](http://localhost:3000/docs) for full interactive API and Architecture documentation.

---

## 📁 Architecture Directory Structure

```
CompilerPipelineVisualizer/
├── prisma/
│   └── schema.prisma             # Full database schema for Neon PostgreSQL
├── src/
│   ├── app/
│   │   ├── api/compile/
│   │   │   ├── lex/route.ts      # POST /api/compile/lex
│   │   │   ├── syntax/route.ts   # POST /api/compile/syntax
│   │   │   ├── semantic/route.ts # POST /api/compile/semantic
│   │   │   ├── pipeline/route.ts # POST /api/compile/pipeline
│   │   │   └── [sessionId]/
│   │   │       └── errors/route.ts# GET /api/compile/:sessionId/errors
│   │   ├── docs/page.tsx         # Interactive Architecture & API Docs
│   │   ├── layout.tsx            # Next.js Root Layout
│   │   ├── page.tsx              # Main 2-Column Application Workspace
│   │   └── globals.css           # Tailwind styles & theme variables
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.tsx        # Navigation bar & status indicators
│   │   │   └── Badge.tsx         # Reusable syntax & severity badge
│   │   ├── CodeEditor/
│   │   │   ├── CodeEditor.tsx    # Monaco Editor with shortcuts
│   │   │   └── EditorControls.tsx# Presets dropdown, compile & step buttons
│   │   ├── Pipeline/
│   │   │   ├── PipelineVisualizer.tsx # 6-phase architecture overview
│   │   │   └── PhaseCard.tsx     # Stage metrics card
│   │   ├── TokenList/
│   │   │   └── TokenList.tsx     # Searchable, filterable token table
│   │   ├── SyntaxTree/
│   │   │   ├── SyntaxTreeViewer.tsx # Collapsible AST viewer & JSON mode
│   │   │   └── TreeNode.tsx      # Recursive AST tree node
│   │   ├── SymbolTable/
│   │   │   └── SymbolTableViewer.tsx# Scoped symbol table with sorting
│   │   ├── ErrorPanel/
│   │   │   └── ErrorPanel.tsx    # Diagnostic error viewer with snippets
│   │   └── InfoPanel/
│   │       └── InfoPanel.tsx     # Context-aware metadata inspector
│   ├── lib/
│   │   ├── compiler/
│   │   │   ├── types.ts          # Core compiler AST, Token & Symbol types
│   │   │   ├── LexicalAnalyzer.ts# Regex tokenizer
│   │   │   ├── SyntaxAnalyzer.ts # Recursive descent parser
│   │   │   ├── SymbolTable.ts    # Hierarchical scope manager
│   │   │   ├── SemanticAnalyzer.ts# Type checker & scope resolver
│   │   │   ├── ErrorManager.ts   # Severity & snippet diagnostics
│   │   │   └── Pipeline.ts       # Multi-phase coordinator
│   │   ├── db/
│   │   │   ├── prisma.ts         # Prisma client singleton
│   │   │   └── repository.ts     # Persistence layer with memory fallback
│   │   ├── store/
│   │   │   └── useCompilerStore.ts# Zustand global store
│   │   └── examples/
│   │       └── codePresets.ts    # 5 sample programs
│   └── tests/
│       ├── lexer.test.ts         # 8 Lexer tests
│       ├── parser.test.ts        # 7 Parser tests
│       ├── symbolTable.test.ts   # 4 Symbol table tests
│       ├── semantic.test.ts      # 6 Semantic analysis tests
│       └── pipeline.test.ts      # 2 End-to-end integration tests
```
