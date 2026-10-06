import { IRGenerator } from './IRGenerator';
import { Optimizer } from './Optimizer';
import { TargetCodeGenerator } from './TargetCodeGenerator';
import { RegisterAllocator } from './RegisterAllocator';
import { ErrorAnalyzer } from './ErrorAnalyzer';
import {
  PipelineResult,
  Token,
  ProgramNode,
  SymbolEntry,
  TACInstruction,
  OptimizationRecord,
  AsmInstruction,
  BasicBlock,
  RegisterAllocationResult,
  CompilationMetrics,
} from './types';
import { LexicalAnalyzer } from './LexicalAnalyzer';
import { SyntaxAnalyzer } from './SyntaxAnalyzer';
import { SemanticAnalyzer } from './SemanticAnalyzer';
import { SymbolTable } from './SymbolTable';
import { ErrorManager } from './ErrorManager';

export class CompilerPipeline {
  private errorManager: ErrorManager;
  private lexer: LexicalAnalyzer;
  private parser: SyntaxAnalyzer;
  private semanticAnalyzer: SemanticAnalyzer;
  private errorAnalyzer: ErrorAnalyzer;
  private irGenerator: IRGenerator;
  private optimizer: Optimizer;
  private targetCodeGenerator: TargetCodeGenerator;
  private registerAllocator: RegisterAllocator;

  constructor() {
    this.errorManager = new ErrorManager();
    this.lexer = new LexicalAnalyzer(this.errorManager);
    this.parser = new SyntaxAnalyzer(this.errorManager);
    this.semanticAnalyzer = new SemanticAnalyzer(new SymbolTable(), this.errorManager);
    this.errorAnalyzer = new ErrorAnalyzer(this.errorManager);
    this.irGenerator = new IRGenerator();
    this.optimizer = new Optimizer();
    this.targetCodeGenerator = new TargetCodeGenerator();
    this.registerAllocator = new RegisterAllocator();
  }

