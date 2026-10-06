import { NextRequest, NextResponse } from 'next/server';
import { LexicalAnalyzer } from '@/lib/compiler/LexicalAnalyzer';
import { SyntaxAnalyzer } from '@/lib/compiler/SyntaxAnalyzer';
import { SemanticAnalyzer } from '@/lib/compiler/SemanticAnalyzer';
import { IRGenerator } from '@/lib/compiler/IRGenerator';
import { SymbolTable } from '@/lib/compiler/SymbolTable';
import { ErrorManager } from '@/lib/compiler/ErrorManager';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { sourceCode } = await req.json();
    if (!sourceCode || typeof sourceCode !== 'string') {
      return NextResponse.json({ error: 'sourceCode string is required' }, { status: 400 });
    }

    const errorManager = new ErrorManager(sourceCode);
    const lexer = new LexicalAnalyzer(errorManager);
    const tokens = lexer.tokenize(sourceCode);
    const parser = new SyntaxAnalyzer(errorManager);
    const ast = parser.parse(tokens);

    if (!ast) {
      return NextResponse.json(
        { error: 'Syntax parsing failed', errors: errorManager.getErrors() },
        { status: 422 }
      );
    }

    const symbolTable = new SymbolTable();
    const semanticAnalyzer = new SemanticAnalyzer(symbolTable, errorManager);
    semanticAnalyzer.analyze(ast);

    const semErrors = errorManager.getErrorsByPhase('SEMANTIC');
    if (semErrors.some((e) => e.severity === 'ERROR')) {
      return NextResponse.json(
        { error: 'Semantic analysis failed', errors: semErrors },
        { status: 422 }
      );
    }

    const irGenerator = new IRGenerator();
    const tac = irGenerator.generate(ast);
    const basicBlocks = irGenerator.toBasicBlocks(tac);
    const formatted = tac.map((i) => IRGenerator.format(i));

    return NextResponse.json({
      success: true,
      tac,
      basicBlocks,
      formatted,
      instructionCount: tac.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
