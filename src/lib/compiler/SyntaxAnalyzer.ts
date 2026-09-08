// Syntax Analyzer (Recursive Descent Parser for C-like language)
import {
  Token,
  ASTNode,
  ProgramNode,
  VarDeclNode,
  FunctionDeclNode,
  BlockNode,
  IfNode,
  WhileNode,
  ForNode,
  ReturnNode,
  ExpressionStatementNode,
  AssignmentNode,
  BinaryOpNode,
  UnaryOpNode,
  LiteralNode,
  IdentifierNode,
  CallNode,
  DataType,
} from './types';
import { ErrorManager } from './ErrorManager';

const TYPE_KEYWORDS = new Set(['int', 'float', 'string', 'bool', 'void']);

export class SyntaxAnalyzer {
  private tokens: Token[] = [];
  private current: number = 0;
  private errorManager: ErrorManager;
  private nodeIdCounter: number = 1;

  constructor(errorManager?: ErrorManager) {
    this.errorManager = errorManager || new ErrorManager();
  }

  public parse(tokens: Token[]): ProgramNode {
    // Filter out comment tokens
    this.tokens = tokens.filter((t) => t.type !== 'COMMENT');
    this.current = 0;
    this.nodeIdCounter = 1;

    const body: ASTNode[] = [];
    const programId = `ast-node-${this.nodeIdCounter++}`;

    while (!this.isAtEnd()) {
      try {
        const decl = this.parseDeclaration();
        if (decl) {
          body.push(decl);
        }
      } catch (err: any) {
        this.synchronize();
      }
    }

    return {
      id: programId,
      type: 'Program',
      line: 1,
      column: 1,
      body,
    };
  }

  // ---------------- Parsing Top-Level Declarations ----------------

  private parseDeclaration(): ASTNode | null {
    const token = this.peek();

    // Check for variable or function declaration starting with a type keyword
    if (token.type === 'KEYWORD' && TYPE_KEYWORDS.has(token.value)) {
      const typeToken = this.advance();
      const dataType = typeToken.value as DataType;

      if (!this.check('IDENTIFIER')) {
        this.errorManager.addError(
          'SYNTAX',
          `Expected identifier after type '${dataType}', found '${this.peek().value}'`,
          this.peek().line,
          this.peek().column,
          `Specify a valid variable or function name.`
        );
        this.synchronize();
        return null;
      }

      const nameToken = this.advance();

      // If next is '(', it's a function declaration!
      if (this.match('DELIMITER', '(')) {
        return this.finishFunctionDeclaration(dataType, nameToken);
      }

      // Otherwise, it's a variable declaration
      return this.finishVariableDeclaration(dataType, nameToken);
    }

    // Otherwise, parse as a regular statement
    return this.parseStatement();
  }

  private finishFunctionDeclaration(returnType: DataType, nameToken: Token): FunctionDeclNode {
    const params: { name: string; type: DataType; line: number; column: number }[] = [];

    if (!this.check('DELIMITER', ')')) {
      do {
        if (!this.checkTypeKeyword()) {
          this.errorManager.addError(
            'SYNTAX',
            `Expected parameter type in function '${nameToken.value}', found '${this.peek().value}'`,
            this.peek().line,
            this.peek().column,
            `Use a valid type: int, float, string, bool`
          );
          break;
        }
        const pType = this.advance().value as DataType;
        if (!this.check('IDENTIFIER')) {
          this.errorManager.addError(
            'SYNTAX',
            `Expected parameter name after type '${pType}'`,
            this.peek().line,
            this.peek().column,
            `Provide a parameter identifier.`
          );
          break;
        }
        const pName = this.advance();
        params.push({
          name: pName.value,
          type: pType,
          line: pName.line,
          column: pName.column,
        });
      } while (this.match('DELIMITER', ','));
    }

    this.consume('DELIMITER', ')', "Expected ')' after parameters.");

    if (!this.check('DELIMITER', '{')) {
      this.errorManager.addError(
        'SYNTAX',
        `Expected '{' to start function body for '${nameToken.value}'`,
        this.peek().line,
        this.peek().column,
        `Provide a function body block enclosed in { ... }`
      );
      throw new Error('Parse error');
    }

    const body = this.parseBlockStatement();

    return {
      id: `func-${this.nodeIdCounter++}`,
      type: 'FunctionDeclaration',
      name: nameToken.value,
      returnType,
      params,
      body,
      line: nameToken.line,
      column: nameToken.column,
    };
  }

