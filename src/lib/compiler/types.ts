// Compiler Pipeline Visualizer - Core Types

export type TokenType =
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'NUMBER_LITERAL'
  | 'STRING_LITERAL'
  | 'BOOLEAN_LITERAL'
  | 'OPERATOR'
  | 'DELIMITER'
  | 'COMMENT'
  | 'ERROR'
  | 'EOF';

export interface Token {
  id: string;
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export type ErrorSeverity = 'ERROR' | 'WARNING';
export type CompilerPhase = 'LEXICAL' | 'SYNTAX' | 'SEMANTIC' | 'INTERMEDIATE' | 'OPTIMIZER' | 'TARGET' | 'STATIC_ANALYSIS';

export interface CompilationError {
  id: string;
  phase: CompilerPhase;
  severity: ErrorSeverity;
  message: string;
  line: number;
  column: number;
  codeSnippet?: string;
  suggestion?: string;
}

export type DataType = 'int' | 'float' | 'string' | 'bool' | 'void' | 'unknown';

export interface ASTNode {
  id: string;
  type: string;
  line: number;
  column: number;
  inferredType?: DataType;
  metadata?: Record<string, any>;
  children?: ASTNode[];
  [key: string]: any;
}

export interface ProgramNode extends ASTNode {
  type: 'Program';
  body: ASTNode[];
}

export interface VarDeclNode extends ASTNode {
  type: 'VariableDeclaration';
  varType: DataType;
  name: string;
  initializer?: ASTNode | null;
}

export interface FunctionDeclNode extends ASTNode {
  type: 'FunctionDeclaration';
  name: string;
  returnType: DataType;
  params: { name: string; type: DataType; line: number; column: number }[];
  body: BlockNode;
}

export interface BlockNode extends ASTNode {
  type: 'BlockStatement';
  statements: ASTNode[];
}

export interface IfNode extends ASTNode {
  type: 'IfStatement';
  condition: ASTNode;
  consequent: ASTNode;
  alternate?: ASTNode | null;
}

export interface WhileNode extends ASTNode {
  type: 'WhileStatement';
  condition: ASTNode;
  body: ASTNode;
}

export interface ForNode extends ASTNode {
  type: 'ForStatement';
  init?: ASTNode | null;
  condition?: ASTNode | null;
  update?: ASTNode | null;
  body: ASTNode;
}

export interface ReturnNode extends ASTNode {
  type: 'ReturnStatement';
  argument?: ASTNode | null;
}

export interface ExpressionStatementNode extends ASTNode {
  type: 'ExpressionStatement';
  expression: ASTNode;
}

export interface AssignmentNode extends ASTNode {
  type: 'AssignmentExpression';
  operator: string;
  left: IdentifierNode;
  right: ASTNode;
}

export interface BinaryOpNode extends ASTNode {
  type: 'BinaryExpression';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryOpNode extends ASTNode {
  type: 'UnaryExpression';
  operator: string;
  argument: ASTNode;
  prefix: boolean;
}

export interface CallNode extends ASTNode {
  type: 'CallExpression';
  callee: string;
  args: ASTNode[];
}

export interface IdentifierNode extends ASTNode {
  type: 'Identifier';
  name: string;
}

export interface LiteralNode extends ASTNode {
  type: 'Literal';
  value: number | string | boolean;
  raw: string;
  literalType: DataType;
}

export interface SymbolEntry {
  id: string;
  name: string;
  type: DataType | 'function';
  kind: 'variable' | 'function' | 'parameter';
  scope: string;
  scopeLevel: number;
  line: number;
  column: number;
  params?: { name: string; type: DataType }[];
  returnType?: DataType;
  value?: any;
}

export interface PhaseStatus {
  status: 'idle' | 'pending' | 'success' | 'warning' | 'error';
  executionTimeMs: number;
  itemCount: number;
  summary?: string;
}

// ─── Intermediate Representation (Three-Address Code) ────────────────────────

export type TACKind =
  | 'assign'      // result = arg1
  | 'binary'      // result = arg1 op arg2
  | 'unary'       // result = op arg1
  | 'copy'        // result = arg1  (alias for assign between temps)
  | 'label'       // label:
  | 'jump'        // goto label
  | 'cjump'       // if arg1 goto label  /  ifFalse arg1 goto label
  | 'call'        // result = call callee, nArgs
  | 'param'       // param arg1
  | 'return'      // return arg1?
  | 'nop';        // no-op placeholder

export interface TACInstruction {
  id: string;
  kind: TACKind;
  result?: string;   // destination temp / variable
  arg1?: string;     // first operand
  arg2?: string;     // second operand
  op?: string;       // operator (+, -, *, /, <, >, ==, !=, <=, >=)
  label?: string;    // for jump / label instructions
  nArgs?: number;    // number of args for call
  sourceLineRef?: number;
}

export interface BasicBlock {
  id: string;
  name: string;
  instructions: TACInstruction[];
  predecessors: string[];
  successors: string[];
}

// ─── Optimizer ───────────────────────────────────────────────────────────────

export type OptimizationKind =
  | 'constant-folding'
  | 'dead-code-elimination'
  | 'copy-propagation'
  | 'constant-propagation'
  | 'common-subexpression-elimination';

export interface OptimizationRecord {
  id: string;
  kind: OptimizationKind;
  description: string;
  before: string;   // human-readable before
  after: string;    // human-readable after (or 'removed')
}

// ─── Register Allocation ───────────────────────────────────────────────────

export interface LiveRange {
  variable: string;
  start: number;
  end: number;
}

export interface InterferenceGraph {
  nodes: string[];
  edges: [string, string][];
  adjacency: Record<string, string[]>;
}

export interface RegisterAllocationResult {
  allocations: Record<string, string>; // var/temp -> register (e.g. "t0" -> "rax")
  spills: string[];                    // variables spilled to stack
  spillOffsets: Record<string, number>;// var -> offset (e.g. "t5" -> -8)
  interferenceGraph: InterferenceGraph;
  liveRanges: LiveRange[];
  registerPressure: { line: number; activeVariables: string[]; pressureCount: number }[];
  maxPressure: number;
  availableRegisters: string[];
}

// ─── Target Code (pseudo-assembly) ──────────────────────────────────────────

export interface AsmInstruction {
  id: string;
  address: string;        // e.g. "0x0000"
  opcode: string;         // mov, add, sub, mul, cmp, jmp, …
  operands: string;       // e.g. "rax, rbx"
  comment?: string;       // source annotation
  isLabel?: boolean;      // true for label pseudo-instructions
  labelName?: string;
}

// ─── Metrics & Debugging Simulation ─────────────────────────────────────────

export interface CompilationMetrics {
  cyclomaticComplexity: number;
  astDepth: number;
  tokenCount: number;
  lineCount: number;
  tacCount: number;
  optimizedTacCount: number;
  asmCount: number;
  sizeReductionPercent: number;
  spillCount: number;
}

export interface SimulationStep {
  step: number;
  instructionIndex: number;
  instructionText: string;
  sourceLineRef?: number;
  registers: Record<string, number | string | boolean>;
  stack: { offset: number; name?: string; value: any }[];
  output: string[];
  memory: Record<string, any>;
}

// ─── Pipeline Result ─────────────────────────────────────────────────────────

export interface PipelineResult {
  sessionId: string;
  sourceCode: string;
  tokens: Token[];
  ast: ProgramNode | null;
  symbolTable: SymbolEntry[];
  errors: CompilationError[];
  tac: TACInstruction[];
  optimizedTac: TACInstruction[];
  optimizations: OptimizationRecord[];
  basicBlocks: BasicBlock[];
  registerAllocation: RegisterAllocationResult;
  assembly: AsmInstruction[];
  metrics: CompilationMetrics;
  phases: {
    lexical: PhaseStatus;
    syntax: PhaseStatus;
    semantic: PhaseStatus;
    intermediate: PhaseStatus;
    optimizer: PhaseStatus;
    target: PhaseStatus;
  };
}
