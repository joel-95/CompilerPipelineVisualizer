import { describe, it, expect } from 'vitest';
import { LexicalAnalyzer } from '../lib/compiler/LexicalAnalyzer';
import { ErrorManager } from '../lib/compiler/ErrorManager';

describe('LexicalAnalyzer (Ebin - Backend Lead)', () => {
  it('1. Tokenizes basic keywords, identifiers, and numbers', () => {
    const errorManager = new ErrorManager();
    const lexer = new LexicalAnalyzer(errorManager);
    const code = 'int count = 42;';
    const tokens = lexer.tokenize(code);

    expect(tokens.filter((t) => t.type !== 'EOF').length).toBe(5); // int, count, =, 42, ;
    expect(tokens.length).toBe(6); // 5 tokens + EOF
    expect(tokens[0]).toMatchObject({ type: 'KEYWORD', value: 'int', line: 1, column: 1 });
    expect(tokens[1]).toMatchObject({ type: 'IDENTIFIER', value: 'count', line: 1, column: 5 });
    expect(tokens[2]).toMatchObject({ type: 'OPERATOR', value: '=', line: 1, column: 11 });
    expect(tokens[3]).toMatchObject({ type: 'NUMBER_LITERAL', value: '42', line: 1, column: 13 });
    expect(tokens[4]).toMatchObject({ type: 'DELIMITER', value: ';', line: 1, column: 15 });
  });

  it('2. Handles float numbers and string literals', () => {
    const lexer = new LexicalAnalyzer();
    const code = 'float pi = 3.14;\nstring name = "Antigravity";';
    const tokens = lexer.tokenize(code);

    const piToken = tokens.find((t) => t.value === '3.14');
    const strToken = tokens.find((t) => t.value === 'Antigravity');

    expect(piToken).toBeDefined();
    expect(piToken?.type).toBe('NUMBER_LITERAL');
    expect(strToken).toBeDefined();
    expect(strToken?.type).toBe('STRING_LITERAL');
  });

  it('3. Recognizes boolean literals', () => {
    const lexer = new LexicalAnalyzer();
    const code = 'bool flag = true; bool disabled = false;';
    const tokens = lexer.tokenize(code);

    const boolTokens = tokens.filter((t) => t.type === 'BOOLEAN_LITERAL');
    expect(boolTokens.length).toBe(2);
    expect(boolTokens[0].value).toBe('true');
    expect(boolTokens[1].value).toBe('false');
  });

  it('4. Ignores single-line comments', () => {
    const lexer = new LexicalAnalyzer();
    const code = '// This is a comment\nint x = 10;';
    const tokens = lexer.tokenize(code);

    const types = tokens.map((t) => t.type);
    expect(types).not.toContain('COMMENT');
    expect(tokens[0].value).toBe('int');
    expect(tokens[0].line).toBe(2);
  });

  it('5. Ignores multi-line block comments', () => {
    const lexer = new LexicalAnalyzer();
    const code = '/* Start comment\n Multi-line\n End comment */ int y = 20;';
    const tokens = lexer.tokenize(code);

    expect(tokens[0].value).toBe('int');
    expect(tokens[0].line).toBe(3);
  });

  it('6. Accurately tracks line and column coordinates', () => {
    const lexer = new LexicalAnalyzer();
    const code = 'int a = 1;\nint b = 2;';
    const tokens = lexer.tokenize(code);

    const bToken = tokens.find((t) => t.value === 'b');
    expect(bToken?.line).toBe(2);
    expect(bToken?.column).toBe(5);
  });

  it('7. Handles two-character operators correctly', () => {
    const lexer = new LexicalAnalyzer();
    const code = 'a == b && c != d || e <= f >= g';
    const tokens = lexer.tokenize(code);

    const opValues = tokens.filter((t) => t.type === 'OPERATOR').map((t) => t.value);
    expect(opValues).toContain('==');
    expect(opValues).toContain('&&');
    expect(opValues).toContain('!=');
    expect(opValues).toContain('||');
    expect(opValues).toContain('<=');
    expect(opValues).toContain('>=');
  });

  it('8. Detects illegal characters and registers lexical errors without crash', () => {
    const errorManager = new ErrorManager();
    const lexer = new LexicalAnalyzer(errorManager);
    const code = 'int @bad = 5;';
    const tokens = lexer.tokenize(code);

    expect(tokens.some((t) => t.type === 'ERROR')).toBe(true);
    expect(errorManager.getErrorsByPhase('LEXICAL').length).toBeGreaterThan(0);
  });
});
