# Compiler Pipeline Visualizer — Comprehensive Interview Prep Guide

> **Project:** Compiler Pipeline Visualizer (CPV)
> **Stack:** Next.js 14 · TypeScript · Tailwind CSS · Zustand · Prisma · PostgreSQL (Neon) · Monaco Editor · Vitest
> **Course:** Software Architecture (Semester 5)
> **Repo:** `ebinthomas06/CompilerPipelineVisualizer`

---

## Table of Contents

1. [Project Overview & Purpose](#1-project-overview--purpose)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Tech Stack Breakdown](#3-tech-stack-breakdown)
4. [Phase 1: Lexical Analysis](#4-phase-1-lexical-analysis)
5. [Phase 2: Syntax Analysis (Parsing)](#5-phase-2-syntax-analysis-parsing)
6. [Phase 3: Semantic Analysis](#6-phase-3-semantic-analysis)
7. [Phase 4: Intermediate Code Generation (TAC)](#7-phase-4-intermediate-code-generation-tac)
8. [Phase 5: Code Optimization](#8-phase-5-code-optimization)
9. [Phase 6: Register Allocation & Target Code Generation](#9-phase-6-register-allocation--target-code-generation)
10. [Virtual CPU Simulator](#10-virtual-cpu-simulator)
11. [Pipeline Orchestration](#11-pipeline-orchestration)
12. [State Management — Zustand Store](#12-state-management--zustand-store)
13. [Database Layer — Prisma + PostgreSQL](#13-database-layer--prisma--postgresql)
14. [API Layer — Next.js Route Handlers](#14-api-layer--nextjs-route-handlers)
15. [UI Components Architecture](#15-ui-components-architecture)
16. [Design Patterns Used](#16-design-patterns-used)
17. [Error Handling Strategy](#17-error-handling-strategy)
18. [End-to-End Workflow Trace](#18-end-to-end-workflow-trace)
19. [Interview Questions & Answers](#19-interview-questions--answers)

---

## 1. Project Overview & Purpose

The **Compiler Pipeline Visualizer** is an interactive, browser-based educational tool demonstrating every stage of a C-like compiler pipeline — from raw source text to x86-64 pseudo-assembly. Users type code in a Monaco editor, hit **Run Pipeline**, and inspect each phase in an animated tab-based UI.

### Why this project matters (architectural context)

- **Separation of concerns**: each compiler phase is its own class with a single responsibility
- **Event-driven state**: Zustand store propagates results to all UI components reactively
- **Full-stack architecture**: Next.js API routes offload compilation to the server; if unavailable, the browser falls back to a pure client-side pipeline (dual-mode design)
- **Data persistence**: Neon PostgreSQL + Prisma stores each compilation session with full relational structure

---

## 2. High-Level Architecture

```
Browser (Next.js App Router)

  Monaco Code Editor  -->  Zustand Store (useCompilerStore)
                           - sourceCode, tokens, ast
                           - symbolTable, tac, optimizedTac
                           - assembly, metrics, simulationSteps
                           - sessions, modals, activePhase
  Tabs / Viewers  <-------
                           compileAll() triggers:
                           POST /api/compile/pipeline
                           (Next.js Server Route Handler)
                                     |
                           CompilerPipeline.run()
                           (pure TS - runs on server OR browser fallback)
                             LexicalAnalyzer -> SyntaxAnalyzer
                             -> SemanticAnalyzer -> IRGenerator
                             -> Optimizer -> RegisterAllocator
                             -> TargetCodeGenerator
                                     |
                           Prisma Client -> Neon PostgreSQL
                           (persist session + compilation data)
```

---

## 3. Tech Stack Breakdown

| Layer | Technology | Why chosen |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR + API Routes in one project; file-based routing |
| Language | TypeScript 5 | End-to-end type safety across compiler, API, and UI |
| UI | React 18 + Tailwind CSS v3 | Component model + utility CSS for rapid styled UI |
| Code Editor | Monaco Editor (@monaco-editor/react) | VS Code editor with syntax highlighting, line decorations |
| State | Zustand v4 | Minimal global store without Redux boilerplate |
| ORM | Prisma v5 | Type-safe database client + migrations |
| Database | PostgreSQL on Neon | Serverless Postgres; works with Next.js serverless functions |
| Testing | Vitest | Vite-compatible unit testing with ESM support |

---

## 4. Phase 1: Lexical Analysis

**File:** `src/lib/compiler/LexicalAnalyzer.ts` | **Class:** `LexicalAnalyzer`

**Input:** Raw source code string | **Output:** `Token[]`

### What it does

The lexer scans the source character-by-character and groups characters into **tokens** — the smallest meaningful units of a program.

### Token Types (`TokenType` union in `types.ts`)

```typescript
type TokenType =
  | 'KEYWORD'         // int, float, string, bool, void, if, else, while, for, return, function
  | 'IDENTIFIER'      // user-defined names (variables, function names)
  | 'NUMBER_LITERAL'  // 42, 3.14
  | 'STRING_LITERAL'  // "hello"
  | 'BOOLEAN_LITERAL' // true, false
  | 'OPERATOR'        // +, -, *, /, ==, !=, <, >, <=, >=, =, &&, ||, !
  | 'DELIMITER'       // (, ), {, }, [, ], ;, ,
  | 'COMMENT'         // // ... or /* ... */
  | 'ERROR'           // unrecognized character
  | 'EOF';            // end of file sentinel
```

### Token interface

```typescript
interface Token {
  id: string;       // unique UUID
  type: TokenType;
  value: string;    // raw text e.g. "42", "myVar", "+"
  line: number;     // 1-indexed source line
  column: number;   // 1-indexed column
}
```

### Implementation strategy

- **Keyword vs. Identifier:** Collect alphanumeric word, check against keywords Set. Match -> `KEYWORD`; else -> `IDENTIFIER`
- **Numbers:** Collect digits; dot followed by more digits -> float literal
- **Strings:** Read until closing `"` quote
- **Operators:** Two-char operators (`==`, `!=`, `<=`, `>=`, `&&`, `||`) matched first via lookahead; then single-char
- **Comments:** `//` skips to end of line; `/* */` skips until closing `*/`
- **Error tokens:** Unrecognized character -> `ERROR` token + `ErrorManager.addError()`

**Key design decision:** EOF token is always last — gives the parser a sentinel so it never goes out of bounds when calling `peek()` or `advance()`.

---

## 5. Phase 2: Syntax Analysis (Parsing)

**File:** `src/lib/compiler/SyntaxAnalyzer.ts` | **Class:** `SyntaxAnalyzer`

**Input:** `Token[]` | **Output:** `ProgramNode` (root of the AST)

### What it does

Takes the flat token list and builds an **Abstract Syntax Tree (AST)** — a hierarchical tree representing grammatical structure.

### Parsing technique: Recursive Descent Parser

- One parsing function per grammar rule; each function calls others recursively
- **Top-down, LL(1)-style**: peeks one token ahead to decide which production to apply
- Hand-written — no external parser generator library

### Grammar supported (C-like subset)

```
Program         ::= Statement*
Statement       ::= VarDecl | FunctionDecl | IfStmt | WhileStmt | ForStmt | ReturnStmt | ExpressionStmt
VarDecl         ::= Type IDENTIFIER ('=' Expression)? ';'
FunctionDecl    ::= 'function' IDENTIFIER '(' Params? ')' ':' Type Block
IfStmt          ::= 'if' '(' Expression ')' Statement ('else' Statement)?
WhileStmt       ::= 'while' '(' Expression ')' Statement
ForStmt         ::= 'for' '(' VarDecl? ';' Expr? ';' Expr? ')' Statement
ReturnStmt      ::= 'return' Expression? ';'
Expression      ::= Assignment
Assignment      ::= LogicalOr ('=' Assignment)?
LogicalOr       ::= LogicalAnd ('||' LogicalAnd)*
LogicalAnd      ::= Equality ('&&' Equality)*
Equality        ::= Relational (('=='|'!=') Relational)*
Relational      ::= Additive (('<'|'>'|'<='|'>=') Additive)*
Additive        ::= Multiplicative (('+' | '-') Multiplicative)*
Multiplicative  ::= Unary (('*' | '/' | '%') Unary)*
Unary           ::= ('-' | '!') Unary | Primary
Primary         ::= NUMBER | STRING | BOOL | IDENTIFIER ('(' Args? ')')? | '(' Expr ')'
```

### Key AST Node types

| Node type | Key fields |
|---|---|
| `Program` | `body: ASTNode[]` |
| `VariableDeclaration` | `varType`, `name`, `initializer?` |
| `FunctionDeclaration` | `name`, `returnType`, `params`, `body: BlockNode` |
| `IfStatement` | `condition`, `consequent`, `alternate?` |
| `WhileStatement` | `condition`, `body` |
| `ForStatement` | `init?`, `condition?`, `update?`, `body` |
| `BinaryExpression` | `operator`, `left`, `right` |
| `AssignmentExpression` | `operator`, `left: IdentifierNode`, `right` |
| `CallExpression` | `callee: string`, `args: ASTNode[]` |
| `Identifier` | `name: string` |
| `Literal` | `value`, `raw`, `literalType` |

### Error recovery

Syntax errors recorded in `ErrorManager`; parser attempts **panic mode recovery** — skips tokens until a synchronization point (`;` or `}`) to continue and report further errors.

---

## 6. Phase 3: Semantic Analysis

**File:** `src/lib/compiler/SemanticAnalyzer.ts` | **Class:** `SemanticAnalyzer`

**Input:** `ProgramNode` (AST) | **Output:** Populated `SymbolTable`

### What it does

Traverses the AST and verifies **meaning** beyond grammar:

- **Type checking:** Are operand types compatible?
- **Scope resolution:** Is every identifier declared before use?
- **Declaration checking:** No duplicate declarations in the same scope
- **Return type checking:** Does the function body return the declared type?
- **Type inference:** Infers `inferredType` on each AST node for downstream phases

### Symbol Table (`src/lib/compiler/SymbolTable.ts`)

```typescript
interface SymbolEntry {
  id: string;
  name: string;
  type: DataType | 'function'; // int, float, string, bool, void, unknown, function
  kind: 'variable' | 'function' | 'parameter';
  scope: string;          // 'global', 'func_main', 'block_0', etc.
  scopeLevel: number;     // 0 = global, 1 = function, 2 = nested block
  line: number;
  column: number;
  params?: { name: string; type: DataType }[]; // for functions
  returnType?: DataType;
  value?: any;
}
```

### Scoping mechanism

- `SymbolTable` maintains a **stack of scope maps**: `scopeStack: Map<string, SymbolEntry>[]`
- `enterScope()` pushes new empty map; `exitScope()` pops top map
- `lookup(name)` walks stack from top to bottom (inner-most scope wins)
- `declare(entry)` checks for duplicate in current scope only

### Semantic errors detected

| Error | Example |
|---|---|
| Undeclared variable | `x = 5;` where `x` was never declared |
| Duplicate declaration | `int x = 1; int x = 2;` in same scope |
| Type mismatch | `string s = 42;` |
| Wrong argument count | `add(1, 2, 3)` when `add(a, b)` takes 2 params |
| Missing return | `function foo(): int { }` with no `return` |

### Static Analysis (ErrorAnalyzer)

Runs after semantic analysis and computes:

- **Cyclomatic complexity**: counts `if`/`while`/`for`/`&&`/`||` nodes + 1
- **AST depth**: deepest path from root to leaf
- Lint-style warnings: unused variables, dead code hints

---

## 7. Phase 4: Intermediate Code Generation (TAC)

**File:** `src/lib/compiler/IRGenerator.ts` | **Class:** `IRGenerator`

**Input:** `ProgramNode` (annotated AST) | **Output:** `TACInstruction[]` + `BasicBlock[]`

### What is Three-Address Code (TAC)?

Each instruction has **at most two operands and one result**. This "flattens" complex expressions into a sequence of simple steps.

### TAC instruction kinds

```typescript
type TACKind =
  | 'assign'  // x = 5         (variable assigned literal/value)
  | 'binary'  // t0 = a + b    (binary arithmetic/relational)
  | 'unary'   // t1 = -x       (unary negation / logical not)
  | 'copy'    // t2 = t0       (temp-to-temp copy)
  | 'label'   // L0:           (branch target)
  | 'jump'    // goto L0       (unconditional jump)
  | 'cjump'   // if t3 goto L1 (conditional jump)
  | 'param'   // param arg     (push function argument)
  | 'call'    // t4 = call f,2 (function call with arg count)
  | 'return'  // return t4     (function return)
  | 'nop';    // no-op placeholder
```

### Full TACInstruction structure

```typescript
interface TACInstruction {
  id: string;             // unique ID e.g. "tac-1"
  kind: TACKind;
  result?: string;        // destination temp/variable e.g. "t0", "x"
  arg1?: string;          // first operand
  arg2?: string;          // second operand
  op?: string;            // operator: +, -, *, /, <, >, ==, etc.
  label?: string;         // for jump/label instructions: "L0", "func_main"
  nArgs?: number;         // argument count for call instructions
  sourceLineRef?: number; // maps back to source line (debugger sync)
}
```

### How expressions become TAC

Example: `a + b * c`

AST structure:
```
BinaryExpression(+)
+-- Identifier(a)
+-- BinaryExpression(*)
    +-- Identifier(b)
    +-- Identifier(c)
```

`genBinary()` runs recursively:
1. Right subtree: `genBinary(b * c)` -> emits `t0 = b * c`, returns `"t0"`
2. Outer call: left=`"a"`, right=`"t0"` -> emits `t1 = a + t0`, returns `"t1"`

Final TAC: `t0 = b * c` then `t1 = a + t0`

### Control flow lowering

**If-statement** `if (cond) { ... } else { ... }`:

```
<cond> -> t_cond
if t_cond goto if_true_0
goto if_false_1
if_true_0:
  <then-body>
  goto if_end_2
if_false_1:
  <else-body>
if_end_2:
```

**While-loop** `while (cond) { ... }`:

```
while_start_0:
  <cond> -> t_cond
  if t_cond goto while_body_1
  goto while_end_2
while_body_1:
  <body>
  goto while_start_0
while_end_2:
```

**For-loop** `for (init; cond; update) { ... }`:

```
<init>
for_start_0:
  <cond> -> t_cond
  if t_cond goto for_body_1
  goto for_end_2
for_body_1:
  <body>
  <update>
  goto for_start_0
for_end_2:
```

**Function calls** (caller-saves convention):

```
param arg1
param arg2
t0 = call functionName, 2
```

### Basic Block Construction (`toBasicBlocks`)

Partitions TAC into **Basic Blocks** — maximal sequences with one entry point, no internal jumps or labels.

**Leader identification rules:**
1. First instruction is always a leader
2. Instruction immediately following a `jump` or `cjump` is a leader
3. Target of any jump (a `label` instruction) is a leader

**CFG edges:**
- Block ending in `jump L` -> one successor (block at `L`)
- Block ending in `cjump` -> two successors (target block + fallthrough block)
- Block ending in anything else -> one fallthrough successor

```typescript
interface BasicBlock {
  id: string;             // "block-0", "block-1"
  name: string;           // "B0", "B_while_start_0"
  instructions: TACInstruction[];
  predecessors: string[]; // block IDs
  successors: string[];   // block IDs
}
```

---

## 8. Phase 5: Code Optimization

**File:** `src/lib/compiler/Optimizer.ts` | **Class:** `Optimizer`

**Input:** `TACInstruction[]`
**Output:** `{ optimized: TACInstruction[], records: OptimizationRecord[], reductionPercent: number }`

Runs up to **6 passes** in a fixed-point loop. Order maximizes synergy:

```
Constant Folding -> Constant Propagation -> Copy Propagation -> CSE -> Dead Code Elimination
```

Terminates early when instruction count stops decreasing (fixed-point convergence).

### Pass 1: Constant Folding

Both operands of a binary instruction are numeric literals -> compute at compile time.

```
t0 = 3 + 5   ->   t0 = 8
t1 = 2 < 10  ->   t1 = 1   (true -> 1)
```

`foldBinary(a, op, b)` handles: `+`, `-`, `*`, `/`, `%`, `<`, `>`, `<=`, `>=`, `==`, `!=`

### Pass 2: Constant Propagation

Track variables holding known constants. Substitute constants into operands.

- `constMap: Map<string, string>` maps variable -> known literal value
- `x = 5` -> `constMap.set('x', '5')`; later `t0 = x + y` -> `t0 = 5 + y`
- `x` reassigned non-constant -> `constMap.delete('x')` (invalidate)
- Creates opportunities for Constant Folding on the next pass

### Pass 3: Copy Propagation

If variable is alias of another, replace uses with the original.

- `copyMap: Map<string, string>` tracks non-constant assignments
- `y = x` -> `copyMap.set('y', 'x')`; later `z = y + 1` -> `z = x + 1`
- `resolve()` walks transitive alias chains
- `y` reassigned -> `copyMap.delete('y')` (invalidate)

### Pass 4: Common Subexpression Elimination (CSE)

Same expression computed twice without operand changes -> reuse first result.

- `exprMap: Map<string, string>` maps `"arg1 op arg2"` -> temp variable
- `t0 = a + b` -> `exprMap.set("a + b", "t0")`
- `t1 = a + b` -> **HIT!** Replace with `t1 = t0`
- Write to `a` or `b` invalidates all map entries containing them
- CSE clears map at labels/jumps (intra-block only, no global data-flow analysis)

### Pass 5: Dead Code Elimination (DCE)

Remove instructions whose result is never read.

1. Collect all `arg1`, `arg2`, `label` values -> `used` Set
2. Filter out instructions where `result` is compiler temp (`/^t\d+$/`) not in `used`
3. Named user variables are **never** removed (may have side effects; visible in debugger)

### OptimizationRecord

Every transformation logged as:

```typescript
interface OptimizationRecord {
  id: string;
  kind: OptimizationKind; // 'constant-folding' | 'constant-propagation' | etc.
  description: string;
  before: string;         // IR text before transformation
  after: string;          // IR text after (or 'removed')
}
```

---

## 9. Phase 6: Register Allocation & Target Code Generation

### Register Allocator

**File:** `src/lib/compiler/RegisterAllocator.ts`
**Algorithm:** Chaitin-Briggs Graph Coloring (Kempe Heuristic)

Available x86-64 registers (10 caller-saved): `rax, rbx, rcx, rdx, rsi, rdi, r8, r9, r10, r11`

**Step 1: Live Range Computation**

For each variable/temp, find its live range: earliest definition to latest use.

```typescript
interface LiveRange { variable: string; start: number; end: number; }
```

Scans every instruction; `result` marks definition, `arg1`/`arg2` mark uses. Final range = `[min, max]` of all occurrences.

**Step 2: Interference Graph**

Two variables **interfere** (cannot share a register) if live ranges overlap:

```
overlap = max(r1.start, r2.start) <= min(r1.end, r2.end)
```

Result: undirected graph — nodes = all variables/temps; edges = pairs with overlapping ranges.

**Step 3: Graph Coloring (K-coloring)**

Kempe's simplification heuristic:

1. **Simplification:** Find node with degree < K (K = 10 registers). Push onto stack, remove from graph.
2. **Spill Selection:** If no low-degree node, pick **highest-degree** node as potential spill. Push and remove.
3. **Reconstruction:** Pop nodes off stack. Assign first register not used by any already-colored neighbor.
4. **Actual Spilling:** If all K registers taken by neighbors -> spill to `[rbp - offset]` (8 bytes per slot).

**Register Pressure:** At each instruction, count simultaneously active live ranges -> per-instruction "pressure" count shown in TargetCodeViewer.

### Target Code Generator

**File:** `src/lib/compiler/TargetCodeGenerator.ts`

**Input:** Optimized `TACInstruction[]` + `RegisterAllocationResult`
**Output:** `AsmInstruction[]` (x86-64 pseudo-assembly)

```typescript
interface AsmInstruction {
  id: string;
  address: string;    // e.g. "0x0000", "0x0004" (4-byte increments)
  opcode: string;     // "mov", "add", "sub", "imul", "cmp", "jmp", "jne", "call", etc.
  operands: string;   // "rax, rbx" or "rax, 5" or "[rbp-8], rax"
  comment?: string;
  isLabel?: boolean;
  labelName?: string;
}
```

**Operand Resolution (`resolveOperand()`):**
- Numeric literal `"42"` -> immediate `42`
- Allocated variable `"x"` -> physical register e.g. `rax`
- Spilled variable `"t5"` -> stack memory `[rbp-8]`

**Standard Prologue:**

```nasm
push rbp          ; save caller's base pointer
mov  rbp, rsp     ; establish new stack frame
sub  rsp, N       ; reserve N bytes (spillCount x 8, min 16)
```

**Standard Epilogue (label: `epilogue`):**

```nasm
mov  rsp, rbp     ; restore stack pointer
pop  rbp          ; restore base pointer
ret               ; return to caller
```

**TAC -> x86-64 mapping:**

| TAC instruction | x86-64 output |
|---|---|
| `x = 5` | `mov rax, 5` |
| `t0 = a + b` | `mov rax, rbx` + `add rax, rcx` |
| `t1 = a - b` | `mov rax, rbx` + `sub rax, rcx` |
| `t2 = a * b` | `mov rax, rbx` + `imul rax, rcx` |
| `t3 = a / b` | `mov rax, rbx` + `cqo` + `idiv rcx` |
| `t4 = a % b` | `cqo` + `idiv rcx` -> result in `rdx` |
| `t5 = a < b` | `cmp rax, rbx` + `setl al` + `movzx rax, al` |
| `t6 = -a` | `neg rax` |
| `t7 = !a` | `test rax, rax` + `sete al` + `movzx rax, al` |
| `goto L0` | `jmp L0` |
| `if t goto L1` | `cmp rax, 0` + `jne L1` |
| `param x` | `push rbx` |
| `t8 = call foo, 2` | `call foo` + `add rsp, 16` + `mov dest, rax` |
| `return x` | `mov rax, rbx` + `jmp epilogue` |

---

## 10. Virtual CPU Simulator

**File:** `src/lib/compiler/VirtualSimulator.ts` | **Class:** `VirtualSimulator` (static `simulate`)

**Input:** `TACInstruction[]` + `RegisterAllocationResult` | **Output:** `SimulationStep[]`

The simulator **interprets** TAC instructions one-by-one, maintaining:

- **Program counter (PC):** current instruction index
- **Register file:** `Record<string, number|string|boolean>` (rax, rbx, rcx, rdx, rsi, rdi, r8-r11)
- **Memory (variable store):** `Record<string, any>` — named variables and temporaries
- **Stack:** `{ offset, name, value }[]` — spilled variables at `rbp-offset`
- **Output buffer:** `string[]` — for simulated printf calls

**Each step:**
1. Read instruction at `pc`
2. `resolveVal()` evaluates operands (checks memory, then physical register via regAlloc)
3. Execute instruction (arithmetic, branch, call, return)
4. `setVal()` writes result to memory AND mapped physical register
5. Snapshot entire state -> `SimulationStep` object
6. Advance `pc` (or jump if branch taken)

**Stopping conditions:** `return` instruction (sets `pc = tac.length`) OR max 100 steps (prevents infinite loop).

```typescript
interface SimulationStep {
  step: number;             // 1-indexed
  instructionIndex: number; // index into TAC array
  instructionText: string;  // e.g. "t0 = a + b"
  sourceLineRef?: number;   // original source line (for editor highlight)
  registers: Record<string, number | string | boolean>;
  stack: { offset: number; name?: string; value: any }[];
  output: string[];
  memory: Record<string, any>;
}
```

Powers the **Virtual CPU tab** — step forward/backward, real-time register/memory/stack updates, auto-play at 200ms-2000ms speed, editor line highlighting synchronized to current step.

---

## 11. Pipeline Orchestration

**File:** `src/lib/compiler/Pipeline.ts` | **Class:** `CompilerPipeline`

**Facade** pattern — hides all 8 compiler classes behind single `run()` method.

**`run(sourceCode, sessionId?)` flow:**
1. Lex -> tokens, record time + status
2. Parse -> AST (only if lex succeeded)
3. Semantic -> symbol table; handle warnings vs. fatal errors
4. Static analysis -> cyclomatic complexity, AST depth
5. IR generation -> TAC + basic blocks (only if semantic passed)
6. Optimization -> 5-pass optimizer (only if IR succeeded)
7. Register allocation + Target code -> assembly (only if optimization succeeded)
8. Metrics computation -> aggregate counts
9. Return `PipelineResult` -> all artefacts bundled

**Cascade behavior:** Each phase only runs if the preceding phase had no fatal ERROR. Prevents spurious errors cascading downstream.

```typescript
interface PipelineResult {
  sessionId: string; sourceCode: string;
  tokens: Token[]; ast: ProgramNode | null; symbolTable: SymbolEntry[];
  errors: CompilationError[]; tac: TACInstruction[]; optimizedTac: TACInstruction[];
  optimizations: OptimizationRecord[]; basicBlocks: BasicBlock[];
  registerAllocation: RegisterAllocationResult; assembly: AsmInstruction[];
  metrics: CompilationMetrics;
  phases: {
    lexical: PhaseStatus; syntax: PhaseStatus; semantic: PhaseStatus;
    intermediate: PhaseStatus; optimizer: PhaseStatus; target: PhaseStatus;
  };
}
```

---

## 12. State Management — Zustand Store

**File:** `src/lib/store/useCompilerStore.ts`

Entire application state in one Zustand store. Chosen over Redux for zero boilerplate, direct mutation-style API, excellent TypeScript inference.

**Store categories:**

| Category | Fields |
|---|---|
| Source | `sourceCode`, `fontSize`, `theme`, `autoCompile` |
| Compilation artefacts | `tokens`, `ast`, `symbolTable`, `errors`, `tac`, `optimizedTac`, `optimizations`, `basicBlocks`, `registerAllocation`, `assembly`, `metrics`, `phases` |
| UI navigation | `activePhase`, `highlightedLine`, `selectedItem`, `selectedItemType` |
| Debugger | `simulationSteps`, `currentStepIndex`, `isPlayingSimulation`, `simulationSpeed` |
| Session history | `sessions`, `isLoadingSessions`, `activeSessionId` |
| Modals | `isSettingsOpen`, `isHistoryOpen`, `isExportOpen` |

**`compileAll()` — key action:**

```typescript
compileAll: async () => {
  set({ isCompiling: true });
  // 1. Try server API first
  const response = await fetch('/api/compile/pipeline', {
    method: 'POST', body: JSON.stringify({ sourceCode })
  });
  // 2. Fallback to in-browser pipeline if server fails
  if (!resData) {
    const localPipeline = new CompilerPipeline();
    resData = localPipeline.run(sourceCode);
  }
  // 3. Run virtual simulator
  const simSteps = VirtualSimulator.simulate(simTac, resData.registerAllocation);
  // 4. Atomically update store
  set({ tokens, ast, symbolTable, errors, tac, optimizedTac, assembly, ... });
}
```

**Dual-mode pattern:** Server first for persistence; client-side fallback if unavailable. `CompilerPipeline` is pure TypeScript with no Node.js-only APIs — runs identically in browser.

**Simulation auto-play:** `setInterval` in module-level `playIntervalTimer`. `startAutoPlay()` calls `nextStep()` every `simulationSpeed` ms. Auto-stops at last step.

**Dark mode without flash:** Blocking `<script>` in `<head>` reads `cpv_theme` from localStorage and sets `document.documentElement.classList` before React hydrates. `toggleTheme()` updates class + localStorage synchronously.

---

## 13. Database Layer — Prisma + PostgreSQL

**File:** `prisma/schema.prisma` | **Runtime:** `src/lib/db/prisma.ts`, `src/lib/db/repository.ts`

**Schema:**

```
CompilationSession (1)
+-- LexicalToken[]       (tokens from lexer)
+-- SyntaxTree[]         (AST as JSON blob)
+-- SymbolEntry[]        (one row per symbol)
+-- SemanticInfo[]       (semantic errors/warnings)
+-- IntermediateCode[]   (one row per TAC line)
+-- CompilationError[]   (one row per error/warning)
```

All child tables: `onDelete: Cascade` — deleting a session removes all related data.

**Prisma client singleton (SSR-safe):**

```typescript
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

Prevents multiple Prisma instances during Next.js hot-reload in development.

**Neon PostgreSQL** — serverless Postgres with HTTP connection pooling, ideal for Next.js serverless functions.

---

## 14. API Layer — Next.js Route Handlers

**Directory:** `src/app/api/`

| Route | Method | Purpose |
|---|---|---|
| `/api/compile/pipeline` | POST | Run full pipeline server-side; persist to DB |
| `/api/compile/lex` | POST | Lex-only endpoint for isolated testing |
| `/api/sessions` | GET | List all sessions (summary) |
| `/api/sessions` | POST | Save current session manually |
| `/api/sessions/[id]` | GET | Load specific session source code |
| `/api/sessions/[id]` | DELETE | Delete session (cascades all related data) |

Uses Web API `Request`/`Response` (Next.js App Router convention). Route handlers call `repository.ts` functions which use the Prisma client.

---

## 15. UI Components Architecture

```
src/components/
+-- CodeEditor/CodeEditor.tsx         Monaco editor; theme, Ctrl+Enter, line highlights
+-- Pipeline/
|   +-- PipelineVisualizer.tsx        Animated phase flow bar at top
|   +-- PhaseCard.tsx                 Individual phase card (icon, status, time, count)
|   +-- IRViewer.tsx                  TAC + Basic Blocks viewer
|   +-- OptimizerViewer.tsx           Optimization records + before/after diffs
|   +-- TargetCodeViewer.tsx          Assembly + register allocation + live ranges
+-- TokenList/TokenList.tsx           Color-coded token grid with type filtering
+-- SyntaxTree/SyntaxTreeViewer.tsx   Recursive AST tree with expand/collapse
+-- SymbolTable/SymbolTableViewer.tsx Scope-grouped symbol table
+-- Debugger/DebuggerPanel.tsx        Step-through simulator (registers/memory/stack)
+-- ErrorPanel/ErrorPanel.tsx         Diagnostics: severity, phase, location, suggestions
+-- InfoPanel/InfoPanel.tsx           Metrics dashboard + complexity + phase timing
+-- common/
    +-- Navbar.tsx                    Header: logo, compile button, theme toggle, docs
    +-- HistoryModal.tsx              Session history browser (load/delete)
    +-- SettingsModal.tsx             Font size, auto-compile toggle, preset selector
    +-- ExportModal.tsx               Export as JSON or Markdown
    +-- Badge.tsx                     Reusable status badge component
```

**`page.tsx`:** 12-column grid — Left 5 cols: `CodeEditor`; Right 7 cols: tab bar + tab body. `activePhase` in store determines active tab.

---

## 16. Design Patterns Used

| Pattern | Where | How |
|---|---|---|
| **Facade** | `CompilerPipeline` | Hides 8 compiler classes behind single `run()` method |
| **Chain of Responsibility** | Pipeline phases | Each phase conditionally triggers the next |
| **Visitor** | `IRGenerator`, `SemanticAnalyzer` | `genNode()`/`visitNode()` dispatches on `node.type` |
| **Observer / Reactive** | Zustand store | Components re-render when subscribed state fields change |
| **Repository** | `src/lib/db/repository.ts` | Abstracts database operations from API layer |
| **Singleton** | Prisma client | Single instance shared across all route handlers |
| **Strategy** | `RegisterAllocator.colorGraph()` | Graph coloring algorithm is interchangeable |
| **Dual-Mode Resilience** | `compileAll()` | Try server -> fallback to browser (graceful degradation) |

---

## 17. Error Handling Strategy

**`ErrorManager`** (`src/lib/compiler/ErrorManager.ts`) — centralized error collector shared by all phases.

- Stores `CompilationError[]` with unique IDs, phase, severity, line, column, message, suggestion
- Methods: `addError()`, `getErrors()`, `getErrorsByPhase()`, `setSourceCode()`

**Two severity levels:**
- `ERROR`: Fatal — blocks downstream phases from running
- `WARNING`: Non-fatal — pipeline continues; shown in Diagnostics panel

**Error sources by phase:**
- `LEXICAL`: unrecognized characters, unclosed strings
- `SYNTAX`: unexpected tokens, mismatched braces, malformed expressions
- `SEMANTIC`: type mismatches, undeclared variables, missing returns
- `STATIC_ANALYSIS`: complexity warnings, dead code hints

---

## 18. End-to-End Workflow Trace

### Source: `int x = 3 + 5;`

**Step 1:** User clicks "Run Pipeline" -> `compileAll()` called on Zustand store

**Step 2:** `fetch('POST /api/compile/pipeline', { sourceCode: "int x = 3 + 5;" })`

**Step 3 — Lexical Analysis:**

```
[KEYWORD:"int", IDENTIFIER:"x", OPERATOR:"=", NUMBER_LITERAL:"3",
 OPERATOR:"+", NUMBER_LITERAL:"5", DELIMITER:";", EOF]
```

**Step 4 — Syntax Analysis:**

```
Program
+-- VariableDeclaration (type: int, name: x)
    +-- BinaryExpression (op: +)
        +-- Literal (value: 3)
        +-- Literal (value: 5)
```

**Step 5 — Semantic Analysis:**
- Declares `x` of type `int` in global scope
- Checks initializer `3 + 5`: both NUMBER_LITERAL -> infers `int` -> compatible with declared `int` OK
- Symbol table: `[{name:"x", type:"int", scope:"global", scopeLevel:0}]`

**Step 6 — IR Generation:**
- `genVarDecl(x = BinaryExpression)` calls `genBinary(3 + 5)`
- Emits: `t0 = 3 + 5` then `x = t0`

**Step 7 — Optimization:**
- Pass 1 (Constant Folding): `t0 = 3 + 5` -> `t0 = 8`
- Pass 2 (Constant Propagation): `x = t0` -> `x = 8` (t0 is known constant)
- Pass 5 (DCE): `t0 = 8` is now dead (t0 never read after propagation) -> removed
- **Result:** `x = 8` — 50% reduction (2 -> 1 instruction)

**Step 8 — Register Allocation:**
- `x` live range: start=0, end=0 (single instruction remaining)
- Interference graph: 1 node, 0 edges
- Coloring: `x` -> `rax` (first available, no conflicts)

**Step 9 — Target Code Generation:**

```nasm
push  rbp          ; save base pointer
mov   rbp, rsp     ; establish stack frame
sub   rsp, 16      ; reserve stack space
mov   rax, 8       ; x = 8
epilogue:
mov   rsp, rbp     ; restore stack pointer
pop   rbp          ; restore base pointer
ret                ; return to caller
```

**Step 10 — Simulation:**
- Step 1: execute `x = 8`, `memory['x'] = 8`, `registers['rax'] = 8`

**Step 11:** Store atomically updates -> all UI tabs re-render with new data

**Step 12 — Persistence:** Prisma inserts: 1 CompilationSession, 7 LexicalToken rows, 1 SyntaxTree (AST JSON), 1 SymbolEntry, 1 IntermediateCode row

---

## 19. Interview Questions & Answers

### General Architecture

**Q: Why TypeScript instead of C/C++ for the compiler?**

TypeScript compiles to JavaScript, allowing the pipeline to run **directly in the browser** without any server. This enables our dual-mode pattern — try server API first for persistence, fall back to client-side if unavailable. It also gives strong type safety across compiler internals + UI + API, catching many bugs at compile time.

**Q: How does your pipeline handle errors without stopping at the first one?**

We have a centralized `ErrorManager` shared across all phases. Each phase appends to it rather than throwing. The pipeline checks for `ERROR` severity errors between phases and stops cascading if found. This lets us collect multiple errors per compilation pass and show them all at once.

**Q: What software architecture patterns does your pipeline follow?**

`CompilerPipeline` is a **Facade** — single `run()` method hiding 8 internal classes. Internal phases follow **Chain of Responsibility** — each phase conditionally triggers the next. `IRGenerator` and `SemanticAnalyzer` use the **Visitor** pattern (dispatch on `node.type`). State management uses the **Observer** pattern via Zustand.

---

### Lexical Analysis

**Q: How does your lexer handle multi-character operators like `==` and `<=`?**

The lexer reads the current character, then **peeks** at the next. If current is `=` and next is `=`, it consumes both and returns `==` as a single OPERATOR token. Single-character `=` is only emitted when the lookahead doesn't form a valid two-character operator.

**Q: What happens with an invalid character in the source?**

An `ERROR` token is emitted with the character's position, and `ErrorManager.addError()` is called with phase `LEXICAL`, severity `ERROR`. The lexer advances past it and continues scanning — all errors in the file are collected in one pass.

---

### Syntax Analysis

**Q: What type of parser did you implement? Why?**

A **recursive descent parser** (top-down, LL(1)). Simplest to implement by hand while powerful enough for our grammar. Each grammar rule maps to a function, making code easy to read and debug. Gives natural, informative error messages because we know exactly which rule failed.

**Q: How does operator precedence work in your parser?**

Through the **function call stack**. Lower-precedence operators have their functions called first (outer calls), which then call higher-precedence functions (inner calls). `parseAdditive` calls `parseMultiplicative` which calls `parseUnary` which calls `parsePrimary`. Since `parsePrimary` returns first, its results become operands for `parseMultiplicative`, which become operands for `parseAdditive`. This naturally gives `*` higher precedence than `+`.

---

### Intermediate Representation

**Q: Why Three-Address Code and not SSA or another IR format?**

TAC is the most common textbook IR. Each instruction has at most 2 operands and 1 result, making optimization passes simple to reason about. Unlike SSA (Static Single Assignment), TAC is easier to generate from a recursive descent parser without needing a dominator tree analysis. It's also close enough to assembly that target code generation is straightforward.

**Q: What is a basic block and why does it matter?**

A basic block is a maximal sequence of TAC instructions with exactly one entry and one exit — no internal jumps or labels. They matter because optimization algorithms (like CSE) can be safely applied within a single basic block without worrying about control flow. Basic blocks form the nodes of the Control Flow Graph (CFG) used for data-flow analysis.

**Q: How does your IRGenerator handle a for-loop?**

Emits: initialization code first, then a label for loop start, then condition evaluation with `cjump` to body label and `jump` to end label, then body label, then body code, then update code, then unconditional `jump` back to loop start, then end label.

---

### Optimization

**Q: Explain Dead Code Elimination. Why do you only remove temporaries, not user variables?**

DCE removes instructions whose `result` is never read by any other instruction. We only remove compiler-generated temporaries (matching `/^t\d+$/`) because they are invisible to the programmer. User-named variables might be intentionally declared without being read (side effects, debugging), and removing them could confuse the user when comparing simulator behavior to source code.

**Q: What does "fixed-point iteration" mean in your optimizer?**

We run all 5 optimization passes repeatedly until the instruction count stops decreasing. When one pass fires (e.g., constant propagation), it creates opportunities for another (e.g., constant folding on propagated values). We stop after at most 6 iterations or when no instructions are removed — the fixed point where no pass can improve the code further.

**Q: Can your CSE work across basic blocks?**

No. Our CSE clears its expression map at every `label`, `jump`, or `cjump`. Without full data-flow analysis (reaching definitions, available expressions bit sets), it is unsafe to assume an expression is still valid after a branch. Extending CSE globally would require building a dominator tree — beyond our project scope.

---

### Register Allocation

**Q: Explain graph coloring in your register allocator.**

We model the problem as a graph where each variable is a node, and an edge connects two variables whose live ranges overlap — meaning they cannot share a register. We try to "color" this graph with K colors (K = 10 registers). The Kempe heuristic: find a node with fewer than K neighbors, push it onto a stack and remove it. If no such node exists, spill the highest-degree node. Then pop nodes, assigning the first register not used by any already-colored neighbor.

**Q: What is a register spill and how does your code handle it?**

A spill occurs when the interference graph has a clique larger than K — more simultaneous live variables than available registers. The spilled variable is stored in memory at `[rbp - offset]`. `TargetCodeGenerator.resolveOperand()` checks `spillOffsets` — if a variable was spilled, it generates memory references like `[rbp-8]` instead of register names.

---

### State Management

**Q: Why Zustand over Redux for this project?**

Zustand requires zero boilerplate — no actions, reducers, or dispatch. State updates are direct mutations using `set()`. For a project of this size, Zustand's simplicity speeds development without sacrificing reactivity or TypeScript support. Redux overhead would be justified for a larger team needing complex action tracing or time-travel debugging.

**Q: How does your app work offline without the database?**

`compileAll()` first tries `fetch('/api/compile/pipeline')`. If it fails, it silently falls back to `new CompilerPipeline().run(sourceCode)` directly in the browser. `CompilerPipeline` is pure TypeScript with no Node.js-only APIs — it runs identically in the browser. Session history won't persist offline, but the full compilation pipeline and visualization work fine.

---

### Frontend

**Q: How does Monaco editor integrate with your compiler?**

`CodeEditor.tsx` wraps `@monaco-editor/react`. It subscribes to `sourceCode` and `fontSize` from the Zustand store. When content changes, it calls `setSourceCode()` which also triggers `compileAll()` if `autoCompile` is enabled. Ctrl+Enter calls `compileAll()` directly. The editor also receives `highlightedLine` from the store (set by the debugger as it steps through simulation) and applies a Monaco delta decoration to highlight that line.

**Q: How is dark/light mode implemented without a flash of unstyled content?**

A blocking `<script>` in `<head>` (before React hydrates) reads `cpv_theme` from localStorage and immediately adds/removes the `dark` class on `<html>`. Tailwind's `dark:` prefix uses this class. Since the script runs synchronously before the page renders, there is no flash. `toggleTheme()` in the store also updates the class and localStorage synchronously.

---

*Good luck in your interview! This document covers the complete technical depth of the Compiler Pipeline Visualizer project.*
