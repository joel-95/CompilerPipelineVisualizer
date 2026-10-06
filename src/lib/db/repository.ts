// Database Repository for Compilation Sessions, Tokens, AST, Symbols, IR, and Errors
import { getPrisma } from './prisma';
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

export interface SessionSummary {
  id: string;
  userId: string;
  sourceSnippet: string;
  createdAt: string;
  status: string;
  errorCount: number;
  tokenCount: number;
  irCount: number;
  asmCount: number;
}

export class CompilationRepository {
  /**
   * Persists a complete compilation result into the database (or memory fallback)
   */
  public static async saveSession(result: PipelineResult, userId?: string): Promise<string> {
    const { sessionId, sourceCode, tokens, ast, symbolTable, errors, tac, assembly } = result;

    // Cache in memory fallback
    inMemorySessions.set(sessionId, result);
    inMemoryErrors.set(sessionId, errors);

    const prisma = getPrisma();
    if (!prisma) {
      return sessionId;
    }

    try {
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
          intermediateCode: {
            create: tac.map((instr, idx) => ({
              irCode: JSON.stringify(instr),
              lineNumber: idx + 1,
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
      console.warn('Database persistence skipped (using memory store fallback):', (err as Error).message);
      return sessionId;
    }
  }

  /**
   * Retrieves all compilation sessions summaries
   */
  public static async listSessions(): Promise<SessionSummary[]> {
    const summaries: SessionSummary[] = [];
    const prisma = getPrisma();

    if (prisma) {
      try {
        const dbSessions = await prisma.compilationSession.findMany({
          orderBy: { createdAt: 'desc' },
          take: 30,
          include: {
            compilationErrors: true,
            tokens: true,
            intermediateCode: true,
          },
        });

        if (dbSessions && dbSessions.length > 0) {
          return dbSessions.map((s) => ({
            id: s.id,
            userId: s.userId || 'anonymous',
            sourceSnippet: s.sourceCode.slice(0, 80).replace(/\n/g, ' ') + (s.sourceCode.length > 80 ? '...' : ''),
            createdAt: s.createdAt.toISOString(),
            status: s.compilationErrors.some((e) => e.severity === 'ERROR') ? 'error' : 'success',
            errorCount: s.compilationErrors.length,
            tokenCount: s.tokens.length,
            irCount: s.intermediateCode.length,
            asmCount: 0,
          }));
        }
      } catch (err) {
        // Memory fallback
      }
    }

    // In-memory fallback
    for (const [id, res] of inMemorySessions.entries()) {
      summaries.push({
        id,
        userId: 'anonymous',
        sourceSnippet: res.sourceCode.slice(0, 80).replace(/\n/g, ' ') + (res.sourceCode.length > 80 ? '...' : ''),
        createdAt: new Date().toISOString(),
        status: res.errors?.some((e: any) => e.severity === 'ERROR') ? 'error' : 'success',
        errorCount: res.errors?.length || 0,
        tokenCount: res.tokens?.length || 0,
        irCount: res.tac?.length || 0,
        asmCount: res.assembly?.length || 0,
      });
    }

    return summaries.reverse();
  }

  /**
   * Retrieves errors for a specific compilation session
   */
  public static async getErrorsBySessionId(sessionId: string): Promise<CompilationError[]> {
    const prisma = getPrisma();
    if (prisma) {
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
        // fallback
      }
    }

    return inMemoryErrors.get(sessionId) || [];
  }

  /**
   * Retrieves full session by ID
   */
  public static async getSession(sessionId: string): Promise<any | null> {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const session = await prisma.compilationSession.findUnique({
          where: { id: sessionId },
          include: {
            tokens: true,
            syntaxTrees: true,
            symbolEntries: true,
            intermediateCode: true,
            compilationErrors: true,
          },
        });
        if (session) return session;
      } catch (err) {
        // fallback
      }
    }

    return inMemorySessions.get(sessionId) || null;
  }

  /**
   * Deletes a compilation session
   */
  public static async deleteSession(sessionId: string): Promise<boolean> {
    inMemorySessions.delete(sessionId);
    inMemoryErrors.delete(sessionId);

    const prisma = getPrisma();
    if (prisma) {
      try {
        await prisma.compilationSession.delete({
          where: { id: sessionId },
        });
        return true;
      } catch (err) {
        return true;
      }
    }

    return true;
  }
}
