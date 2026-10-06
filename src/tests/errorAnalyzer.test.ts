import { describe, it, expect } from 'vitest';
import { LexicalAnalyzer } from '../lib/compiler/LexicalAnalyzer';
import { SyntaxAnalyzer } from '../lib/compiler/SyntaxAnalyzer';
import { ErrorAnalyzer } from '../lib/compiler/ErrorAnalyzer';
import { ErrorManager } from '../lib/compiler/ErrorManager';

describe('ErrorAnalyzer (Kevin - Backend)', () => {
  const analyzeStatic = (code: string) => {
    const errorManager = new ErrorManager(code);
    const lexer = new LexicalAnalyzer(errorManager);
    const tokens = lexer.tokenize(code);
    const parser = new SyntaxAnalyzer(errorManager);
    const ast = parser.parse(tokens);
    const errorAnalyzer = new ErrorAnalyzer(errorManager);
    return errorAnalyzer.analyze(ast, code);
  };

  it('16. Detects division by zero in constant arithmetic expressions', () => {
    const code = 'int bad = 100 / 0;';
    const report = analyzeStatic(code);

    expect(report.errors.length).toBeGreaterThan(0);
    expect(report.errors.some((e) => e.message.includes('Division by zero'))).toBe(true);
  });

  it('17. Detects unused variables and raises static warnings', () => {
    const code = `
      int unusedVariable = 42;
      int used = 10;
      int res = used + 5;
    `;
    const report = analyzeStatic(code);

    expect(report.warnings.some((w) => w.message.includes("Variable 'unusedVariable' is declared but never referenced"))).toBe(true);
  });

  it('18. Detects unreachable code after return statements', () => {
    const code = `
      int testFunc() {
        return 1;
        int deadVar = 10;
      }
    `;
    const report = analyzeStatic(code);

    expect(report.warnings.some((w) => w.message.includes('Unreachable statement after return'))).toBe(true);
  });

  it('19. Computes cyclomatic complexity accurately', () => {
    const code = `
      int compute(int x) {
        if (x > 10) {
          return 1;
        } else {
          return 0;
        }
      }
    `;
    const report = analyzeStatic(code);

    expect(report.complexity.cyclomaticComplexity).toBeGreaterThanOrEqual(3);
  });
});
