import { describe, it, expect } from 'vitest';
import { LexicalAnalyzer } from '../lib/compiler/LexicalAnalyzer';
import { SyntaxAnalyzer } from '../lib/compiler/SyntaxAnalyzer';
import { IRGenerator } from '../lib/compiler/IRGenerator';
import { ErrorManager } from '../lib/compiler/ErrorManager';

describe('IRGenerator (Ebin - Backend Lead)', () => {
  const generateTAC = (code: string) => {
    const errorManager = new ErrorManager(code);
    const lexer = new LexicalAnalyzer(errorManager);
    const tokens = lexer.tokenize(code);
    const parser = new SyntaxAnalyzer(errorManager);
    const ast = parser.parse(tokens);
    const irGenerator = new IRGenerator();
    return {
      tac: irGenerator.generate(ast!),
      blocks: irGenerator.toBasicBlocks(irGenerator.generate(ast!)),
    };
  };

  it('5. Generates TAC for binary arithmetic and assignments', () => {
    const code = `
      int a = 10;
      int b = 20;
      int c = a + b * 2;
    `;
    const { tac } = generateTAC(code);

    expect(tac.length).toBeGreaterThanOrEqual(4);
    expect(tac.some((i) => i.kind === 'assign' && i.result === 'a')).toBe(true);
    expect(tac.some((i) => i.kind === 'binary' && i.op === '*')).toBe(true);
    expect(tac.some((i) => i.kind === 'binary' && i.op === '+')).toBe(true);
  });

  it('6. Generates labels and conditional branches for if-else statements', () => {
    const code = `
      int x = 5;
      if (x > 0) {
        x = 10;
      } else {
        x = 0;
      }
    `;
    const { tac, blocks } = generateTAC(code);

    expect(tac.some((i) => i.kind === 'cjump')).toBe(true);
    expect(tac.some((i) => i.kind === 'jump')).toBe(true);
    expect(tac.some((i) => i.kind === 'label')).toBe(true);
    expect(blocks.length).toBeGreaterThanOrEqual(3);
  });

  it('7. Generates loop back-edges for while loops', () => {
    const code = `
      int count = 0;
      while (count < 5) {
        count = count + 1;
      }
    `;
    const { tac, blocks } = generateTAC(code);

    expect(tac.some((i) => i.kind === 'label' && i.label?.startsWith('while_start'))).toBe(true);
    expect(tac.some((i) => i.kind === 'jump' && i.label?.startsWith('while_start'))).toBe(true);
    expect(blocks.length).toBeGreaterThan(1);
  });

  it('8. Generates parameter pushes and function calls for functions', () => {
    const code = `
      int add(int a, int b) {
        return a + b;
      }
      int ans = add(10, 20);
    `;
    const { tac } = generateTAC(code);

    expect(tac.some((i) => i.kind === 'param')).toBe(true);
    expect(tac.some((i) => i.kind === 'call' && i.arg1 === 'add')).toBe(true);
    expect(tac.some((i) => i.kind === 'return')).toBe(true);
  });
});
