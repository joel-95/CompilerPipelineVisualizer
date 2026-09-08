import { describe, it, expect } from 'vitest';
import { SymbolTable } from '../lib/compiler/SymbolTable';

describe('SymbolTable (Ebin - Backend Lead)', () => {
  it('16. Enters and exits hierarchical scopes properly', () => {
    const table = new SymbolTable();
    expect(table.getCurrentScope().name).toBe('global');
    expect(table.getCurrentScope().level).toBe(0);

    table.enterScope('func_main');
    expect(table.getCurrentScope().name).toBe('func_main');
    expect(table.getCurrentScope().level).toBe(1);

    table.enterScope('block_1');
    expect(table.getCurrentScope().name).toBe('block_1');
    expect(table.getCurrentScope().level).toBe(2);

    table.exitScope();
    expect(table.getCurrentScope().name).toBe('func_main');

    table.exitScope();
    expect(table.getCurrentScope().name).toBe('global');
  });

  it('17. Resolves symbols from inner scope to outer/global scope', () => {
    const table = new SymbolTable();
    table.insert({
      name: 'globalVar',
      type: 'int',
      kind: 'variable',
      line: 1,
      column: 1,
    });

    table.enterScope('localScope');
    table.insert({
      name: 'localVar',
      type: 'string',
      kind: 'variable',
      line: 5,
      column: 1,
    });

    // Both should be resolved from inside localScope
    expect(table.lookup('localVar')).toBeDefined();
    expect(table.lookup('localVar')?.type).toBe('string');
    expect(table.lookup('globalVar')).toBeDefined();
    expect(table.lookup('globalVar')?.type).toBe('int');

    // Exit scope
    table.exitScope();

    // Inside global scope, localVar should no longer be visible
    expect(table.lookup('localVar')).toBeUndefined();
    expect(table.lookup('globalVar')).toBeDefined();
  });

  it('18. Rejects duplicate declarations in the exact same scope', () => {
    const table = new SymbolTable();
    const first = table.insert({
      name: 'count',
      type: 'int',
      kind: 'variable',
      line: 2,
      column: 5,
    });
    expect(first).not.toBeNull();

    const second = table.insert({
      name: 'count',
      type: 'int',
      kind: 'variable',
      line: 3,
      column: 5,
    });
    expect(second).toBeNull(); // Rejected duplicate
  });

  it('19. Supports shadowing across different nested scopes', () => {
    const table = new SymbolTable();
    table.insert({
      name: 'shadowed',
      type: 'int',
      kind: 'variable',
      line: 1,
      column: 1,
    });

    table.enterScope('inner');
    const innerShadow = table.insert({
      name: 'shadowed',
      type: 'float',
      kind: 'variable',
      line: 4,
      column: 1,
    });
    expect(innerShadow).not.toBeNull();
    expect(table.lookup('shadowed')?.type).toBe('float');

    table.exitScope();
    expect(table.lookup('shadowed')?.type).toBe('int');
  });
});
