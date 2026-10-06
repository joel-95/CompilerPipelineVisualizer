import { NextRequest, NextResponse } from 'next/server';
import { CompilationRepository } from '@/lib/db/repository';
import { CompilerPipeline } from '@/lib/compiler/Pipeline';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sessions = await CompilationRepository.listSessions();
    return NextResponse.json({ success: true, sessions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sourceCode, userId } = await req.json();
    if (!sourceCode || typeof sourceCode !== 'string') {
      return NextResponse.json({ error: 'sourceCode string is required' }, { status: 400 });
    }

    const pipeline = new CompilerPipeline();
    const result = pipeline.run(sourceCode);
    const sessionId = await CompilationRepository.saveSession(result, userId);

    return NextResponse.json({
      success: true,
      sessionId,
      result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
