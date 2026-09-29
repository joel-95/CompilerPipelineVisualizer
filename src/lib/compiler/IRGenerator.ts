// Three-Address Code (TAC) Generator
// Walks the annotated AST and emits IR instructions.
import {
  ASTNode,
  ProgramNode,
  TACInstruction,
  TACKind,
} from './types';

let _globalTacId = 0;
function tacId(): string {
  return `tac-${++_globalTacId}`;
}

export class IRGenerator {
  private instructions: TACInstruction[] = [];
  private tempCount = 0;
  private labelCount = 0;

  private newTemp(): string {
    return `t${this.tempCount++}`;
  }

  private newLabel(prefix = 'L'): string {
    return `${prefix}${this.labelCount++}`;
  }

  private emit(kind: TACKind, fields: Omit<TACInstruction, 'id' | 'kind'>): string {
    const instr: TACInstruction = { id: tacId(), kind, ...fields };
    this.instructions.push(instr);
    return fields.result ?? '';
  }

  public generate(ast: ProgramNode): TACInstruction[] {
    _globalTacId = 0;
    this.instructions = [];
    this.tempCount = 0;
    this.labelCount = 0;

    for (const node of ast.body) {
      this.genNode(node);
    }

    return this.instructions;
  }

  private genNode(node: ASTNode): string | null {
    switch (node.type) {
      case 'VariableDeclaration':   return this.genVarDecl(node);
      case 'FunctionDeclaration':   return this.genFuncDecl(node);
      case 'BlockStatement':        return this.genBlock(node);
      case 'ExpressionStatement':   return this.genExprStmt(node);
      case 'IfStatement':           return this.genIf(node);
      case 'WhileStatement':        return this.genWhile(node);
      case 'ForStatement':          return this.genFor(node);
      case 'ReturnStatement':       return this.genReturn(node);
      case 'AssignmentExpression':  return this.genAssignment(node);
      case 'BinaryExpression':      return this.genBinary(node);
      case 'UnaryExpression':       return this.genUnary(node);
      case 'CallExpression':        return this.genCall(node);
      case 'Identifier':            return node.name as string;
      case 'Literal':               return String(node.value);
      default:                      return null;
    }
  }

  private genVarDecl(node: ASTNode): string {
    const name = node.name as string;
    if (node.initializer) {
      const val = this.genNode(node.initializer as ASTNode);
      this.emit('assign', { result: name, arg1: val ?? 'undefined', sourceLineRef: node.line });
    } else {
      this.emit('assign', { result: name, arg1: '0', sourceLineRef: node.line });
    }
    return name;
  }

  private genFuncDecl(node: ASTNode): string {
    const name = node.name as string;
    // Function entry label
    this.emit('label', { label: `func_${name}`, sourceLineRef: node.line });

    // Params: emit a placeholder for each parameter binding
    const params = (node.params as any[]) || [];
    for (const p of params) {
      this.emit('param', { arg1: p.name, sourceLineRef: node.line });
    }

    if (node.body) {
      this.genNode(node.body as ASTNode);
    }

    this.emit('label', { label: `end_${name}`, sourceLineRef: node.line });
    return name;
  }

  private genBlock(node: ASTNode): null {
    const stmts = (node.statements as ASTNode[]) || [];
    for (const stmt of stmts) {
      this.genNode(stmt);
    }
    return null;
  }

  private genExprStmt(node: ASTNode): null {
    if (node.expression) {
      this.genNode(node.expression as ASTNode);
    }
    return null;
  }

  private genIf(node: ASTNode): null {
    const condResult = this.genNode(node.condition as ASTNode) ?? 't_cond';
    const trueLabel  = this.newLabel('if_true_');
    const falseLabel = this.newLabel('if_false_');
    const endLabel   = this.newLabel('if_end_');

    this.emit('cjump', { arg1: condResult, label: trueLabel, sourceLineRef: node.line });
    this.emit('jump',  { label: falseLabel, sourceLineRef: node.line });

    this.emit('label', { label: trueLabel, sourceLineRef: node.line });
    this.genNode(node.consequent as ASTNode);
    this.emit('jump', { label: endLabel });

    this.emit('label', { label: falseLabel, sourceLineRef: node.line });
    if (node.alternate) {
      this.genNode(node.alternate as ASTNode);
    }

    this.emit('label', { label: endLabel });
    return null;
  }

  private genWhile(node: ASTNode): null {
    const startLabel = this.newLabel('while_start_');
    const bodyLabel  = this.newLabel('while_body_');
    const endLabel   = this.newLabel('while_end_');

    this.emit('label', { label: startLabel, sourceLineRef: node.line });
    const condResult = this.genNode(node.condition as ASTNode) ?? 't_cond';
    this.emit('cjump', { arg1: condResult, label: bodyLabel });
    this.emit('jump',  { label: endLabel });
    this.emit('label', { label: bodyLabel });
    this.genNode(node.body as ASTNode);
    this.emit('jump',  { label: startLabel });
    this.emit('label', { label: endLabel });
    return null;
  }

  private genFor(node: ASTNode): null {
    if (node.init)   this.genNode(node.init as ASTNode);

    const startLabel = this.newLabel('for_start_');
    const bodyLabel  = this.newLabel('for_body_');
    const endLabel   = this.newLabel('for_end_');

    this.emit('label', { label: startLabel, sourceLineRef: node.line });

    if (node.condition) {
      const condResult = this.genNode(node.condition as ASTNode) ?? 't_cond';
      this.emit('cjump', { arg1: condResult, label: bodyLabel });
      this.emit('jump',  { label: endLabel });
    }

    this.emit('label', { label: bodyLabel });
    this.genNode(node.body as ASTNode);
    if (node.update) this.genNode(node.update as ASTNode);
    this.emit('jump',  { label: startLabel });
    this.emit('label', { label: endLabel });
    return null;
  }

  private genReturn(node: ASTNode): null {
    if (node.argument) {
      const val = this.genNode(node.argument as ASTNode);
      this.emit('return', { arg1: val ?? undefined, sourceLineRef: node.line });
    } else {
      this.emit('return', { sourceLineRef: node.line });
    }
    return null;
  }

  private genAssignment(node: ASTNode): string {
    const rightVal = this.genNode(node.right as ASTNode) ?? 'undefined';
    const target   = (node.left as ASTNode).name as string;
    this.emit('assign', { result: target, arg1: rightVal, sourceLineRef: node.line });
    return target;
  }

  private genBinary(node: ASTNode): string {
    const left  = this.genNode(node.left  as ASTNode) ?? '?';
    const right = this.genNode(node.right as ASTNode) ?? '?';
    const temp  = this.newTemp();
    this.emit('binary', {
      result: temp,
      arg1: left,
      op: node.operator as string,
      arg2: right,
      sourceLineRef: node.line,
    });
    return temp;
  }

  private genUnary(node: ASTNode): string {
    const arg  = this.genNode(node.argument as ASTNode) ?? '?';
    const temp = this.newTemp();
    this.emit('unary', {
      result: temp,
      op: node.operator as string,
      arg1: arg,
      sourceLineRef: node.line,
    });
    return temp;
  }

  private genCall(node: ASTNode): string {
    const args = (node.args as ASTNode[]) || [];
    // Push args in order
    for (const arg of args) {
      const val = this.genNode(arg) ?? '?';
      this.emit('param', { arg1: val, sourceLineRef: node.line });
    }
    const temp = this.newTemp();
    this.emit('call', {
      result: temp,
      arg1: node.callee as string,
      nArgs: args.length,
      sourceLineRef: node.line,
    });
    return temp;
  }
}
