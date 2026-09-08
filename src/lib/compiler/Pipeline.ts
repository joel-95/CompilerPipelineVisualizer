// Compiler Pipeline Orchestrator (Phase 1)
import { PipelineResult, Token, ProgramNode, SymbolEntry, CompilationError } from './types';
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

  constructor() {
    this.errorManager = new ErrorManager();
    this.lexer = new LexicalAnalyzer(this.errorManager);
    this.parser = new SyntaxAnalyzer(this.errorManager);
    this.semanticAnalyzer = new SemanticAnalyzer(new SymbolTable(), this.errorManager);
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

    return {
      sessionId,
      sourceCode,
      tokens,
      ast,
      symbolTable: symbols,
      errors: this.errorManager.getErrors(),
      phases: {
        lexical: lexicalStatus,
        syntax: syntaxPhase,
        semantic: semanticPhase,
        intermediate: {
          status: 'idle',
          executionTimeMs: 0,
          itemCount: 0,
          summary: 'Phase 2: Intermediate Three-Address Code',
        },
        optimizer: {
          status: 'idle',
          executionTimeMs: 0,
          itemCount: 0,
          summary: 'Phase 2: Code Optimizer',
        },
        target: {
          status: 'idle',
          executionTimeMs: 0,
          itemCount: 0,
          summary: 'Phase 2: Assembly Target Code',
        },
      },
    };
  }
}
