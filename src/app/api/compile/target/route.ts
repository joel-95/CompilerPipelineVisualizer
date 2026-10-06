import { NextRequest, NextResponse } from 'next/server';
import { TargetCodeGenerator } from '@/lib/compiler/TargetCodeGenerator';
import { RegisterAllocator } from '@/lib/compiler/RegisterAllocator';
import { CompilerPipeline } from '@/lib/compiler/Pipeline';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceCode, tac } = body;

    let targetTac = tac;

    if (!targetTac && sourceCode) {
      const pipeline = new CompilerPipeline();
      const result = pipeline.run(sourceCode);
      targetTac = result.optimizedTac.length > 0 ? result.optimizedTac : result.tac;
    }

    if (!targetTac || !Array.isArray(targetTac)) {
      return NextResponse.json(
        { error: 'Either valid TAC array or sourceCode string must be provided' },
        { status: 400 }
      );
    }

    const allocator = new RegisterAllocator();
    const regAllocation = allocator.allocate(targetTac);

    const targetGenerator = new TargetCodeGenerator();
    const assembly = targetGenerator.generate(targetTac, regAllocation);

    return NextResponse.json({
      success: true,
      registerAllocation: regAllocation,
      assembly,
      instructionCount: assembly.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
