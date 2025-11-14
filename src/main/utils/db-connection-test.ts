import mysql from 'mysql2/promise'
import { Client as PgClient } from 'pg'
import type { ConnectionConfig } from '../database/types'

export type { ConnectionConfig }

export interface ConnectionTestResult {
  success: boolean
  message: string
  details?: {
    serverVersion?: string
    connectionTime?: number
  }
}

async function testMySQLConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
  const startTime = Date.now()
  let connection

  try {
    // MySQL 연결 설정
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      connectTimeout: 10000 // 10초 타임아웃
    })

    // 서버 버전 확인
    const [rows] = await connection.query('SELECT VERSION() as version')
    const version = (rows as { version: string }[])[0].version
    const connectionTime = Date.now() - startTime

    await connection.end()

    return {
      success: true,
      message: 'MySQL 연결에 성공했습니다.',
      details: {
        serverVersion: version,
        connectionTime
      }
    }
  } catch (error) {
    if (connection) {
      await connection.end().catch(() => {})
    }

    return {
      success: false,
      message: getMySQLErrorMessage(error)
    }
  }
}

async function testPostgreSQLConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
  const startTime = Date.now()
  const client = new PgClient({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database || 'postgres',
    connectionTimeoutMillis: 10000 // 10초 타임아웃
  })

  try {
    await client.connect()

    // 서버 버전 확인
    const result = await client.query('SELECT version()')
    const version = result.rows[0].version as string
    const connectionTime = Date.now() - startTime

    await client.end()

    return {
      success: true,
      message: 'PostgreSQL 연결에 성공했습니다.',
      details: {
        serverVersion: version,
        connectionTime
      }
    }
  } catch (error) {
    await client.end().catch(() => {})

    return {
      success: false,
      message: getPostgreSQLErrorMessage(error)
    }
  }
}

export async function testDatabaseConnection(
  config: ConnectionConfig
): Promise<ConnectionTestResult> {
  try {
    if (config.dbType === 'MySQL') {
      return await testMySQLConnection(config)
    } else if (config.dbType === 'PostgreSQL') {
      return await testPostgreSQLConnection(config)
    } else {
      return {
        success: false,
        message: '지원하지 않는 데이터베이스 타입입니다.'
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    return {
      success: false,
      message: `연결 테스트 중 오류 발생: ${errorMessage}`
    }
  }
}

function getMySQLErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const errorCode = (error as { code: string }).code

    switch (errorCode) {
      case 'ECONNREFUSED':
        return '데이터베이스 서버에 연결할 수 없습니다. 호스트와 포트를 확인해주세요.'
      case 'ER_ACCESS_DENIED_ERROR':
        return '사용자명 또는 비밀번호가 올바르지 않습니다.'
      case 'ER_BAD_DB_ERROR':
        return '지정한 데이터베이스를 찾을 수 없습니다.'
      case 'ETIMEDOUT':
      case 'ENOTFOUND':
        return '호스트를 찾을 수 없습니다. 호스트 주소를 확인해주세요.'
      case 'PROTOCOL_CONNECTION_LOST':
        return '데이터베이스 연결이 끊어졌습니다.'
      default:
        break
    }
  }

  const message = error instanceof Error ? error.message : '알 수 없는 오류'
  return `연결 실패: ${message}`
}

function getPostgreSQLErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const errorCode = (error as { code: string }).code

    switch (errorCode) {
      case 'ECONNREFUSED':
        return '데이터베이스 서버에 연결할 수 없습니다. 호스트와 포트를 확인해주세요.'
      case '28P01':
        return '사용자명 또는 비밀번호가 올바르지 않습니다.'
      case '3D000':
        return '지정한 데이터베이스를 찾을 수 없습니다.'
      case 'ETIMEDOUT':
      case 'ENOTFOUND':
        return '호스트를 찾을 수 없습니다. 호스트 주소를 확인해주세요.'
      default:
        break
    }
  }

  const message = error instanceof Error ? error.message : '알 수 없는 오류'
  return `연결 실패: ${message}`
}
