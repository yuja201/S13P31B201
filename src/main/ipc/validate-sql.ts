import { ipcMain } from 'electron'
import mysql from 'mysql2/promise'
import { Client as PGClient } from 'pg'
import { getConnectionConfig } from '../services/user-query-test/get-connection-config'
import { getDatabasesByProjectId } from '../database/databases'

ipcMain.handle(
  'validate-sql',
  async (
    _,
    payload: { projectId: number; query: string }
  ): Promise<{ valid: boolean; type?: string; error?: string }> => {
    const { projectId, query } = payload

    // 1) 프로젝트에 연결된 DB 정보 조회
    let dbRows
    try {
      dbRows = await getDatabasesByProjectId(projectId)
    } catch (e) {
      return { valid: false, type: 'connection', error: 'DB 정보 조회 실패' + e }
    }

    if (!dbRows || dbRows.length === 0) {
      return {
        valid: false,
        type: 'connection',
        error: '프로젝트에 연결된 데이터베이스가 없습니다.'
      }
    }

    const databaseName = dbRows[0].database // ⭐ 정확한 필드명만 알려주시면 변경합니다

    // 2) DB 접속정보 구성
    let config
    try {
      config = await getConnectionConfig(projectId)
    } catch (e) {
      const err = e as Error
      return { valid: false, type: 'connection', error: err.message }
    }

    // 3) 실제 DB 검증용 연결 구성 (DB 이름 포함)
    const connectionConfig = {
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: databaseName // ⭐ 핵심
    }

    // 4) MySQL 문법 검증
    if (config.dbType === 'MySQL') {
      try {
        const conn = await mysql.createConnection(connectionConfig)
        try {
          await conn.query(`EXPLAIN ${query}`)
          return { valid: true }
        } catch (e) {
          const err = e as Error
          return { valid: false, type: 'syntax', error: err.message }
        } finally {
          await conn.end()
        }
      } catch (e) {
        const err = e as Error
        return { valid: false, type: 'connection', error: err.message }
      }
    }

    // 5) PostgreSQL 문법 검증
    try {
      const client = new PGClient(connectionConfig)
      await client.connect()

      try {
        await client.query(`PREPARE stmt AS ${query}`)
        return { valid: true }
      } catch (e) {
        const err = e as Error
        return { valid: false, type: 'syntax', error: err.message }
      } finally {
        await client.end()
      }
    } catch (e) {
      const err = e as Error
      return { valid: false, type: 'connection', error: err.message }
    }
  }
)
