// Advanced Error Analyzer & Static Diagnostic System (Kevin - Backend)
import { ASTNode, ProgramNode, CompilationError, Token } from './types';
import { ErrorManager } from './ErrorManager';

export interface StaticAnalysisReport {
  errors: CompilationError[];
  warnings: CompilationError[];
  suggestions: { line: number; message: string; codeFix?: string }[];
  complexity: {
    cyclomaticComplexity: number;
    depth: number;
    statementCount: number;
  };
}

export class ErrorAnalyzer {
  private errorManager: ErrorManager;
  private referencedIdents: Set<string> = new Set();
  private declaredVars: Map<string, { line: number; column: number }> = new Map();
  private maxDepth = 0;
  private complexity = 1; // Base cyclomatic complexity

  constructor(errorManager?: ErrorManager) {
    this.errorManager = errorManager || new ErrorManager();
  }

  public analyze(ast: ProgramNode | null, sourceCode: string): StaticAnalysisReport {
    this.referencedIdents.clear();
    this.declaredVars.clear();
    this.maxDepth = 0;
    this.complexity = 1;

    if (!ast) {
      return {
        errors: this.errorManager.getErrors().filter((e) => e.severity === 'ERROR'),
        warnings: this.errorManager.getErrors().filter((e) => e.severity === 'WARNING'),
        suggestions: [],
        complexity: { cyclomaticComplexity: 1, depth: 0, statementCount: 0 },
      };
    }

    this.walk(ast, 1);

    // Unused variables analysis
    this.declaredVars.forEach((loc, name) => {
      if (!this.referencedIdents.has(name) && !name.startsWith('_')) {
        this.errorManager.addWarning(
          'STATIC_ANALYSIS',
          `Variable '${name}' is declared but never referenced`,
          loc.line,
          loc.column,
          `Remove '${name}' or prefix with an underscore if intentionally unused.`
        );
      }
    });

    const suggestions = this.generateSuggestions(sourceCode);

    return {
      errors: this.errorManager.getErrors().filter((e) => e.severity === 'ERROR'),
      warnings: this.errorManager.getErrors().filter((e) => e.severity === 'WARNING'),
      suggestions,
      complexity: {
        cyclomaticComplexity: this.complexity,
        depth: this.maxDepth,
        statementCount: ast.body.length,
      },
    };
  }

  private walk(node: ASTNode, currentDepth: number): void {
    if (!node) return;
    if (currentDepth > this.maxDepth) {
      this.maxDepth = currentDepth;
    }

    switch (node.type) {
      case 'Program':
        if ((node as ProgramNode).body) {
          for (const stmt of (node as ProgramNode).body) {
            this.walk(stmt, currentDepth + 1);
          }
        }
        break;

      case 'VariableDeclaration':
        this.declaredVars.set(node.name, { line: node.line, column: node.column });
        if (node.initializer) {
          this.walk(node.initializer, currentDepth + 1);
        }
        break;

      case 'FunctionDeclaration':
        this.referencedIdents.add(node.name);
        this.complexity += 1;
        if (node.body) {
          this.walk(node.body, currentDepth + 1);
        }
        break;

      case 'IfStatement':
        this.complexity += 1;
        this.walk(node.condition, currentDepth + 1);
        this.walk(node.consequent, currentDepth + 1);
        if (node.alternate) {
          this.complexity += 1;
          this.walk(node.alternate, currentDepth + 1);
        }
        break;

      case 'WhileStatement':
      case 'ForStatement':
        this.complexity += 1;
        if (node.condition) this.walk(node.condition, currentDepth + 1);
        if (node.body) this.walk(node.body, currentDepth + 1);
        if (node.init) this.walk(node.init, currentDepth + 1);
        if (node.update) this.walk(node.update, currentDepth + 1);
        break;

      case 'BinaryExpression':
        // Division by zero static detection
        if (['/', '%'].includes(node.operator)) {
          if (node.right.type === 'Literal' && (node.right.value === 0 || node.right.value === '0')) {
            this.errorManager.addError(
              'STATIC_ANALYSIS',
              `Division by zero in constant arithmetic expression`,
              node.line,
              node.column,
              `Ensure the denominator cannot evaluate to 0.`
            );
          }
        }
        if (['&&', '||'].includes(node.operator)) {
          this.complexity += 1;
        }
        this.walk(node.left, currentDepth + 1);
        this.walk(node.right, currentDepth + 1);
        break;

      case 'UnaryExpression':
        this.walk(node.argument, currentDepth + 1);
        break;

      case 'AssignmentExpression':
        this.referencedIdents.add(node.left.name);
        this.walk(node.right, currentDepth + 1);
        break;

      case 'CallExpression':
        this.referencedIdents.add(node.callee);
        if (node.args) {
          for (const arg of node.args) {
            this.walk(arg, currentDepth + 1);
          }
        }
        break;

      case 'Identifier':
        this.referencedIdents.add(node.name);
        break;

      case 'BlockStatement':
        if (node.statements) {
          let afterReturn = false;
          for (const stmt of node.statements) {
            if (afterReturn) {
              this.errorManager.addWarning(
                'STATIC_ANALYSIS',
                `Unreachable statement after return`,
                stmt.line,
                stmt.column,
                `Delete unreachable code following the return statement.`
              );
            }
            this.walk(stmt, currentDepth + 1);
            if (stmt.type === 'ReturnStatement') {
              afterReturn = true;
            }
          }
        }
        break;

      case 'ReturnStatement':
        if (node.argument) {
          this.walk(node.argument, currentDepth + 1);
        }
        break;

      default:
        if (node.children) {
          for (const child of node.children) {
            this.walk(child, currentDepth + 1);
          }
        }
        break;
    }
  }

  private generateSuggestions(sourceCode: string): { line: number; message: string; codeFix?: string }[] {
    const suggestions: { line: number; message: string; codeFix?: string }[] = [];
    const errors = this.errorManager.getErrors();

    for (const err of errors) {
      if (err.suggestion) {
        suggestions.push({
          line: err.line,
          message: err.suggestion,
        });
      }
    }

    return suggestions;
  }
}
