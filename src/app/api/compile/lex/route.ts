import { NextRequest, NextResponse } from 'next/server';
import { LexicalAnalyzer } from '@/lib/compiler/LexicalAnalyzer';
import { ErrorManager } from '@/lib/compiler/ErrorManager';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceCode, sessionId } = body;

    if (typeof sourceCode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Field "sourceCode" must be a string' },
        { status: 400 }
      );
    }

    const start = performance.now();
    const errorManager = new ErrorManager(sourceCode);
    const lexer = new LexicalAnalyzer(errorManager);
    const tokens = lexer.tokenize(sourceCode);
    const executionTimeMs = Number((performance.now() - start).toFixed(2));
    const errors = errorManager.getErrorsByPhase('LEXICAL');

    return NextResponse.json({
      success: errors.length === 0,
      phase: 'LEXICAL',
      sessionId: sessionId || `lex-${Date.now()}`,
      tokens,
      errors,
      executionTimeMs,
      tokenCount: tokens.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lexical analysis failed' },
      { status: 500 }
    );
  }
}
