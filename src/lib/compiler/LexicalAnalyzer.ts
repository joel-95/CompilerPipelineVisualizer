// Lexical Analyzer Implementation
import { Token, TokenType } from './types';
import { ErrorManager } from './ErrorManager';

const KEYWORDS = new Set([
  'int',
  'float',
  'string',
  'bool',
  'void',
  'if',
  'else',
  'while',
  'for',
  'return',
  'function',
]);

const BOOLEAN_LITERALS = new Set(['true', 'false']);

export class LexicalAnalyzer {
  private source: string = '';
  private cursor: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  private errorManager: ErrorManager;

  constructor(errorManager?: ErrorManager) {
    this.errorManager = errorManager || new ErrorManager();
  }

  public tokenize(source: string): Token[] {
    this.source = source;
    this.cursor = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    this.errorManager.setSourceCode(source);

    let tokenIdCounter = 1;

    while (this.cursor < this.source.length) {
      const char = this.source[this.cursor];

      // 1. Whitespace handling
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
        continue;
      }

      if (char === '\n') {
        this.advanceLine();
        continue;
      }

      // 2. Comments handling (// single line and /* multi line */)
      if (char === '/' && this.peek() === '/') {
        this.skipSingleLineComment();
        continue;
      }

      if (char === '/' && this.peek() === '*') {
        this.skipMultiLineComment();
        continue;
      }

      const startLine = this.line;
      const startCol = this.column;

      // 3. String Literals ("...")
      if (char === '"') {
        const strVal = this.readStringLiteral(startLine, startCol);
        this.tokens.push({
          id: `tok-${tokenIdCounter++}`,
          type: 'STRING_LITERAL',
          value: strVal,
          line: startLine,
          column: startCol,
        });
        continue;
      }

      // 4. Number Literals (integers and floats)
      if (this.isDigit(char)) {
        const numVal = this.readNumberLiteral();
        this.tokens.push({
          id: `tok-${tokenIdCounter++}`,
          type: 'NUMBER_LITERAL',
          value: numVal,
          line: startLine,
          column: startCol,
        });
        continue;
      }

      // 5. Identifiers and Keywords
      if (this.isAlpha(char) || char === '_') {
        const ident = this.readIdentifier();
        if (BOOLEAN_LITERALS.has(ident)) {
          this.tokens.push({
            id: `tok-${tokenIdCounter++}`,
            type: 'BOOLEAN_LITERAL',
            value: ident,
            line: startLine,
            column: startCol,
          });
        } else if (KEYWORDS.has(ident)) {
          this.tokens.push({
            id: `tok-${tokenIdCounter++}`,
            type: 'KEYWORD',
            value: ident,
            line: startLine,
            column: startCol,
          });
        } else {
          this.tokens.push({
            id: `tok-${tokenIdCounter++}`,
            type: 'IDENTIFIER',
            value: ident,
            line: startLine,
            column: startCol,
          });
        }
        continue;
      }

      // 6. Multi-character Operators (==, !=, <=, >=, &&, ||)
      const nextChar = this.peek();
      const twoChar = char + nextChar;

      if (['==', '!=', '<=', '>=', '&&', '||'].includes(twoChar)) {
        this.advance();
        this.advance();
        this.tokens.push({
          id: `tok-${tokenIdCounter++}`,
          type: 'OPERATOR',
          value: twoChar,
          line: startLine,
          column: startCol,
        });
        continue;
      }

      // 7. Single-character Operators
      if (['+', '-', '*', '/', '%', '=', '<', '>', '!'].includes(char)) {
        this.advance();
        this.tokens.push({
          id: `tok-${tokenIdCounter++}`,
          type: 'OPERATOR',
          value: char,
          line: startLine,
          column: startCol,
        });
        continue;
      }

      // 8. Delimiters
      if (['(', ')', '{', '}', '[', ']', ';', ','].includes(char)) {
        this.advance();
        this.tokens.push({
          id: `tok-${tokenIdCounter++}`,
          type: 'DELIMITER',
          value: char,
          line: startLine,
          column: startCol,
        });
        continue;
      }

      // 9. Unrecognized / Invalid Character Error Recovery
      this.errorManager.addError(
        'LEXICAL',
        `Unexpected character '${char}' (ASCII: ${char.charCodeAt(0)})`,
        startLine,
        startCol,
        `Remove the invalid character or replace with valid syntax.`
      );
      this.tokens.push({
        id: `tok-${tokenIdCounter++}`,
        type: 'ERROR',
        value: char,
        line: startLine,
        column: startCol,
      });
      this.advance();
    }

