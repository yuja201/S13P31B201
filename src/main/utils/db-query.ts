import mysql from 'mysql2/promise'
import { Client as PgClient } from 'pg'
import { ConnectionConfig } from './db-connection-test'

// --- MySQL 헬퍼 함수 ---
async function fetchMySQLRandomSample(
  config: ConnectionConfig,
  table: string,
  column: string
): Promise<{ sample: unknown }> {
  let connection
  try {
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      connectTimeout: 5000
    })
    const [rows] = await connection.query('SELECT ?? FROM ?? ORDER BY RAND() LIMIT 1', [
      column,
      table
    ])
    await connection.end()
    const result = (rows as { [key: string]: unknown }[])[0]
    if (!result) {
      return { sample: null }
    }
    return { sample: result[column] }
  } catch (error: unknown) {
    if (connection) await connection.end().catch(() => {})
    throw error
  }
}

async function checkMySQLFkValue(
  config: ConnectionConfig,
  table: string,
  column: string,
  value: string | number
): Promise<{ isValid: boolean }> {
  let connection
  try {
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      connectTimeout: 5000 // 5초
    })
    const [rows] = await connection.query('SELECT 1 FROM ?? WHERE ?? = ? LIMIT 1', [
      table,
      column,
      value
    ])
    await connection.end()
    return { isValid: (rows as unknown[]).length > 0 }
  } catch (error: unknown) {
    if (connection) await connection.end().catch(() => {})
    throw error
  }
}

function quoteIdentifier(identifier: string): string {
  return identifier
    .split('.')
    .map((part) => `"${part.replace(/"/g, '""')}"`)
    .join('.')
}

// --- PostgreSQL 헬퍼 함수 ---
async function fetchPostgreSQLRandomSample(
  config: ConnectionConfig,
  table: string,
  column: string
): Promise<{ sample: unknown }> {
  const client = new PgClient({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database || 'postgres',
    connectionTimeoutMillis: 5000 // 5초
  })
  try {
    await client.connect()
    const query = `SELECT ${quoteIdentifier(column)} FROM ${quoteIdentifier(
      table
    )} ORDER BY RANDOM() LIMIT 1`
    const result = await client.query(query)
    await client.end()

    if (result.rows.length === 0) {
      return { sample: null }
    }
    return { sample: result.rows[0][column] }
  } catch (error: unknown) {
    await client.end().catch(() => {})
    throw error
  }
}

async function checkPostgreSQLFkValue(
  config: ConnectionConfig,
  table: string,
  column: string,
  value: string | number
): Promise<{ isValid: boolean }> {
  const client = new PgClient({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database || 'postgres',
    connectionTimeoutMillis: 5000
  })
  try {
    await client.connect()
    const query = `SELECT 1 FROM ${quoteIdentifier(table)} WHERE 
     ${quoteIdentifier(column)} = $1 LIMIT 1`
    const result = await client.query(query, [value])
    await client.end()
    return { isValid: result.rows.length > 0 }
  } catch (error: unknown) {
    await client.end().catch(() => {})
    throw error
  }
}

/**
 *  무작위 샘플링 쿼리 (분기)
 */
export async function fetchRandomSample(
  config: ConnectionConfig,
  table: string,
  column: string
): Promise<{ sample: unknown }> {
  if (config.dbType === 'MySQL') {
    return fetchMySQLRandomSample(config, table, column)
  } else if (config.dbType === 'PostgreSQL') {
    return fetchPostgreSQLRandomSample(config, table, column)
  }
  throw new Error(`지원되지 않는 DB 타입입니다: ${config.dbType}`)
}

/**
 *  FK 값 존재 여부 검증 쿼리 (분기)
 */
export async function checkFkValueExists(
  config: ConnectionConfig,
  table: string,
  column: string,
  value: string | number
): Promise<{ isValid: boolean }> {
  if (config.dbType === 'MySQL') {
    return checkMySQLFkValue(config, table, column, value)
  } else if (config.dbType === 'PostgreSQL') {
    return checkPostgreSQLFkValue(config, table, column, value)
  }
  throw new Error(`지원되지 않는 DB 타입입니다: ${config.dbType}`)
}

/**
 * FK 참조를 위한 샘플 데이터 조회 (중복 허용)
 */
export async function fetchReferenceRandomSamples(
  config: ConnectionConfig,
  table: string,
  column: string,
  count: number
): Promise<Record<string, unknown>[]> {
  if (config.dbType === 'MySQL') {
    let connection
    try {
      connection = await mysql.createConnection(config)
      // mysql2 라이브러리의 ??, ? 문법으로 SQL Injection을 방지합니다.
      const [rows] = await connection.query('SELECT ?? FROM ?? ORDER BY RAND() LIMIT ?', [
        column,
        table,
        count
      ])
      await connection.end()
      return rows as Record<string, unknown>[]
    } catch (error) {
      if (connection) await connection.end().catch(() => {})
      throw error
    }
  } else {
    // PostgreSQL
    const client = new PgClient(config)
    try {
      await client.connect()
      // quoteIdentifier 헬퍼 함수로 테이블/컬럼명을 안전하게 처리합니다.
      const query = `SELECT ${quoteIdentifier(column)} FROM ${quoteIdentifier(
        table
      )} ORDER BY RANDOM() LIMIT ${count}`
      const result = await client.query(query)
      await client.end()
      return result.rows
    } catch (error) {
      await client.end().catch(() => {})
      throw error
    }
  }
}

/**
 * FK 참조를 위한 고유 샘플 데이터 조회 (중복 없음)
 */
export async function fetchReferenceUniqueSamples(
  config: ConnectionConfig,
  table: string,
  column: string,
  count: number
): Promise<Record<string, unknown>[]> {
  if (config.dbType === 'MySQL') {
    let connection
    try {
      connection = await mysql.createConnection(config)
      // DISTINCT 키워드를 추가하여 고유값을 조회합니다.
      const [rows] = await connection.query(
        'SELECT DISTINCT ?? FROM ?? ORDER BY    RAND() LIMIT ?',
        [column, table, count]
      )
      await connection.end()
      return rows as Record<string, unknown>[]
    } catch (error) {
      if (connection) await connection.end().catch(() => {})
      throw error
    }
  } else {
    // PostgreSQL
    const client = new PgClient(config)
    try {
      await client.connect()
      // DISTINCT 키워드를 추가하여 고유값을 조회합니다.
      const query = `SELECT DISTINCT ${quoteIdentifier(column)} FROM
  ${quoteIdentifier(table)} ORDER BY RANDOM() LIMIT ${count}`
      const result = await client.query(query)
      await client.end()
      return result.rows
    } catch (error) {
      await client.end().catch(() => {})
      throw error
    }
  }
}
