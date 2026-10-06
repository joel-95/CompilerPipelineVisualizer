import { NextRequest, NextResponse } from 'next/server';
import { LexicalAnalyzer } from '@/lib/compiler/LexicalAnalyzer';
import { SyntaxAnalyzer } from '@/lib/compiler/SyntaxAnalyzer';
import { SemanticAnalyzer } from '@/lib/compiler/SemanticAnalyzer';
import { SymbolTable } from '@/lib/compiler/SymbolTable';
import { ErrorManager } from '@/lib/compiler/ErrorManager';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceCode, ast: inputAst, sessionId } = body;

    let ast = inputAst;
    const errorManager = new ErrorManager(sourceCode || '');

    if (!ast && typeof sourceCode === 'string') {
      const lexer = new LexicalAnalyzer(errorManager);
      const tokens = lexer.tokenize(sourceCode);
      const parser = new SyntaxAnalyzer(errorManager);
      ast = parser.parse(tokens);
    }

    if (!ast || !ast.body) {
      return NextResponse.json(
        { success: false, error: 'Valid AST or sourceCode required' },
        { status: 400 }
      );
    }

    const start = performance.now();
    const symbolTable = new SymbolTable();
    const analyzer = new SemanticAnalyzer(symbolTable, errorManager);
    const { annotatedAst } = analyzer.analyze(ast);
    const executionTimeMs = Number((performance.now() - start).toFixed(2));
    const errors = errorManager.getErrorsByPhase('SEMANTIC');
    const hasSevereErrors = errors.some((e) => e.severity === 'ERROR');

    return NextResponse.json({
      success: !hasSevereErrors,
      phase: 'SEMANTIC',
      sessionId: sessionId || `sem-${Date.now()}`,
      annotatedAst,
      symbolTable: symbolTable.getAllSymbols(),
      errors,
      executionTimeMs,
      symbolCount: symbolTable.getAllSymbols().length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Semantic analysis failed' },
      { status: 500 }
    );
  }
}
