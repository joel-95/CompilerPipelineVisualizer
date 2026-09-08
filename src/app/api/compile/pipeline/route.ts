import { NextRequest, NextResponse } from 'next/server';
import { CompilerPipeline } from '@/lib/compiler/Pipeline';
import { CompilationRepository } from '@/lib/db/repository';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceCode, sessionId, userId } = body;

    if (typeof sourceCode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Field "sourceCode" must be a string' },
        { status: 400 }
      );
    }

    const currentSessionId = sessionId || `sess-${Date.now()}`;
    const pipeline = new CompilerPipeline();
    const result = pipeline.run(sourceCode, currentSessionId);

    // Persist to Neon DB or memory fallback
    await CompilationRepository.saveSession(result, userId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Pipeline compilation failed' },
      { status: 500 }
    );
  }
}
