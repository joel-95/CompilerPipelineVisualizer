import { NextRequest, NextResponse } from 'next/server';
import { LexicalAnalyzer } from '@/lib/compiler/LexicalAnalyzer';
import { SyntaxAnalyzer } from '@/lib/compiler/SyntaxAnalyzer';
import { ErrorManager } from '@/lib/compiler/ErrorManager';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceCode, tokens: inputTokens, sessionId } = body;

    let tokens = inputTokens;
    const errorManager = new ErrorManager(sourceCode || '');

    if (!tokens && typeof sourceCode === 'string') {
      const lexer = new LexicalAnalyzer(errorManager);
      tokens = lexer.tokenize(sourceCode);
    }

    if (!Array.isArray(tokens)) {
      return NextResponse.json(
        { success: false, error: 'Provide either "tokens" array or "sourceCode" string' },
        { status: 400 }
      );
    }

    const start = performance.now();
    const parser = new SyntaxAnalyzer(errorManager);
    const ast = parser.parse(tokens);
    const executionTimeMs = Number((performance.now() - start).toFixed(2));
    const errors = errorManager.getErrorsByPhase('SYNTAX');

    return NextResponse.json({
      success: errors.length === 0,
      phase: 'SYNTAX',
      sessionId: sessionId || `syn-${Date.now()}`,
      ast,
      errors,
      executionTimeMs,
      nodeCount: ast.body.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Syntax analysis failed' },
      { status: 500 }
    );
  }
}
