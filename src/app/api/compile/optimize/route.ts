import { NextRequest, NextResponse } from 'next/server';
import { Optimizer } from '@/lib/compiler/Optimizer';
import { CompilerPipeline } from '@/lib/compiler/Pipeline';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceCode, tac } = body;

    let targetTac = tac;

    if (!targetTac && sourceCode) {
      const pipeline = new CompilerPipeline();
      const result = pipeline.run(sourceCode);
      targetTac = result.tac;
    }

    if (!targetTac || !Array.isArray(targetTac)) {
      return NextResponse.json(
        { error: 'Either valid TAC array or sourceCode string must be provided' },
        { status: 400 }
      );
    }

    const optimizer = new Optimizer();
    const { optimized, records, reductionPercent } = optimizer.optimize(targetTac);

    return NextResponse.json({
      success: true,
      originalCount: targetTac.length,
      optimizedCount: optimized.length,
      reductionPercent,
      passesApplied: records.length,
      optimizedTac: optimized,
      optimizationRecords: records,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
