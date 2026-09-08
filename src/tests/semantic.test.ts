import { describe, it, expect } from 'vitest';
import { LexicalAnalyzer } from '../lib/compiler/LexicalAnalyzer';
import { SyntaxAnalyzer } from '../lib/compiler/SyntaxAnalyzer';
import { SemanticAnalyzer } from '../lib/compiler/SemanticAnalyzer';
import { SymbolTable } from '../lib/compiler/SymbolTable';
import { ErrorManager } from '../lib/compiler/ErrorManager';

describe('SemanticAnalyzer (Kevin - Backend)', () => {
  const analyze = (code: string) => {
    const errorManager = new ErrorManager(code);
    const lexer = new LexicalAnalyzer(errorManager);
    const tokens = lexer.tokenize(code);
    const parser = new SyntaxAnalyzer(errorManager);
    const ast = parser.parse(tokens);
    const symbolTable = new SymbolTable();
    const analyzer = new SemanticAnalyzer(symbolTable, errorManager);
    const result = analyzer.analyze(ast);
    return {
      annotatedAst: result.annotatedAst,
      symbolTable: result.symbolTable,
      errors: errorManager.getErrorsByPhase('SEMANTIC'),
    };
  };

  it('20. Validates correct declarations and expressions without errors', () => {
    const code = `
      int a = 10;
      int b = 20;
      int sum = a + b;
    `;
    const { errors, symbolTable } = analyze(code);
    expect(errors.length).toBe(0);
    expect(symbolTable.getAllSymbols().length).toBe(3);
  });

  it('21. Catches type mismatch when assigning string to int', () => {
    const code = 'int count = "invalid_string_val";';
    const { errors } = analyze(code);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("cannot assign 'string' to 'int'");
  });

  it('22. Catches undeclared identifier usage in expressions', () => {
    const code = 'int y = unknownVar + 5;';
    const { errors } = analyze(code);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.message.includes("Undeclared identifier 'unknownVar'"))).toBe(true);
  });

  it('23. Detects duplicate variable redeclarations in the same scope', () => {
    const code = `
      int num = 10;
      int num = 20;
    `;
    const { errors } = analyze(code);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("Variable 'num' has already been declared");
  });

  it('24. Validates function argument types and parameter counts', () => {
    const code = `
      int multiply(int x, int y) {
        return x * y;
      }

      int res = multiply(5, "bad_type");
    `;
    const { errors } = analyze(code);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.message.includes("Argument 2 of 'multiply' expects type 'int', got 'string'"))).toBe(true);
  });

  it('25. Catches return type mismatch in function bodies', () => {
    const code = `
      int getNumber() {
        return "not an integer";
      }
    `;
    const { errors } = analyze(code);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.message.includes("Return type mismatch in function 'getNumber'"))).toBe(true);
  });
});