    // Add EOF token
    this.tokens.push({
      id: `tok-${tokenIdCounter++}`,
      type: 'EOF',
      value: '<EOF>',
      line: this.line,
      column: this.column,
    });

    return this.tokens;
  }

  private advance(): string {
    const char = this.source[this.cursor];
    this.cursor++;
    this.column++;
    return char;
  }

  private advanceLine(): void {
    this.cursor++;
    this.line++;
    this.column = 1;
  }

  private peek(offset: number = 1): string {
    const target = this.cursor + offset;
    return target < this.source.length ? this.source[target] : '';
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char) || char === '_';
  }

  private skipSingleLineComment(): void {
    // skip '//'
    this.advance();
    this.advance();
    while (this.cursor < this.source.length && this.source[this.cursor] !== '\n') {
      this.advance();
    }
  }

  private skipMultiLineComment(): void {
    const startLine = this.line;
    const startCol = this.column;
    // skip '/*'
    this.advance();
    this.advance();

    let terminated = false;
    while (this.cursor < this.source.length) {
      if (this.source[this.cursor] === '\n') {
        this.advanceLine();
      } else if (this.source[this.cursor] === '*' && this.peek() === '/') {
        this.advance();
        this.advance();
        terminated = true;
        break;
      } else {
        this.advance();
      }
    }

    if (!terminated) {
      this.errorManager.addError(
        'LEXICAL',
        'Unterminated multi-line comment /* ... */',
        startLine,
        startCol,
        'Add closing */ before end of file'
      );
    }
  }

  private readStringLiteral(startLine: number, startCol: number): string {
    // skip opening quote
    this.advance();
    let result = '';

    while (this.cursor < this.source.length && this.source[this.cursor] !== '"') {
      if (this.source[this.cursor] === '\n') {
        this.advanceLine();
        this.errorManager.addError(
          'LEXICAL',
          'Unterminated string literal (newline in string)',
          startLine,
          startCol,
          'Close the string with " on the same line'
        );
        return result;
      }
      if (this.source[this.cursor] === '\\') {
        this.advance();
        const esc = this.advance();
        if (esc === 'n') result += '\n';
        else if (esc === 't') result += '\t';
        else if (esc === '"') result += '"';
        else if (esc === '\\') result += '\\';
        else result += esc;
      } else {
        result += this.advance();
      }
    }

    if (this.cursor < this.source.length && this.source[this.cursor] === '"') {
      this.advance(); // consume closing quote
    } else {
      this.errorManager.addError(
        'LEXICAL',
        'Unterminated string literal',
        startLine,
        startCol,
        'Add closing " before end of line or file'
      );
    }

    return result;
  }

  private readNumberLiteral(): string {
    let result = '';
    let hasDot = false;

    while (this.cursor < this.source.length) {
      const char = this.source[this.cursor];
      if (this.isDigit(char)) {
        result += this.advance();
      } else if (char === '.' && !hasDot && this.isDigit(this.peek())) {
        hasDot = true;
        result += this.advance();
      } else {
        break;
      }
    }

    return result;
  }

  private readIdentifier(): string {
    let result = '';
    while (this.cursor < this.source.length && this.isAlphaNumeric(this.source[this.cursor])) {
      result += this.advance();
    }
    return result;
  }
}
