import { NextRequest, NextResponse } from 'next/server';
import { CompilationRepository } from '@/lib/db/repository';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const session = await CompilationRepository.getSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: `Session '${sessionId}' not found` }, { status: 404 });
    }

    return NextResponse.json({ success: true, session });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const deleted = await CompilationRepository.deleteSession(sessionId);
    return NextResponse.json({ success: true, deleted, sessionId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
