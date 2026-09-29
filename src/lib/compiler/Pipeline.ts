import { IRGenerator } from './IRGenerator';
import { Optimizer } from './Optimizer';
import { TargetCodeGenerator } from './TargetCodeGenerator';
import { PipelineResult, Token, ProgramNode, SymbolEntry, CompilationError, TACInstruction, OptimizationRecord, AsmInstruction } from './types';
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
  private irGenerator: IRGenerator;
  private optimizer: Optimizer;
  private targetCodeGenerator: TargetCodeGenerator;

  constructor() {
    this.errorManager = new ErrorManager();
    this.lexer = new LexicalAnalyzer(this.errorManager);
    this.parser = new SyntaxAnalyzer(this.errorManager);
    this.semanticAnalyzer = new SemanticAnalyzer(new SymbolTable(), this.errorManager);
    this.irGenerator = new IRGenerator();
    this.optimizer = new Optimizer();
    this.targetCodeGenerator = new TargetCodeGenerator();
  }

  public run(sourceCode: string, sessionId: string = `sess-${Date.now()}`): PipelineResult {
    const startTime = performance.now();
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

    if (ast) {
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

    // Initialize backend structures
    let tac: TACInstruction[] = [];
    let optimizedTac: TACInstruction[] = [];
    let optimizations: OptimizationRecord[] = [];
    let assembly: AsmInstruction[] = [];

    let irStatus: 'pending' | 'success' | 'error' | 'idle' = 'idle';
    let optStatus: 'pending' | 'success' | 'error' | 'idle' = 'idle';
    let targetStatus: 'pending' | 'success' | 'error' | 'idle' = 'idle';

    let irTime = 0;
    let optTime = 0;
    let targetTime = 0;

    // Only run backend phases if semantic phase passed
    if (ast && semStatus !== 'error') {
      // 4. Intermediate Code Generation
      const irStart = performance.now();
      try {
        tac = this.irGenerator.generate(ast);
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

      // 6. Target Code Generation
      if (optStatus === 'success') {
        const tgtStart = performance.now();
        try {
          assembly = this.targetCodeGenerator.generate(optimizedTac);
          targetTime = Number((performance.now() - tgtStart).toFixed(2));
          targetStatus = 'success';
        } catch (e: any) {
          targetTime = Number((performance.now() - tgtStart).toFixed(2));
          targetStatus = 'error';
        }
      }
    }

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
      assembly,
      phases: {
        lexical: lexicalStatus,
        syntax: syntaxPhase,
        semantic: semanticPhase,
        intermediate: {
          status: irStatus,
          executionTimeMs: irTime,
          itemCount: tac.length,
          summary: `Generated ${tac.length} TAC instructions.`,
        },
        optimizer: {
          status: optStatus,
          executionTimeMs: optTime,
          itemCount: optimizations.length,
          summary: `Applied ${optimizations.length} optimization passes.`,
        },
        target: {
          status: targetStatus,
          executionTimeMs: targetTime,
          itemCount: assembly.length,
          summary: `Generated ${assembly.length} x86-64 assembly instructions.`,
        },
      },
    };
  }
}
