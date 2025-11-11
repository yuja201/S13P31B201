import { ipcMain } from 'electron'
import * as dbmsOps from '../database/dbms'
import * as projectOps from '../database/projects'
import * as databaseOps from '../database/databases'
import * as ruleOps from '../database/rules'
import { testDatabaseConnection, ConnectionConfig } from '../utils/db-connection-test'
import { fetchDatabaseSchema } from '../utils/schema-fetch'
import { fetchRandomSample, checkFkValueExists } from '../utils/db-query'
import Database from 'better-sqlite3'

/**
 * SQLite Database
 */

// DBMS operations
ipcMain.handle('db:dbms:getAll', () => {
  return dbmsOps.getAllDBMS()
})

ipcMain.handle('db:dbms:getById', (_, id: number) => {
  return dbmsOps.getDBMSById(id)
})

ipcMain.handle('db:dbms:create', (_, data) => {
  return dbmsOps.createDBMS(data)
})

ipcMain.handle('db:dbms:update', (_, data) => {
  return dbmsOps.updateDBMS(data)
})

ipcMain.handle('db:dbms:delete', (_, id: number) => {
  return dbmsOps.deleteDBMS(id)
})

// Project operations
ipcMain.handle('db:project:getAll', () => {
  return projectOps.getAllProjects()
})

ipcMain.handle('db:project:getById', (_, id: number) => {
  return projectOps.getProjectById(id)
})

ipcMain.handle('db:project:create', (_, data) => {
  return projectOps.createProject(data)
})

ipcMain.handle('db:project:update', (_, data) => {
  return projectOps.updateProject(data)
})

ipcMain.handle('db:project:delete', (_, id: number) => {
  return projectOps.deleteProject(id)
})

ipcMain.handle('db:project:updateUpdatedAt', (_, id: number) => {
  return projectOps.updateProjectUpdatedAt(id)
})

// Database operations
ipcMain.handle('db:database:getAll', () => {
  return databaseOps.getAllDatabases()
})

ipcMain.handle('db:database:getById', (_, id: number) => {
  return databaseOps.getDatabaseById(id)
})

ipcMain.handle('db:database:getByProjectId', (_, projectId: number) => {
  return databaseOps.getDatabasesByProjectId(projectId)
})

ipcMain.handle('db:database:create', (_, data) => {
  return databaseOps.createDatabase(data)
})

ipcMain.handle('db:database:update', (_, data) => {
  return databaseOps.updateDatabase(data)
})

ipcMain.handle('db:database:delete', (_, id: number) => {
  return databaseOps.deleteDatabase(id)
})

ipcMain.handle('db:database:updateConnectedAt', (_, id: number) => {
  return databaseOps.updateDatabaseConnectedAt(id)
})

// Rule operations
ipcMain.handle('db:rule:getAll', () => {
  return ruleOps.getAllRules()
})

ipcMain.handle('db:rule:getById', (_, id: number) => {
  return ruleOps.getRuleById(id)
})

ipcMain.handle('db:rule:getByDomain', (_, domain: number) => {
  return ruleOps.getRulesByDomain(domain)
})

ipcMain.handle('db:rule:create', (_, data) => {
  return ruleOps.createRule(data)
})

ipcMain.handle('db:rule:update', (_, data) => {
  return ruleOps.updateRule(data)
})

ipcMain.handle('db:rule:delete', (_, id: number) => {
  return ruleOps.deleteRule(id)
})

/**
 * MySQL/PostgreSQL Database
 */

const getConnectionConfig = (databaseId: number): ConnectionConfig => {
  const database = databaseOps.getDatabaseById(databaseId)
  if (!database) {
    throw new Error(`Database with id ${databaseId} not found`)
  }

  const dbms = dbmsOps.getDBMSById(database.dbms_id)
  if (!dbms) {
    throw new Error(`DBMS with id ${database.dbms_id} not found`)
  }

  const [host, port] = database.url.split(':')

  return {
    dbType: dbms.name as 'MySQL' | 'PostgreSQL',
    host,
    port: parseInt(port),
    username: database.username,
    password: database.password,
    database: database.database_name
  }
}

// Database connection test
ipcMain.handle('db:connection:test', async (_, config: ConnectionConfig) => {
  return testDatabaseConnection(config)
})

ipcMain.handle('db:schema:fetch', (_, databaseId: number) => {
  const config = getConnectionConfig(databaseId)
  return fetchDatabaseSchema(config)
})

// 무작위 샘플링 핸들러
ipcMain.handle(
  'db:get-random-sample',
  async (
    _event,
    { databaseId, table, column }: { databaseId: number; table: string; column: string }
  ) => {
    try {
      const config = getConnectionConfig(databaseId)
      return await fetchRandomSample(config, table, column)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '샘플링 중 오류 발생'
      console.error('[IPC Error] db:get-random-sample:', errorMessage)
      throw new Error(errorMessage)
    }
  }
)

//  FK 값 검증 핸들러
ipcMain.handle(
  'db:validate-fk-value',
  async (
    _event,
    {
      databaseId,
      table,
      column,
      value
    }: { databaseId: number; table: string; column: string; value: string }
  ) => {
    try {
      const config = getConnectionConfig(databaseId)
      return await checkFkValueExists(config, table, column, value)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '검증 중 오류 발생'
      console.error('[IPC Error] db:validate-fk-value:', errorMessage)

      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(errorMessage)
      }
      return { isValid: false }
    }
  }
)

// CHECK 제약조건 유효성 검사 핸들러
ipcMain.handle(
  'schema:validate-check-constraint',
  async (
    _event,
    args: { value: string; checkConstraint: string; columnName: string }
  ): Promise<boolean> => {
    const { value, checkConstraint, columnName } = args
    if (!checkConstraint) return true

    const cleanedConstraint = checkConstraint
      .trim()
      .replace(/^\(|\)$/g, '')
      .replace(/_utf8mb4/g, '')
      .replace(/\\'/g, "'")
      .replace(/`/g, '')

    // 1. 컬럼명을 SQLite 파라미터 '?'로 변경
    const expression = cleanedConstraint.replace(new RegExp(`\\b${columnName}\\b`, 'g'), '?')

    // 2. 이 연산이 문자열 비교(IN, LIKE)인지 추론
    const isStringOperation = /IN\s*\(|LIKE/i.test(cleanedConstraint)

    let bindingValue: string | number | null = value // DB에 바인딩할 최종 값

    if (isStringOperation) {
      // 3. 문자열 연산(IN, LIKE)이면 'value'를 그대로 사용
      bindingValue = value
    } else {
      // 4. 숫자 연산(>=, <=, != 등)일 경우
      if (value.trim().toUpperCase() === 'NULL') {
        bindingValue = null // 'NULL' 문자열은 실제 null로 변환
      } else {
        const numericValue = Number(value)

        if (isNaN(numericValue) || value.trim() === '') {
          // 5. [버그 1 수정] 'abc' 또는 ''(공백)은 NaN이므로, 즉시 false 반환
          console.error(`Check validation: '${value}' is not a valid number.`)
          return false
        }

        // 6. [버그 2 수정] '-1' (문자열)을 -1 (숫자)로 변환
        bindingValue = numericValue
      }
    }

    // 7. DB 실행
    const db = new Database(':memory:')
    try {
      // 8. 준비된 bindingValue (숫자 -1 또는 문자열 'PG')를 get()에 전달
      const result = db.prepare(`SELECT (${expression}) as isValid`).get(bindingValue)
      return (result as { isValid: number }).isValid === 1
    } catch (error) {
      console.error('Check constraint validation error:', error)
      return false
    } finally {
      db.close()
    }
  }
)
