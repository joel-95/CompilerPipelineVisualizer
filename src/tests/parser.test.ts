import { describe, it, expect } from 'vitest';
import { LexicalAnalyzer } from '../lib/compiler/LexicalAnalyzer';
import { SyntaxAnalyzer } from '../lib/compiler/SyntaxAnalyzer';
import { ErrorManager } from '../lib/compiler/ErrorManager';

describe('SyntaxAnalyzer (Kevin - Backend)', () => {
  const parse = (code: string) => {
    const errorManager = new ErrorManager(code);
    const lexer = new LexicalAnalyzer(errorManager);
    const tokens = lexer.tokenize(code);
    const parser = new SyntaxAnalyzer(errorManager);
    const ast = parser.parse(tokens);
    return { ast, errorManager };
  };

  it('9. Parses variable declarations with initializer', () => {
    const { ast } = parse('int age = 21;');
    expect(ast.body.length).toBe(1);

    const varDecl = ast.body[0] as any;
    expect(varDecl.type).toBe('VariableDeclaration');
    expect(varDecl.varType).toBe('int');
    expect(varDecl.name).toBe('age');
    expect(varDecl.initializer.type).toBe('Literal');
    expect(varDecl.initializer.value).toBe(21);
  });

  it('10. Enforces arithmetic operator precedence (* before +)', () => {
    const { ast } = parse('int result = 2 + 3 * 4;');
    const varDecl = ast.body[0] as any;
    const init = varDecl.initializer;

    // Outer operation should be '+'
    expect(init.type).toBe('BinaryExpression');
    expect(init.operator).toBe('+');
    expect(init.left.value).toBe(2);

    // Inner right operation should be '*'
    expect(init.right.type).toBe('BinaryExpression');
    expect(init.right.operator).toBe('*');
    expect(init.right.left.value).toBe(3);
    expect(init.right.right.value).toBe(4);
  });

  it('11. Parses if-else branching statements', () => {
    const code = `
      if (x > 0) {
        int pos = 1;
      } else {
        int neg = 0;
      }
    `;
    const { ast } = parse(code);
    expect(ast.body.length).toBe(1);

    const ifStmt = ast.body[0] as any;
    expect(ifStmt.type).toBe('IfStatement');
    expect(ifStmt.condition.type).toBe('BinaryExpression');
    expect(ifStmt.condition.operator).toBe('>');
    expect(ifStmt.consequent.type).toBe('BlockStatement');
    expect(ifStmt.alternate.type).toBe('BlockStatement');
  });

  it('12. Parses while loop statements', () => {
    const code = `
      while (count < 10) {
        count = count + 1;
      }
    `;
    const { ast } = parse(code);
    const whileStmt = ast.body[0] as any;

    expect(whileStmt.type).toBe('WhileStatement');
    expect(whileStmt.condition.operator).toBe('<');
    expect(whileStmt.body.type).toBe('BlockStatement');
  });

  it('13. Parses for loop with init, condition, and update', () => {
    const code = `
      for (int i = 0; i < 5; i = i + 1) {
        int square = i * i;
      }
    `;
    const { ast } = parse(code);
    const forStmt = ast.body[0] as any;

    expect(forStmt.type).toBe('ForStatement');
    expect(forStmt.init.type).toBe('VariableDeclaration');
    expect(forStmt.condition.operator).toBe('<');
    expect(forStmt.update.type).toBe('AssignmentExpression');
  });

  it('14. Parses function declarations with typed parameter lists', () => {
    const code = `
      int add(int a, int b) {
        return a + b;
      }
    `;
    const { ast } = parse(code);
    const func = ast.body[0] as any;

    expect(func.type).toBe('FunctionDeclaration');
    expect(func.name).toBe('add');
    expect(func.returnType).toBe('int');
    expect(func.params.length).toBe(2);
    expect(func.params[0]).toMatchObject({ name: 'a', type: 'int' });
    expect(func.params[1]).toMatchObject({ name: 'b', type: 'int' });
    expect(func.body.statements.length).toBe(1);
  });

  it('15. Recovers from syntax errors on missing tokens without terminating execution', () => {
    const code = `
      int x = ;
      int y = 50;
    `;
    const { ast, errorManager } = parse(code);

    // Syntax errors should be recorded
    expect(errorManager.getErrorsByPhase('SYNTAX').length).toBeGreaterThan(0);
    // Parser synchronizes and parses the next statement (y = 50)
    const yDecl = ast.body.find((n: any) => n.name === 'y') as any;
    expect(yDecl).toBeDefined();
    expect(yDecl.initializer.value).toBe(50);
  });
});