  private finishVariableDeclaration(varType: DataType, nameToken: Token): VarDeclNode {
    let initializer: ASTNode | null = null;

    if (this.match('OPERATOR', '=')) {
      initializer = this.parseExpression();
    }

    this.consume('DELIMITER', ';', "Expected ';' after variable declaration.");

    return {
      id: `var-${this.nodeIdCounter++}`,
      type: 'VariableDeclaration',
      varType,
      name: nameToken.value,
      initializer,
      line: nameToken.line,
      column: nameToken.column,
    };
  }

  // ---------------- Parsing Statements ----------------

  private parseStatement(): ASTNode | null {
    if (this.match('KEYWORD', 'if')) {
      return this.parseIfStatement();
    }
    if (this.match('KEYWORD', 'while')) {
      return this.parseWhileStatement();
    }
    if (this.match('KEYWORD', 'for')) {
      return this.parseForStatement();
    }
    if (this.match('KEYWORD', 'return')) {
      return this.parseReturnStatement();
    }
    if (this.check('DELIMITER', '{')) {
      return this.parseBlockStatement();
    }

    return this.parseExpressionStatement();
  }

  private parseIfStatement(): IfNode {
    const ifToken = this.previous();
    this.consume('DELIMITER', '(', "Expected '(' after 'if'.");
    const condition = this.parseExpression();
    this.consume('DELIMITER', ')', "Expected ')' after if condition.");

    const consequent = this.parseStatement() || this.createEmptyBlock();
    let alternate: ASTNode | null = null;

    if (this.match('KEYWORD', 'else')) {
      alternate = this.parseStatement() || this.createEmptyBlock();
    }

    return {
      id: `if-${this.nodeIdCounter++}`,
      type: 'IfStatement',
      condition,
      consequent,
      alternate,
      line: ifToken.line,
      column: ifToken.column,
    };
  }

  private parseWhileStatement(): WhileNode {
    const whileToken = this.previous();
    this.consume('DELIMITER', '(', "Expected '(' after 'while'.");
    const condition = this.parseExpression();
    this.consume('DELIMITER', ')', "Expected ')' after while condition.");

    const body = this.parseStatement() || this.createEmptyBlock();

    return {
      id: `while-${this.nodeIdCounter++}`,
      type: 'WhileStatement',
      condition,
      body,
      line: whileToken.line,
      column: whileToken.column,
    };
  }

  private parseForStatement(): ForNode {
    const forToken = this.previous();
    this.consume('DELIMITER', '(', "Expected '(' after 'for'.");

    let init: ASTNode | null = null;
    if (this.match('DELIMITER', ';')) {
      init = null;
    } else if (this.checkTypeKeyword()) {
      const typeToken = this.advance();
      const nameToken = this.consume('IDENTIFIER', undefined, "Expected variable name in for loop init.");
      init = this.finishVariableDeclaration(typeToken.value as DataType, nameToken);
    } else {
      init = this.parseExpressionStatement();
    }

    let condition: ASTNode | null = null;
    if (!this.check('DELIMITER', ';')) {
      condition = this.parseExpression();
    }
    this.consume('DELIMITER', ';', "Expected ';' after for loop condition.");

    let update: ASTNode | null = null;
    if (!this.check('DELIMITER', ')')) {
      update = this.parseExpression();
    }
    this.consume('DELIMITER', ')', "Expected ')' after for loop clauses.");

    const body = this.parseStatement() || this.createEmptyBlock();

    return {
      id: `for-${this.nodeIdCounter++}`,
      type: 'ForStatement',
      init,
      condition,
      update,
      body,
      line: forToken.line,
      column: forToken.column,
    };
  }

  private parseReturnStatement(): ReturnNode {
    const returnToken = this.previous();
    let argument: ASTNode | null = null;

    if (!this.check('DELIMITER', ';')) {
      argument = this.parseExpression();
    }

    this.consume('DELIMITER', ';', "Expected ';' after return value.");

    return {
      id: `ret-${this.nodeIdCounter++}`,
      type: 'ReturnStatement',
      argument,
      line: returnToken.line,
      column: returnToken.column,
    };
  }

  public parseBlockStatement(): BlockNode {
    const braceToken = this.consume('DELIMITER', '{', "Expected '{' to start block.");
    const statements: ASTNode[] = [];

    while (!this.check('DELIMITER', '}') && !this.isAtEnd()) {
      try {
        const stmt = this.parseDeclaration();
        if (stmt) {
          statements.push(stmt);
        }
      } catch (e) {
        this.synchronize();
      }
    }

    this.consume('DELIMITER', '}', "Expected '}' after block.");

    return {
      id: `block-${this.nodeIdCounter++}`,
      type: 'BlockStatement',
      statements,
      line: braceToken.line,
      column: braceToken.column,
    };
  }

