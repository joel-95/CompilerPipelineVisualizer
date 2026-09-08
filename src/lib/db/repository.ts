// Database Repository for Compilation Sessions, Tokens, AST, Symbols, and Errors
import { prisma } from './prisma';
import { PipelineResult, CompilationError } from '../compiler/types';

// In-memory session store fallback if database is not reachable locally
declare global {
  // eslint-disable-next-line no-var
  var cpvSessions: Map<string, any> | undefined;
  // eslint-disable-next-line no-var
  var cpvErrors: Map<string, CompilationError[]> | undefined;
}

const inMemorySessions = globalThis.cpvSessions || new Map<string, any>();
const inMemoryErrors = globalThis.cpvErrors || new Map<string, CompilationError[]>();

if (process.env.NODE_ENV !== 'production') {
  globalThis.cpvSessions = inMemorySessions;
  globalThis.cpvErrors = inMemoryErrors;
}

export class CompilationRepository {
  /**
   * Persists a complete compilation result into the database (or memory fallback)
   */
  public static async saveSession(result: PipelineResult, userId?: string): Promise<string> {
    const { sessionId, sourceCode, tokens, ast, symbolTable, errors } = result;

    // Cache in memory fallback
    inMemorySessions.set(sessionId, result);
    inMemoryErrors.set(sessionId, errors);

    try {
      // Check if DB is reachable
      const session = await prisma.compilationSession.create({
        data: {
          id: sessionId,
          userId: userId || 'anonymous',
          sourceCode,
          tokens: {
            create: tokens.map((t) => ({
              type: t.type,
              value: t.value,
              line: t.line,
              column: t.column,
            })),
          },
          syntaxTrees: ast
            ? {
                create: [
                  {
                    treeJson: JSON.stringify(ast),
                  },
                ],
              }
            : undefined,
          symbolEntries: {
            create: symbolTable.map((s) => ({
              name: s.name,
              type: s.type,
              scope: s.scope,
              metadata: JSON.stringify({
                kind: s.kind,
                line: s.line,
                column: s.column,
                params: s.params,
                returnType: s.returnType,
              }),
            })),
          },
          compilationErrors: {
            create: errors.map((e) => ({
              phase: e.phase,
              errorMsg: e.message,
              severity: e.severity,
              line: e.line,
              column: e.column,
            })),
          },
        },
      });

      return session.id;
    } catch (err) {
      console.warn('Database persistence skipped or failed (operating with memory store fallback):', (err as Error).message);
      return sessionId;
    }
  }

  /**
   * Retrieves errors for a specific compilation session
   */
  public static async getErrorsBySessionId(sessionId: string): Promise<CompilationError[]> {
    try {
      const dbErrors = await prisma.compilationError.findMany({
        where: { sessionId },
      });

      if (dbErrors && dbErrors.length > 0) {
        return dbErrors.map((e) => ({
          id: e.id,
          phase: e.phase as any,
          severity: e.severity as any,
          message: e.errorMsg,
          line: e.line || 1,
          column: e.column || 1,
        }));
      }
    } catch (err) {
      console.warn('Using memory store for error lookup:', (err as Error).message);
    }

    return inMemoryErrors.get(sessionId) || [];
  }

  /**
   * Retrieves full session by ID
   */
  public static async getSession(sessionId: string): Promise<any | null> {
    try {
      const session = await prisma.compilationSession.findUnique({
        where: { id: sessionId },
        include: {
          tokens: true,
          syntaxTrees: true,
          symbolEntries: true,
          compilationErrors: true,
        },
      });
      if (session) return session;
    } catch (err) {
      // fallback
    }

    return inMemorySessions.get(sessionId) || null;
  }
}
