// Error Management System
import { CompilationError, CompilerPhase, ErrorSeverity } from './types';

export class ErrorManager {
  private errors: CompilationError[] = [];
  private sourceLines: string[] = [];

  constructor(sourceCode: string = '') {
    this.setSourceCode(sourceCode);
  }

  public setSourceCode(sourceCode: string): void {
    this.sourceLines = sourceCode.split('\n');
    this.errors = [];
  }

  public addError(
    phase: CompilerPhase,
    message: string,
    line: number,
    column: number,
    suggestion?: string,
    severity: ErrorSeverity = 'ERROR'
  ): CompilationError {
    const codeSnippet = this.extractSnippet(line, column);
    const errorObj: CompilationError = {
      id: `err-${phase.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      phase,
      severity,
      message,
      line,
      column,
      codeSnippet,
      suggestion,
    };
    this.errors.push(errorObj);
    return errorObj;
  }

  public addWarning(
    phase: CompilerPhase,
    message: string,
    line: number,
    column: number,
    suggestion?: string
  ): CompilationError {
    return this.addError(phase, message, line, column, suggestion, 'WARNING');
  }

  public getErrors(): CompilationError[] {
    return [...this.errors];
  }

  public getErrorsByPhase(phase: CompilerPhase): CompilationError[] {
    return this.errors.filter((e) => e.phase === phase);
  }

  public hasErrors(): boolean {
    return this.errors.some((e) => e.severity === 'ERROR');
  }

  public hasPhaseError(phase: CompilerPhase): boolean {
    return this.errors.some((e) => e.phase === phase && e.severity === 'ERROR');
  }

  public clear(): void {
    this.errors = [];
  }

  private extractSnippet(line: number, column: number): string {
    const lineIdx = line - 1;
    if (lineIdx < 0 || lineIdx >= this.sourceLines.length) {
      return '';
    }
    const rawLine = this.sourceLines[lineIdx];
    const pad = Math.max(0, column - 1);
    const pointer = ' '.repeat(pad) + '^';
    return `${rawLine}\n${pointer}`;
  }
}