  private parseExpressionStatement(): ASTNode {
    const expr = this.parseExpression();
    this.consume('DELIMITER', ';', "Expected ';' after expression.");

    return {
      id: `exprstmt-${this.nodeIdCounter++}`,
      type: 'ExpressionStatement',
      expression: expr,
      line: expr.line,
      column: expr.column,
    };
  }

  // ---------------- Parsing Expressions (Precedence Climbing) ----------------

  public parseExpression(): ASTNode {
    return this.parseAssignment();
  }

  private parseAssignment(): ASTNode {
    const expr = this.parseLogicalOr();

    if (this.match('OPERATOR', '=')) {
      const equals = this.previous();
      const value = this.parseAssignment();

      if (expr.type === 'Identifier') {
        return {
          id: `assign-${this.nodeIdCounter++}`,
          type: 'AssignmentExpression',
          operator: '=',
          left: expr as IdentifierNode,
          right: value,
          line: equals.line,
          column: equals.column,
        };
      }

      this.errorManager.addError(
        'SYNTAX',
        `Invalid assignment target. Left-hand side must be a variable.`,
        equals.line,
        equals.column,
        `Assign to a valid variable name.`
      );
    }

    return expr;
  }

  private parseLogicalOr(): ASTNode {
    let expr = this.parseLogicalAnd();

    while (this.match('OPERATOR', '||')) {
      const op = this.previous();
      const right = this.parseLogicalAnd();
      expr = {
        id: `bin-${this.nodeIdCounter++}`,
        type: 'BinaryExpression',
        operator: op.value,
        left: expr,
        right,
        line: op.line,
        column: op.column,
      };
    }

    return expr;
  }

  private parseLogicalAnd(): ASTNode {
    let expr = this.parseEquality();

    while (this.match('OPERATOR', '&&')) {
      const op = this.previous();
      const right = this.parseEquality();
      expr = {
        id: `bin-${this.nodeIdCounter++}`,
        type: 'BinaryExpression',
        operator: op.value,
        left: expr,
        right,
        line: op.line,
        column: op.column,
      };
    }

    return expr;
  }

  private parseEquality(): ASTNode {
    let expr = this.parseComparison();

    while (this.matchOneOfOperators(['==', '!='])) {
      const op = this.previous();
      const right = this.parseComparison();
      expr = {
        id: `bin-${this.nodeIdCounter++}`,
        type: 'BinaryExpression',
        operator: op.value,
        left: expr,
        right,
        line: op.line,
        column: op.column,
      };
    }

    return expr;
  }

  private parseComparison(): ASTNode {
    let expr = this.parseTerm();

    while (this.matchOneOfOperators(['<', '<=', '>', '>='])) {
      const op = this.previous();
      const right = this.parseTerm();
      expr = {
        id: `bin-${this.nodeIdCounter++}`,
        type: 'BinaryExpression',
        operator: op.value,
        left: expr,
        right,
        line: op.line,
        column: op.column,
      };
    }

    return expr;
  }

  private parseTerm(): ASTNode {
    let expr = this.parseFactor();

    while (this.matchOneOfOperators(['+', '-'])) {
      const op = this.previous();
      const right = this.parseFactor();
      expr = {
        id: `bin-${this.nodeIdCounter++}`,
        type: 'BinaryExpression',
        operator: op.value,
        left: expr,
        right,
        line: op.line,
        column: op.column,
      };
    }

    return expr;
  }

  private parseFactor(): ASTNode {
    let expr = this.parseUnary();

    while (this.matchOneOfOperators(['*', '/', '%'])) {
      const op = this.previous();
      const right = this.parseUnary();
      expr = {
        id: `bin-${this.nodeIdCounter++}`,
        type: 'BinaryExpression',
        operator: op.value,
        left: expr,
        right,
        line: op.line,
        column: op.column,
      };
    }

    return expr;
  }

