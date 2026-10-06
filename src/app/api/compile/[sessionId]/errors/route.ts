import { NextRequest, NextResponse } from 'next/server';
import { CompilationRepository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID parameter required' },
        { status: 400 }
      );
    }

    const errors = await CompilationRepository.getErrorsBySessionId(sessionId);

    return NextResponse.json({
      success: true,
      sessionId,
      errors,
      totalCount: errors.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve errors' },
      { status: 500 }
    );
  }
}
