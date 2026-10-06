// Semantic Analyzer (Scope Resolution & Type Checking)
import {
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
import { SymbolTable } from './SymbolTable';
import { ErrorManager } from './ErrorManager';

export class SemanticAnalyzer {
  private symbolTable: SymbolTable;
  private errorManager: ErrorManager;
  private currentFunction: { name: string; returnType: DataType } | null = null;

  constructor(symbolTable?: SymbolTable, errorManager?: ErrorManager) {
    this.symbolTable = symbolTable || new SymbolTable();
    this.errorManager = errorManager || new ErrorManager();
  }

  public analyze(ast: ProgramNode): {
    annotatedAst: ProgramNode;
    symbolTable: SymbolTable;
    errors: ErrorManager;
  } {
    this.symbolTable.reset();
    this.currentFunction = null;

    for (let i = 0; i < ast.body.length; i++) {
      const statement = ast.body[i];
      this.analyzeNode(statement);
    }

    return {
      annotatedAst: ast,
      symbolTable: this.symbolTable,
      errors: this.errorManager,
    };
  }

  private analyzeNode(node: ASTNode): DataType {
    if (!node) return 'unknown';

    switch (node.type) {
      case 'VariableDeclaration':
        return this.analyzeVarDecl(node as VarDeclNode);

      case 'FunctionDeclaration':
        return this.analyzeFunctionDecl(node as FunctionDeclNode);

      case 'BlockStatement':
        return this.analyzeBlock(node as BlockNode);

      case 'IfStatement':
        return this.analyzeIf(node as IfNode);

      case 'WhileStatement':
        return this.analyzeWhile(node as WhileNode);

      case 'ForStatement':
        return this.analyzeFor(node as ForNode);

      case 'ReturnStatement':
        return this.analyzeReturn(node as ReturnNode);

      case 'ExpressionStatement':
        return this.analyzeExpressionStmt(node as ExpressionStatementNode);

      case 'AssignmentExpression':
        return this.analyzeAssignment(node as AssignmentNode);

      case 'BinaryExpression':
        return this.analyzeBinary(node as BinaryOpNode);

      case 'UnaryExpression':
        return this.analyzeUnary(node as UnaryOpNode);

      case 'CallExpression':
        return this.analyzeCall(node as CallNode);

      case 'Identifier':
        return this.analyzeIdentifier(node as IdentifierNode);

      case 'Literal':
        return this.analyzeLiteral(node as LiteralNode);

      default:
        return 'unknown';
    }
  }

  private analyzeVarDecl(node: VarDeclNode): DataType {
    // 1. Check for redeclaration in current scope
    const existing = this.symbolTable.lookupCurrentScope(node.name);
    if (existing) {
      this.errorManager.addError(
        'SEMANTIC',
        `Variable '${node.name}' has already been declared in the current scope ('${existing.scope}') at line ${existing.line}`,
        node.line,
        node.column,
        `Choose a unique variable name or remove duplicate declaration.`
      );
    }

    // 2. Validate initializer type if present
    if (node.initializer) {
      const initType = this.analyzeNode(node.initializer);
      node.initializer.inferredType = initType;

      if (!this.areTypesCompatible(node.varType, initType)) {
        this.errorManager.addError(
          'SEMANTIC',
          `Type mismatch in declaration of '${node.name}': cannot assign '${initType}' to '${node.varType}'`,
          node.line,
          node.column,
          `Convert expression to '${node.varType}' or change declared type.`
        );
      }
    }

    // 3. Register in Symbol Table
    this.symbolTable.insert({
      name: node.name,
      type: node.varType,
      kind: 'variable',
      line: node.line,
      column: node.column,
    });

    node.inferredType = node.varType;
    return node.varType;
  }

  private analyzeFunctionDecl(node: FunctionDeclNode): DataType {
    // 1. Check for function redeclaration
    const existing = this.symbolTable.lookupCurrentScope(node.name);
    if (existing) {
      this.errorManager.addError(
        'SEMANTIC',
        `Function '${node.name}' has already been declared in scope '${existing.scope}'`,
        node.line,
        node.column,
        `Rename function or resolve duplicate definition.`
      );
    } else {
      this.symbolTable.insert({
        name: node.name,
        type: node.returnType,
        kind: 'function',
        params: node.params.map((p) => ({ name: p.name, type: p.type })),
        returnType: node.returnType,
        line: node.line,
        column: node.column,
      });
    }

    // 2. Enter function scope
    this.symbolTable.enterScope(`func_${node.name}`);
    const prevFunction = this.currentFunction;
    this.currentFunction = { name: node.name, returnType: node.returnType };

    // 3. Register parameters in function scope
    for (const param of node.params) {
      const existingParam = this.symbolTable.lookupCurrentScope(param.name);
      if (existingParam) {
        this.errorManager.addError(
          'SEMANTIC',
          `Duplicate parameter name '${param.name}' in function '${node.name}'`,
          param.line,
          param.column
        );
      } else {
        this.symbolTable.insert({
          name: param.name,
          type: param.type,
          kind: 'parameter',
          line: param.line,
          column: param.column,
        });
      }
    }

    // 4. Analyze function body statements directly
    for (const stmt of node.body.statements) {
      this.analyzeNode(stmt);
    }

    // 5. Exit function scope
    this.symbolTable.exitScope();
    this.currentFunction = prevFunction;

    node.inferredType = node.returnType;
    return node.returnType;
  }

  private analyzeBlock(node: BlockNode): DataType {
    this.symbolTable.enterScope();
    for (const stmt of node.statements) {
      this.analyzeNode(stmt);
    }
    this.symbolTable.exitScope();
    return 'void';
  }

  private analyzeIf(node: IfNode): DataType {
    const condType = this.analyzeNode(node.condition);
    if (condType !== 'bool' && condType !== 'unknown') {
      this.errorManager.addError(
        'SEMANTIC',
        `'if' condition must evaluate to 'bool', found '${condType}'`,
        node.condition.line,
        node.condition.column,
        `Ensure condition is a boolean expression (e.g. using ==, <, >, &&, ||)`
      );
    }

    this.analyzeNode(node.consequent);
    if (node.alternate) {
      this.analyzeNode(node.alternate);
    }
    return 'void';
  }

  private analyzeWhile(node: WhileNode): DataType {
    const condType = this.analyzeNode(node.condition);
    if (condType !== 'bool' && condType !== 'unknown') {
      this.errorManager.addError(
        'SEMANTIC',
        `'while' condition must evaluate to 'bool', found '${condType}'`,
        node.condition.line,
        node.condition.column,
        `Ensure condition is a boolean expression`
      );
    }

    this.analyzeNode(node.body);
    return 'void';
  }

  private analyzeFor(node: ForNode): DataType {
    this.symbolTable.enterScope();

    if (node.init) {
      this.analyzeNode(node.init);
    }
    if (node.condition) {
      const condType = this.analyzeNode(node.condition);
      if (condType !== 'bool' && condType !== 'unknown') {
        this.errorManager.addError(
          'SEMANTIC',
          `'for' loop condition must evaluate to 'bool', found '${condType}'`,
          node.condition.line,
          node.condition.column
        );
      }
    }
    if (node.update) {
      this.analyzeNode(node.update);
    }

    this.analyzeNode(node.body);
    this.symbolTable.exitScope();
    return 'void';
  }

  private analyzeReturn(node: ReturnNode): DataType {
    const argType: DataType = node.argument ? this.analyzeNode(node.argument) : 'void';
    node.inferredType = argType;

    if (!this.currentFunction) {
      this.errorManager.addError(
        'SEMANTIC',
        `'return' statement used outside of any function definition`,
        node.line,
        node.column,
        `Wrap the return statement inside a function.`
      );
      return argType;
    }

    const expected = this.currentFunction.returnType;
    if (!this.areTypesCompatible(expected, argType)) {
      this.errorManager.addError(
        'SEMANTIC',
        `Return type mismatch in function '${this.currentFunction.name}': expected '${expected}', got '${argType}'`,
        node.line,
        node.column,
        `Return a value matching the function signature '${expected}'.`
      );
    }

    return argType;
  }

  private analyzeExpressionStmt(node: ExpressionStatementNode): DataType {
    const exprType = this.analyzeNode(node.expression);
    node.inferredType = exprType;
    return exprType;
  }

  private analyzeAssignment(node: AssignmentNode): DataType {
    const targetSymbol = this.symbolTable.lookup(node.left.name);
    if (!targetSymbol) {
      this.errorManager.addError(
        'SEMANTIC',
        `Undefined variable '${node.left.name}' in assignment`,
        node.left.line,
        node.left.column,
        `Declare '${node.left.name}' with a type before assignment.`
      );
      node.inferredType = 'unknown';
      return 'unknown';
    }

    const rightType = this.analyzeNode(node.right);
    node.right.inferredType = rightType;

    if (!this.areTypesCompatible(targetSymbol.type as DataType, rightType)) {
      this.errorManager.addError(
        'SEMANTIC',
        `Cannot assign value of type '${rightType}' to variable '${node.left.name}' of type '${targetSymbol.type}'`,
        node.line,
        node.column,
        `Ensure assigned value matches variable type '${targetSymbol.type}'.`
      );
    }

    node.inferredType = targetSymbol.type as DataType;
    return node.inferredType;
  }

  private analyzeBinary(node: BinaryOpNode): DataType {
    const leftType = this.analyzeNode(node.left);
    const rightType = this.analyzeNode(node.right);
    node.left.inferredType = leftType;
    node.right.inferredType = rightType;

    const op = node.operator;

    // 1. Arithmetic Operators (+, -, *, /, %)
    if (['+', '-', '*', '/', '%'].includes(op)) {
      // String concatenation support for '+'
      if (op === '+' && (leftType === 'string' || rightType === 'string')) {
        node.inferredType = 'string';
        return 'string';
      }

      if ((leftType === 'int' || leftType === 'float') && (rightType === 'int' || rightType === 'float')) {
        const resultType = leftType === 'float' || rightType === 'float' ? 'float' : 'int';
        node.inferredType = resultType;
        return resultType;
      }

      if (leftType !== 'unknown' && rightType !== 'unknown') {
        this.errorManager.addError(
          'SEMANTIC',
          `Operator '${op}' cannot be applied to operands of type '${leftType}' and '${rightType}'`,
          node.line,
          node.column,
          `Operands must be numeric ('int' or 'float').`
        );
      }
      node.inferredType = 'unknown';
      return 'unknown';
    }

    // 2. Relational Operators (<, <=, >, >=)
    if (['<', '<=', '>', '>='].includes(op)) {
      if ((leftType === 'int' || leftType === 'float') && (rightType === 'int' || rightType === 'float')) {
        node.inferredType = 'bool';
        return 'bool';
      }

      if (leftType !== 'unknown' && rightType !== 'unknown') {
        this.errorManager.addError(
          'SEMANTIC',
          `Relational operator '${op}' requires numeric operands, found '${leftType}' and '${rightType}'`,
          node.line,
          node.column
        );
      }
      node.inferredType = 'bool';
      return 'bool';
    }

    // 3. Equality Operators (==, !=)
    if (['==', '!='].includes(op)) {
      if (!this.areTypesComparable(leftType, rightType) && leftType !== 'unknown' && rightType !== 'unknown') {
        this.errorManager.addWarning(
          'SEMANTIC',
          `Comparison '${op}' between incompatible types '${leftType}' and '${rightType}' will always evaluate predictably`,
          node.line,
          node.column
        );
      }
      node.inferredType = 'bool';
      return 'bool';
    }

    // 4. Logical Operators (&&, ||)
    if (['&&', '||'].includes(op)) {
      if (leftType !== 'bool' && leftType !== 'unknown') {
        this.errorManager.addError(
          'SEMANTIC',
          `Left operand of '${op}' must be 'bool', found '${leftType}'`,
          node.left.line,
          node.left.column
        );
      }
      if (rightType !== 'bool' && rightType !== 'unknown') {
        this.errorManager.addError(
          'SEMANTIC',
          `Right operand of '${op}' must be 'bool', found '${rightType}'`,
          node.right.line,
          node.right.column
        );
      }
      node.inferredType = 'bool';
      return 'bool';
    }

    node.inferredType = 'unknown';
    return 'unknown';
  }

  private analyzeUnary(node: UnaryOpNode): DataType {
    const argType = this.analyzeNode(node.argument);
    node.argument.inferredType = argType;

    if (node.operator === '!') {
      if (argType !== 'bool' && argType !== 'unknown') {
        this.errorManager.addError(
          'SEMANTIC',
          `Logical NOT operator '!' requires boolean operand, found '${argType}'`,
          node.line,
          node.column
        );
      }
      node.inferredType = 'bool';
      return 'bool';
    }

    if (node.operator === '-') {
      if (argType !== 'int' && argType !== 'float' && argType !== 'unknown') {
        this.errorManager.addError(
          'SEMANTIC',
          `Unary minus '-' requires numeric operand, found '${argType}'`,
          node.line,
          node.column
        );
      }
      node.inferredType = argType;
      return argType;
    }

    node.inferredType = 'unknown';
    return 'unknown';
  }

  private analyzeCall(node: CallNode): DataType {
    const symbol = this.symbolTable.lookup(node.callee);

    if (!symbol) {
      this.errorManager.addError(
        'SEMANTIC',
        `Call to undeclared function '${node.callee}'`,
        node.line,
        node.column,
        `Define '${node.callee}' before calling it.`
      );
      node.inferredType = 'unknown';
      return 'unknown';
    }

    if (symbol.kind !== 'function') {
      this.errorManager.addError(
        'SEMANTIC',
        `'${node.callee}' is a ${symbol.kind}, not a function`,
        node.line,
        node.column
      );
      node.inferredType = 'unknown';
      return 'unknown';
    }

    const expectedParams = symbol.params || [];
    const isVariadic = node.callee === 'printf' || node.callee === 'scanf';

    if (!isVariadic && node.args.length !== expectedParams.length) {
      this.errorManager.addError(
        'SEMANTIC',
        `Function '${node.callee}' expects ${expectedParams.length} arguments, got ${node.args.length}`,
        node.line,
        node.column,
        `Provide exactly ${expectedParams.length} arguments.`
      );
    }

    // Analyze all arguments passed
    for (let i = 0; i < node.args.length; i++) {
      const argExpr = node.args[i];
      const argType = this.analyzeNode(argExpr);
      argExpr.inferredType = argType;

      if (!isVariadic && i < expectedParams.length) {
        const expectedType = expectedParams[i].type;
        if (!this.areTypesCompatible(expectedType, argType)) {
          this.errorManager.addError(
            'SEMANTIC',
            `Argument ${i + 1} of '${node.callee}' expects type '${expectedType}', got '${argType}'`,
            argExpr.line,
            argExpr.column,
            `Match the parameter type '${expectedType}'.`
          );
        }
      }
    }

    node.inferredType = symbol.returnType || 'unknown';
    return node.inferredType;
  }

  private analyzeIdentifier(node: IdentifierNode): DataType {
    const symbol = this.symbolTable.lookup(node.name);
    if (!symbol) {
      this.errorManager.addError(
        'SEMANTIC',
        `Undeclared identifier '${node.name}'`,
        node.line,
        node.column,
        `Declare '${node.name}' before use.`
      );
      node.inferredType = 'unknown';
      return 'unknown';
    }

    const resolvedType = (symbol.type as DataType) || 'unknown';
    node.inferredType = resolvedType;
    return resolvedType;
  }

  private analyzeLiteral(node: LiteralNode): DataType {
    node.inferredType = node.literalType;
    return node.literalType;
  }

  // Type Compatibility Rules
  private areTypesCompatible(target: DataType, source: DataType): boolean {
    if (target === source) return true;
    if (target === 'unknown' || source === 'unknown') return true;
    if (target === 'float' && source === 'int') return true;
    return false;
  }

  private areTypesComparable(t1: DataType, t2: DataType): boolean {
    if (t1 === t2) return true;
    if (t1 === 'unknown' || t2 === 'unknown') return true;
    if ((t1 === 'int' || t1 === 'float') && (t2 === 'int' || t2 === 'float')) return true;
    return false;
  }
}