  public run(sourceCode: string, sessionId: string = `sess-${Date.now()}`): PipelineResult {
    this.errorManager.setSourceCode(sourceCode);

    // 1. Lexical Analysis Phase
    const lexStart = performance.now();
    const tokens: Token[] = this.lexer.tokenize(sourceCode);
    const lexTime = Number((performance.now() - lexStart).toFixed(2));
    const lexErrors = this.errorManager.getErrorsByPhase('LEXICAL');

    const lexicalStatus = {
      status: (lexErrors.length > 0 ? 'error' : 'success') as 'error' | 'success',
      executionTimeMs: lexTime,
      itemCount: tokens.filter((t) => t.type !== 'EOF').length,
      summary: `Generated ${tokens.length} tokens across ${new Set(tokens.map((t) => t.type)).size} types.`,
    };

    // 2. Syntax Analysis Phase
    let ast: ProgramNode | null = null;
    let synTime = 0;
    let synStatus: 'pending' | 'success' | 'warning' | 'error' = 'pending';

    const synStart = performance.now();
    try {
      ast = this.parser.parse(tokens);
      synTime = Number((performance.now() - synStart).toFixed(2));
      const synErrors = this.errorManager.getErrorsByPhase('SYNTAX');
      synStatus = synErrors.length > 0 ? 'error' : 'success';
    } catch (e: any) {
      synTime = Number((performance.now() - synStart).toFixed(2));
      synStatus = 'error';
    }

    const syntaxPhase = {
      status: synStatus,
      executionTimeMs: synTime,
      itemCount: ast ? ast.body.length : 0,
      summary: ast
        ? `Built AST with ${ast.body.length} top-level nodes.`
        : `Syntax parsing failed.`,
    };

    // 3. Semantic Analysis Phase
    let symbols: SymbolEntry[] = [];
    let semTime = 0;
    let semStatus: 'pending' | 'success' | 'warning' | 'error' = 'pending';

    if (ast && synStatus !== 'error') {
      const semStart = performance.now();
      try {
        const { symbolTable } = this.semanticAnalyzer.analyze(ast);
        symbols = symbolTable.getAllSymbols();
        semTime = Number((performance.now() - semStart).toFixed(2));
        const semErrors = this.errorManager.getErrorsByPhase('SEMANTIC');
        const hasSevereSemErrors = semErrors.some((e) => e.severity === 'ERROR');
        semStatus = hasSevereSemErrors ? 'error' : semErrors.length > 0 ? 'warning' : 'success';
      } catch (e: any) {
        semTime = Number((performance.now() - semStart).toFixed(2));
        semStatus = 'error';
      }
    }

    const semanticPhase = {
      status: semStatus,
      executionTimeMs: semTime,
      itemCount: symbols.length,
      summary: `Resolved ${symbols.length} symbols across active scopes.`,
    };

    // Run Static Diagnostic Analysis
    const staticReport = this.errorAnalyzer.analyze(ast, sourceCode);

    // Initialize backend structures
    let tac: TACInstruction[] = [];
    let optimizedTac: TACInstruction[] = [];
    let optimizations: OptimizationRecord[] = [];
    let basicBlocks: BasicBlock[] = [];
    let assembly: AsmInstruction[] = [];
    let registerAllocation: RegisterAllocationResult = {
      allocations: {},
      spills: [],
      spillOffsets: {},
      interferenceGraph: { nodes: [], edges: [], adjacency: {} },
      liveRanges: [],
      registerPressure: [],
      maxPressure: 0,
      availableRegisters: [],
    };

    let irStatus: 'pending' | 'success' | 'error' | 'idle' = 'idle';
    let optStatus: 'pending' | 'success' | 'error' | 'idle' = 'idle';
    let targetStatus: 'pending' | 'success' | 'error' | 'idle' = 'idle';

    let irTime = 0;
    let optTime = 0;
    let targetTime = 0;

    // Only run backend phases if front-end phases passed without fatal errors
    if (ast && semStatus !== 'error' && synStatus !== 'error') {
      // 4. Intermediate Code Generation
      const irStart = performance.now();
      try {
        tac = this.irGenerator.generate(ast);
        basicBlocks = this.irGenerator.toBasicBlocks(tac);
        irTime = Number((performance.now() - irStart).toFixed(2));
        irStatus = 'success';
      } catch (e: any) {
        irTime = Number((performance.now() - irStart).toFixed(2));
        irStatus = 'error';
      }

      // 5. Code Optimization
      if (irStatus === 'success') {
        const optStart = performance.now();
        try {
          const optResult = this.optimizer.optimize(tac);
          optimizedTac = optResult.optimized;
          optimizations = optResult.records;
          optTime = Number((performance.now() - optStart).toFixed(2));
          optStatus = 'success';
        } catch (e: any) {
          optTime = Number((performance.now() - optStart).toFixed(2));
          optStatus = 'error';
        }
      }

      // 6. Register Allocation & Target Code Generation
      if (optStatus === 'success') {
        const tgtStart = performance.now();
        try {
          const targetTac = optimizedTac.length > 0 ? optimizedTac : tac;
          registerAllocation = this.registerAllocator.allocate(targetTac);
          assembly = this.targetCodeGenerator.generate(targetTac, registerAllocation);
          targetTime = Number((performance.now() - tgtStart).toFixed(2));
          targetStatus = 'success';
        } catch (e: any) {
          targetTime = Number((performance.now() - tgtStart).toFixed(2));
          targetStatus = 'error';
        }
      }
    }

    const reductionPercent = tac.length > 0
      ? Number((((tac.length - optimizedTac.length) / tac.length) * 100).toFixed(1))
      : 0;

    const metrics: CompilationMetrics = {
      cyclomaticComplexity: staticReport.complexity.cyclomaticComplexity,
      astDepth: staticReport.complexity.depth,
      tokenCount: tokens.filter((t) => t.type !== 'EOF').length,
      lineCount: sourceCode.split('\n').length,
      tacCount: tac.length,
      optimizedTacCount: optimizedTac.length,
      asmCount: assembly.length,
      sizeReductionPercent: Math.max(0, reductionPercent),
      spillCount: registerAllocation.spills.length,
    };

    return {
      sessionId,
      sourceCode,
      tokens,
      ast,
      symbolTable: symbols,
      errors: this.errorManager.getErrors(),
      tac,
      optimizedTac,
      optimizations,
      basicBlocks,
      registerAllocation,
      assembly,
      metrics,
      phases: {
        lexical: lexicalStatus,
        syntax: syntaxPhase,
        semantic: semanticPhase,
        intermediate: {
          status: irStatus,
          executionTimeMs: irTime,
          itemCount: tac.length,
          summary: `Generated ${tac.length} TAC instructions across ${basicBlocks.length} basic blocks.`,
        },
        optimizer: {
          status: optStatus,
          executionTimeMs: optTime,
          itemCount: optimizations.length,
          summary: `Applied ${optimizations.length} optimization passes (${metrics.sizeReductionPercent}% code reduction).`,
        },
        target: {
          status: targetStatus,
          executionTimeMs: targetTime,
          itemCount: assembly.length,
          summary: `Generated ${assembly.length} x86-64 instructions with ${registerAllocation.maxPressure} register pressure.`,
        },
      },
    };
  }
}
