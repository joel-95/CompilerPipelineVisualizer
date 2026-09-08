import { describe, it, expect } from 'vitest';
import { CompilerPipeline } from '../lib/compiler/Pipeline';

describe('CompilerPipeline (End-to-End Integration)', () => {
  it('26. Runs complete pipeline on valid program successfully', () => {
    const pipeline = new CompilerPipeline();
    const code = `
      int computeFactorial(int n) {
        int result = 1;
        int i = 1;
        while (i <= n) {
          result = result * i;
          i = i + 1;
        }
        return result;
      }

      int answer = computeFactorial(5);
    `;

    const result = pipeline.run(code, 'test-sess-1');

    expect(result.tokens.length).toBeGreaterThan(15);
    expect(result.ast).not.toBeNull();
    expect(result.symbolTable.length).toBeGreaterThan(3);
    expect(result.errors.filter((e) => e.severity === 'ERROR').length).toBe(0);

    expect(result.phases.lexical.status).toBe('success');
    expect(result.phases.syntax.status).toBe('success');
    expect(result.phases.semantic.status).toBe('success');
    expect(result.phases.lexical.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('27. Correctly reflects error phase status when given semantic errors', () => {
    const pipeline = new CompilerPipeline();
    const code = `
      int valid = 10;
      int broken = "string into int";
    `;

    const result = pipeline.run(code, 'test-sess-err');

    expect(result.phases.lexical.status).toBe('success');
    expect(result.phases.syntax.status).toBe('success');
    expect(result.phases.semantic.status).toBe('error');
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
