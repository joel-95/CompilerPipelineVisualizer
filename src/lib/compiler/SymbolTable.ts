// Symbol Table with Scoping and Scope Chain Management
import { DataType, SymbolEntry } from './types';

export interface ScopeNode {
  id: string;
  name: string;
  level: number;
  parent: ScopeNode | null;
  children: ScopeNode[];
  symbols: Map<string, SymbolEntry>;
}

export class SymbolTable {
  private rootScope: ScopeNode;
  private currentScope: ScopeNode;
  private scopeCounter: number = 0;
  private allSymbols: SymbolEntry[] = [];

  constructor() {
    this.rootScope = {
      id: 'scope-0',
      name: 'global',
      level: 0,
      parent: null,
      children: [],
      symbols: new Map(),
    };
    this.currentScope = this.rootScope;
  }

  /**
   * Enters a new local scope (e.g. inside a function or loop block)
   */
  public enterScope(name?: string): ScopeNode {
    this.scopeCounter++;
    const scopeName = name || `block_${this.scopeCounter}`;
    const newScope: ScopeNode = {
      id: `scope-${this.scopeCounter}`,
      name: scopeName,
      level: this.currentScope.level + 1,
      parent: this.currentScope,
      children: [],
      symbols: new Map(),
    };
    this.currentScope.children.push(newScope);
    this.currentScope = newScope;
    return newScope;
  }

  /**
   * Exits the current scope and returns to the parent scope
   */
  public exitScope(): ScopeNode | null {
    if (this.currentScope.parent) {
      const exited = this.currentScope;
      this.currentScope = this.currentScope.parent;
      return exited;
    }
    return null; // Already at global scope
  }

  /**
   * Inserts a symbol into the CURRENT scope
   * Returns false if already declared in the current scope
   */
  public insert(symbol: Omit<SymbolEntry, 'id' | 'scope' | 'scopeLevel'>): SymbolEntry | null {
    if (this.currentScope.symbols.has(symbol.name)) {
      return null; // Redeclaration in same scope
    }

    const fullEntry: SymbolEntry = {
      ...symbol,
      id: `sym-${this.allSymbols.length + 1}`,
      scope: this.currentScope.name,
      scopeLevel: this.currentScope.level,
    };

    this.currentScope.symbols.set(symbol.name, fullEntry);
    this.allSymbols.push(fullEntry);
    return fullEntry;
  }

  /**
   * Looks up a symbol by traversing from current scope up through ancestors to global
   */
  public lookup(name: string): SymbolEntry | undefined {
    let scope: ScopeNode | null = this.currentScope;
    while (scope !== null) {
      if (scope.symbols.has(name)) {
        return scope.symbols.get(name);
      }
      scope = scope.parent;
    }
    return undefined;
  }

  /**
   * Looks up a symbol strictly in the current scope
   */
  public lookupCurrentScope(name: string): SymbolEntry | undefined {
    return this.currentScope.symbols.get(name);
  }

  public getCurrentScope(): ScopeNode {
    return this.currentScope;
  }

  public getRootScope(): ScopeNode {
    return this.rootScope;
  }

  public getAllSymbols(): SymbolEntry[] {
    return [...this.allSymbols];
  }

  public getSymbolsByScope(scopeName: string): SymbolEntry[] {
    return this.allSymbols.filter((s) => s.scope === scopeName);
  }

  public reset(): void {
    this.rootScope = {
      id: 'scope-0',
      name: 'global',
      level: 0,
      parent: null,
      children: [],
      symbols: new Map(),
    };
    this.currentScope = this.rootScope;
    this.scopeCounter = 0;
    this.allSymbols = [];
  }
}