  private parseUnary(): ASTNode {
    if (this.matchOneOfOperators(['!', '-'])) {
      const op = this.previous();
      const argument = this.parseUnary();
      return {
        id: `unary-${this.nodeIdCounter++}`,
        type: 'UnaryExpression',
        operator: op.value,
        argument,
        prefix: true,
        line: op.line,
        column: op.column,
      };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    // Boolean Literals
    if (this.match('BOOLEAN_LITERAL')) {
      const token = this.previous();
      return {
        id: `lit-${this.nodeIdCounter++}`,
        type: 'Literal',
        value: token.value === 'true',
        raw: token.value,
        literalType: 'bool',
        line: token.line,
        column: token.column,
      };
    }

    // Number Literals
    if (this.match('NUMBER_LITERAL')) {
      const token = this.previous();
      const isFloat = token.value.includes('.');
      return {
        id: `lit-${this.nodeIdCounter++}`,
        type: 'Literal',
        value: isFloat ? parseFloat(token.value) : parseInt(token.value, 10),
        raw: token.value,
        literalType: isFloat ? 'float' : 'int',
        line: token.line,
        column: token.column,
      };
    }

    // String Literals
    if (this.match('STRING_LITERAL')) {
      const token = this.previous();
      return {
        id: `lit-${this.nodeIdCounter++}`,
        type: 'Literal',
        value: token.value,
        raw: `"${token.value}"`,
        literalType: 'string',
        line: token.line,
        column: token.column,
      };
    }

    // Identifier or Function Call
    if (this.match('IDENTIFIER')) {
      const token = this.previous();
      if (this.match('DELIMITER', '(')) {
        // Function call
        const args: ASTNode[] = [];
        if (!this.check('DELIMITER', ')')) {
          do {
            args.push(this.parseExpression());
          } while (this.match('DELIMITER', ','));
        }
        this.consume('DELIMITER', ')', "Expected ')' after function arguments.");

        return {
          id: `call-${this.nodeIdCounter++}`,
          type: 'CallExpression',
          callee: token.value,
          args,
          line: token.line,
          column: token.column,
        };
      }

      return {
        id: `id-${this.nodeIdCounter++}`,
        type: 'Identifier',
        name: token.value,
        line: token.line,
        column: token.column,
      };
    }

    // Grouping / Parentheses
    if (this.match('DELIMITER', '(')) {
      const openParen = this.previous();
      const expr = this.parseExpression();
      this.consume('DELIMITER', ')', "Expected ')' after expression.");
      return expr;
    }

    // Error recovery for unrecognized tokens in expressions
    const badToken = this.peek();
    this.errorManager.addError(
      'SYNTAX',
      `Unexpected token '${badToken.value}' in expression`,
      badToken.line,
      badToken.column,
      `Check for missing operands, unmatched parentheses, or typos.`
    );

    if (badToken.value === ';' || badToken.value === '}' || badToken.type === 'EOF') {
      throw new Error(`Unexpected '${badToken.value}' in expression`);
    }

    this.advance();

    return {
      id: `err-node-${this.nodeIdCounter++}`,
      type: 'Literal',
      value: 0,
      raw: '0',
      literalType: 'unknown',
      line: badToken.line,
      column: badToken.column,
    };
  }

  // ---------------- Parser Helpers & Error Recovery ----------------

  private match(type: string, value?: string): boolean {
    if (this.check(type, value)) {
      this.advance();
      return true;
    }
    return false;
  }

  private matchOneOfOperators(ops: string[]): boolean {
    for (const op of ops) {
      if (this.check('OPERATOR', op)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: string, value?: string): boolean {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    if (token.type !== type) return false;
    if (value !== undefined && token.value !== value) return false;
    return true;
  }

  private checkTypeKeyword(): boolean {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    return token.type === 'KEYWORD' && TYPE_KEYWORDS.has(token.value);
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF' || this.current >= this.tokens.length;
  }

  private peek(): Token {
    if (this.current >= this.tokens.length) {
      return { id: 'eof', type: 'EOF', value: '<EOF>', line: 1, column: 1 };
    }
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: string, value?: string, errorMessage: string = 'Syntax error'): Token {
    if (this.check(type, value)) {
      return this.advance();
    }

    const token = this.peek();
    this.errorManager.addError('SYNTAX', errorMessage, token.line, token.column);
    throw new Error(errorMessage);
  }

  private synchronize(): void {
    while (!this.isAtEnd()) {
      if (this.previous() && this.previous().value === ';') return;

      const val = this.peek().value;
      if (
        ['int', 'float', 'string', 'bool', 'void', 'if', 'while', 'for', 'return'].includes(val) ||
        val === '}'
      ) {
        return;
      }

      this.advance();
    }
  }

  private createEmptyBlock(): BlockNode {
    return {
      id: `block-${this.nodeIdCounter++}`,
      type: 'BlockStatement',
      statements: [],
      line: this.previous().line,
      column: this.previous().column,
    };
  }
}
