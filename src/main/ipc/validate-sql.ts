import { ipcMain } from 'electron'
import mysql from 'mysql2/promise'
import { Client as PGClient } from 'pg'

import { getConnectionConfig } from '../services/user-query-test/get-connection-config'
import { getDatabaseByProjectId } from '../database/databases'

ipcMain.handle(
  'validate-sql',
  async (
    _,
    payload: { projectId: number; query: string }
  ): Promise<{ valid: boolean; type?: string; error?: string }> => {
    const { projectId, query } = payload

    // 1) 프로젝트에 연결된 DB 정보 조회
    const dbInfo = getDatabaseByProjectId(projectId)
    if (!dbInfo) {
      return {
        valid: false,
        type: 'connection',
        error: '프로젝트에 연결된 데이터베이스가 없습니다.'
      }
    }

    const databaseName = dbInfo.database_name

    // 2) 기본 DB 접속 정보 불러오기
    let config
    try {
      config = await getConnectionConfig(projectId)
    } catch (e) {
      const err = e as Error
      return { valid: false, type: 'connection', error: err.message }
    }

    // 3) DB 이름 포함해서 최종 연결 구성
    const finalConfig = {
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: databaseName
    }

    // ============================
    //     MySQL 문법 검증
    // ============================
    if (config.dbType === 'MySQL') {
      try {
        const conn = await mysql.createConnection(finalConfig)
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

    // ============================
    //   PostgreSQL 문법 검증
    // ============================
    try {
      const client = new PGClient(finalConfig)
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
