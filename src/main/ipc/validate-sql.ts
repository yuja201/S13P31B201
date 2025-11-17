import { ipcMain } from 'electron'
import mysql from 'mysql2/promise'
import { Client as PGClient } from 'pg'
import { Parser, type AST } from 'node-sql-parser'
import { getConnectionConfig } from '../services/user-query-test/get-connection-config'
import { getDatabaseByProjectId } from '../database/databases'

/* =========================================================
    TYPE
========================================================= */
export type ValidateResult = {
  valid: boolean
  type?: string
  shortMessage?: string
  error?: string
}

/* =========================================================
    HELPER: RECURSIVE AST SAFETY CHECK
========================================================= */
const isAstSafe = (node: unknown): boolean => {
  if (!node || typeof node !== 'object') return true

  const n = node as Record<string, unknown>

  // 금지 명령 검출
  const forbidden = ['drop', 'delete', 'insert', 'update', 'call', 'truncate']
  if (typeof n.type === 'string') {
    if (forbidden.includes(n.type.toLowerCase())) return false
  }

  // 재귀 탐색
  for (const key of Object.keys(n)) {
    const value = n[key]
    if (Array.isArray(value)) {
      for (const item of value) {
        if (!isAstSafe(item)) return false
      }
    } else if (typeof value === 'object') {
      if (!isAstSafe(value)) return false
    }
  }

  return true
}

/* =========================================================
    PARSER ERROR MAPPING
========================================================= */
const normalizeParserError = (message: string): string => {
  if (message.includes('end of input')) {
    return 'SQL 문장이 정상적으로 종료되지 않았습니다.'
  }
  if (message.startsWith('Expected')) {
    return 'SQL 문법이 올바르지 않습니다.'
  }
  return message
}

/* =========================================================
    ERROR HELPERS
========================================================= */
const syntaxError = (shortMessage: string, error: string, type: string): ValidateResult => ({
  valid: false,
  shortMessage,
  error,
  type
})

const connectionError = (shortMessage: string, error: string, type: string): ValidateResult => ({
  valid: false,
  shortMessage,
  error,
  type
})

/* =========================================================
    SAFE COMMENT REMOVAL (문자열 보존)
========================================================= */
function safeRemoveComments(sql: string): string {
  let out = ''
  let inString = false
  let quote = ''

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    const next = sql[i + 1]

    if (!inString && (ch === "'" || ch === '"')) {
      inString = true
      quote = ch
      out += ch
      continue
    }

    if (inString && ch === quote) {
      inString = false
      quote = ''
      out += ch
      continue
    }

    if (inString) {
      out += ch
      continue
    }

    // -- comment
    if (ch === '-' && next === '-') {
      while (i < sql.length && sql[i] !== '\n') i++
      continue
    }

    // /* block comment */
    if (ch === '/' && next === '*') {
      i += 2
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++
      i++
      continue
    }

    out += ch
  }

  return out
}

/* =========================================================
    REMOVE ONLY TRAILING SEMICOLON (문자열 보호)
========================================================= */
function removeTrailingSemicolon(sql: string): string {
  return sql.trim().replace(/;+\s*$/, '')
}

/* =========================================================
    MAIN HANDLER
========================================================= */
ipcMain.handle(
  'validate-sql',
  async (_, payload: { projectId: number; query: string }): Promise<ValidateResult> => {
    const { projectId, query } = payload

    /* -----------------------------------------------
        1) PROJECT DB INFO
    ------------------------------------------------ */
    const dbInfo = getDatabaseByProjectId(projectId)
    if (!dbInfo) {
      return connectionError(
        'DB 연결 오류',
        '데이터베이스 연결 정보가 존재하지 않습니다.',
        'connection'
      )
    }

    const databaseName = dbInfo.database_name

    /* -----------------------------------------------
        2) LOAD CONNECTION CONFIG
    ------------------------------------------------ */
    let config: Awaited<ReturnType<typeof getConnectionConfig>>
    try {
      config = await getConnectionConfig(projectId)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      return connectionError('DB 연결 오류', msg, 'connection')
    }

    const finalConfig = {
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: databaseName
    }

    /* -----------------------------------------------
        3) CLEAN SQL (주석/세미콜론 제거)
    ------------------------------------------------ */
    const noComments = safeRemoveComments(query)
    const cleanedQuery = removeTrailingSemicolon(noComments)

    /* -----------------------------------------------
        4) PARSER VALIDATION
    ------------------------------------------------ */
    const parser = new Parser()
    const parserOptions = {
      database: config.dbType === 'MySQL' ? 'mysql' : 'postgresql'
    } as const

    let astParsed: AST | AST[]

    try {
      astParsed = parser.astify(cleanedQuery, parserOptions)

      // 다중 SQL 문장 금지
      if (Array.isArray(astParsed)) {
        return syntaxError(
          '하나의 SQL만 입력해주세요.',
          '여러 SQL 문장은 허용되지 않습니다.',
          'syntax'
        )
      }

      if (astParsed.type !== 'select') {
        return syntaxError(
          'SELECT 문만 지원됩니다.',
          `SELECT 문이 아닙니다 (현재: ${astParsed.type}).`,
          'syntax'
        )
      }

      // AST 내부 안전성 검사
      if (!isAstSafe(astParsed)) {
        return syntaxError(
          '지원되지 않는 SQL 구조입니다.',
          '쿼리 내부에 허용되지 않는 SQL 문이 포함되어 있습니다.',
          'syntax'
        )
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      return syntaxError('SQL 문법 오류입니다.', normalizeParserError(message), 'syntax')
    }

    /* -----------------------------------------------
        5) VALIDATE WITH MYSQL
    ------------------------------------------------ */
    if (config.dbType === 'MySQL') {
      try {
        const conn = await mysql.createConnection(finalConfig)

        try {
          await conn.query(`EXPLAIN ${cleanedQuery}`)
          return { valid: true }
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : String(e)
          return syntaxError('MySQL 구문 오류입니다.', message, 'mysql-syntax')
        } finally {
          await conn.end()
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e)
        return connectionError('MySQL 서버에 연결할 수 없습니다.', message, 'mysql-connection')
      }
    }

    /* -----------------------------------------------
        6) VALIDATE WITH POSTGRES
    ------------------------------------------------ */
    try {
      const client = new PGClient(finalConfig)
      await client.connect()

      const stmt = `validate_${Date.now()}_${Math.random().toString(36).slice(2)}`

      try {
        await client.query(`PREPARE ${stmt} AS ${cleanedQuery}`)
        await client.query(`DEALLOCATE ${stmt}`)
        return { valid: true }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e)
        await client.query(`DEALLOCATE ${stmt}`).catch(() => {})
        return syntaxError('PostgreSQL 구문 오류입니다.', message, 'postgres-syntax')
      } finally {
        await client.end()
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      return connectionError(
        'PostgreSQL 서버에 연결할 수 없습니다.',
        message,
        'postgres-connection'
      )
    }
  }
)
