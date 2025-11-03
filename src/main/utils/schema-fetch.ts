import mysql from 'mysql2/promise'
import { Client } from 'pg'
import type { DatabaseSchema, Table, Column, ForeignKey, Index } from '../database/types'
import { getDatabaseByProjectId } from '../database/databases'
import { getDBMSById } from '../database/dbms'

interface DatabaseConfig {
  dbType: 'MySQL' | 'PostgreSQL'
  host: string
  port: number
  username: string
  password: string
  database?: string
}

// MySQL
interface MySQLTableRow {
  name: string
  comment: string | null
  rowCount: number
}

interface MySQLColumnRow {
  name: string
  type: string
  comment: string | null
  isNullable: string
  columnKey: string
  defaultValue: string | null
  extra: string
}

interface MySQLForeignKeyRow {
  column_name: string
  referenced_table: string
  referenced_column: string
  constraint_name: string
  on_delete: string
  on_update: string
}

interface MySQLIndexRow {
  index_name: string
  column_name: string
  non_unique: number
  index_type: string
  seq: number
}

interface MySQLDatabaseRow {
  db: string
}

// PostgreSQL
interface PostgreSQLTableRow {
  name: string
  comment: string | null
  column_count: number
}

interface PostgreSQLColumnRow {
  name: string
  data_type: string
  udt_name: string
  max_length: number | null
  numeric_precision: number | null
  numeric_scale: number | null
  is_nullable: string
  default_value: string | null
  comment: string | null
  is_primary: boolean
  is_foreign: boolean
  is_unique: boolean
}

interface PostgreSQLForeignKeyRow {
  column_name: string
  referenced_table: string
  referenced_column: string
  constraint_name: string
  on_delete: string | null
  on_update: string | null
}

interface PostgreSQLIndexRow {
  index_name: string
  columns: string[]
  is_unique: boolean
  is_primary: boolean
  index_type: string | null
}

/**
 * MySQL 스키마 정보
 */
async function fetchMySQLSchema(config: DatabaseConfig): Promise<DatabaseSchema> {
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database || 'information_schema'
  })

  try {
    const databaseName = config.database || (await getCurrentDatabase(connection))
    const tables: Table[] = []

    // 테이블 목록 조회
    const [tableRows] = await connection.execute(
      `SELECT
        TABLE_NAME as name,
        TABLE_COMMENT as comment,
        TABLE_ROWS as rowCount
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ?
      AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME`,
      [databaseName]
    )

    for (const tableRow of tableRows as MySQLTableRow[]) {
      const tableName = tableRow.name

      const columns = await fetchMySQLColumns(connection, databaseName, tableName)

      const foreignKeys = await fetchMySQLForeignKeys(connection, databaseName, tableName)

      const indexes = await fetchMySQLIndexes(connection, databaseName, tableName)

      tables.push({
        name: tableName,
        rowCount: tableRow.rowCount || 0,
        comment: tableRow.comment || undefined,
        columns,
        foreignKeys,
        indexes
      })
    }

    return {
      tables,
      fetchedAt: Date.now()
    }
  } finally {
    await connection.end()
  }
}

async function getCurrentDatabase(connection: mysql.Connection): Promise<string> {
  const [rows] = await connection.execute('SELECT DATABASE() as db')
  return (rows as MySQLDatabaseRow[])[0].db
}

async function fetchMySQLColumns(
  connection: mysql.Connection,
  databaseName: string,
  tableName: string
): Promise<Column[]> {
  const [columnRows] = await connection.execute(
    `SELECT
      COLUMN_NAME as name,
      COLUMN_TYPE as type,
      COLUMN_COMMENT as comment,
      IS_NULLABLE as isNullable,
      COLUMN_KEY as columnKey,
      COLUMN_DEFAULT as defaultValue,
      EXTRA as extra,

      /* ---  CHECK 제약조건 조회 쿼리 --- */
     (SELECT cc.CHECK_CLAUSE
       FROM information_schema.TABLE_CONSTRAINTS tc
       JOIN information_schema.CHECK_CONSTRAINTS cc 
         ON tc.CONSTRAINT_SCHEMA = cc.CONSTRAINT_SCHEMA
         AND tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
       JOIN information_schema.KEY_COLUMN_USAGE kcu
         ON kcu.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
         AND kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
         AND kcu.TABLE_SCHEMA = tc.TABLE_SCHEMA
         AND kcu.TABLE_NAME = tc.TABLE_NAME
         AND kcu.COLUMN_NAME = c.COLUMN_NAME
       WHERE tc.TABLE_SCHEMA = c.TABLE_SCHEMA
         AND tc.TABLE_NAME = c.TABLE_NAME 
         AND tc.CONSTRAINT_TYPE = 'CHECK'
       LIMIT 1) AS checkConstraint

    FROM INFORMATION_SCHEMA.COLUMNS c
    WHERE c.TABLE_SCHEMA = ? AND c.TABLE_NAME = ?
    ORDER BY c.ORDINAL_POSITION`,
    [databaseName, tableName]
  )

  type MySQLColumnRowWithCheck = MySQLColumnRow & { checkConstraint?: string }

  return (columnRows as MySQLColumnRowWithCheck[]).map((row) => {
    const column: Column = {
      name: row.name,
      type: row.type,
      comment: row.comment || undefined,
      isPrimaryKey: row.columnKey === 'PRI',
      isForeignKey: row.columnKey === 'MUL' || row.columnKey === 'FOR',
      notNull: row.isNullable === 'NO',
      unique: row.columnKey === 'UNI',
      autoIncrement: row.extra.includes('auto_increment'),
      default: row.defaultValue !== null ? String(row.defaultValue) : undefined,
      check: row.checkConstraint || undefined
    }

    // ENUM 타입 파싱
    if (row.type.startsWith('enum(')) {
      const enumMatch = row.type.match(/enum\((.*)\)/)
      if (enumMatch) {
        column.enum = enumMatch[1].split(',').map((v: string) => v.trim().replace(/^'|'$/g, ''))
      }
    }

    return column
  })
}

async function fetchMySQLForeignKeys(
  connection: mysql.Connection,
  databaseName: string,
  tableName: string
): Promise<ForeignKey[]> {
  const [fkRows] = await connection.execute(
    `SELECT
      kcu.COLUMN_NAME as column_name,
      kcu.REFERENCED_TABLE_NAME as referenced_table,
      kcu.REFERENCED_COLUMN_NAME as referenced_column,
      kcu.CONSTRAINT_NAME as constraint_name,
      rc.DELETE_RULE as on_delete,
      rc.UPDATE_RULE as on_update
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
    JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
      ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
      AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
    WHERE kcu.TABLE_SCHEMA = ?
      AND kcu.TABLE_NAME = ?
      AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY kcu.ORDINAL_POSITION`,
    [databaseName, tableName]
  )

  return (fkRows as MySQLForeignKeyRow[]).map((row) => ({
    column_name: row.column_name,
    referenced_table: row.referenced_table,
    referenced_column: row.referenced_column,
    constraint_name: row.constraint_name,
    on_delete: row.on_delete || undefined,
    on_update: row.on_update || undefined
  }))
}

async function fetchMySQLIndexes(
  connection: mysql.Connection,
  databaseName: string,
  tableName: string
): Promise<Index[]> {
  const [indexRows] = await connection.execute(
    `SELECT
      INDEX_NAME as index_name,
      COLUMN_NAME as column_name,
      NON_UNIQUE as non_unique,
      INDEX_TYPE as index_type,
      SEQ_IN_INDEX as seq
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
    ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
    [databaseName, tableName]
  )

  // 인덱스별 그룹화
  const indexMap = new Map<string, Index>()

  for (const row of indexRows as MySQLIndexRow[]) {
    if (!indexMap.has(row.index_name)) {
      indexMap.set(row.index_name, {
        index_name: row.index_name,
        columns: [],
        is_unique: row.non_unique === 0,
        is_primary: row.index_name === 'PRIMARY',
        index_type: row.index_type || undefined
      })
    }

    indexMap.get(row.index_name)!.columns.push(row.column_name)
  }

  return Array.from(indexMap.values())
}

/**
 * PostgreSQL 스키마 정보
 */
async function fetchPostgreSQLSchema(config: DatabaseConfig): Promise<DatabaseSchema> {
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database || 'postgres'
  })

  await client.connect()

  try {
    const tables: Table[] = []

    // 테이블 목록 조회
    const tableResult = await client.query(
      `SELECT
        t.table_name as name,
        obj_description((quote_ident(t.table_schema)||'.'||quote_ident(t.table_name))::regclass) as comment,
        (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = t.table_schema) as column_count
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name`
    )

    for (const tableRow of tableResult.rows as PostgreSQLTableRow[]) {
      const tableName = tableRow.name

      let rowCount = 0
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`)
        rowCount = parseInt(countResult.rows[0].count)
      } catch (error) {
        console.warn(`Failed to get row count for table ${tableName}:`, error)
      }

      const columns = await fetchPostgreSQLColumns(client, tableName)

      const foreignKeys = await fetchPostgreSQLForeignKeys(client, tableName)

      const indexes = await fetchPostgreSQLIndexes(client, tableName)

      tables.push({
        name: tableName,
        rowCount,
        comment: tableRow.comment || undefined,
        columns,
        foreignKeys,
        indexes
      })
    }

    return {
      tables,
      fetchedAt: Date.now()
    }
  } finally {
    await client.end()
  }
}

async function fetchPostgreSQLColumns(client: Client, tableName: string): Promise<Column[]> {
  const columnResult = await client.query(
    `SELECT
      c.column_name as name,
      c.data_type as data_type,
      c.udt_name as udt_name,
      c.character_maximum_length as max_length,
      c.numeric_precision as numeric_precision,
      c.numeric_scale as numeric_scale,
      c.is_nullable as is_nullable,
      c.column_default as default_value,
      col_description((quote_ident(c.table_schema)||'.'||quote_ident(c.table_name))::regclass, c.ordinal_position) as comment,
      (SELECT COUNT(*) > 0 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = c.table_name
          AND kcu.column_name = c.column_name
          AND tc.constraint_type = 'PRIMARY KEY') as is_primary,

      (SELECT COUNT(*) > 0 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = c.table_name
          AND kcu.column_name = c.column_name
          AND tc.constraint_type = 'FOREIGN KEY') as is_foreign,

      (SELECT COUNT(*) > 0 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = c.table_name
          AND kcu.column_name = c.column_name
          AND tc.constraint_type = 'UNIQUE') as is_unique,

      /* --- CHECK 제약조건 조회 쿼리  --- */
      (SELECT substring(pg_get_constraintdef(con.oid) from 'CHECK \\((.*)\\)')
       FROM pg_constraint con
       JOIN pg_class rel ON rel.oid = con.conrelid
       JOIN pg_attribute attr ON attr.attrelid = rel.oid AND attr.attnum = ANY(con.conkey)
       WHERE rel.relname = c.table_name
         AND rel.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = c.table_schema)
         AND con.contype = 'c' -- 'c' for CHECK
         AND attr.attname = c.column_name 
       LIMIT 1) AS checkConstraint,

      /* ---  ENUM 목록 조회 쿼리  --- */
      (SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = c.udt_name) AS enumList
        
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = $1
    ORDER BY c.ordinal_position`,
    [tableName]
  )
  type PgColumnRowWithDetails = PostgreSQLColumnRow & {
    checkConstraint?: string
    enumList?: string[]
  }

  return (columnResult.rows as PgColumnRowWithDetails[]).map((row) => {
    let typeStr = row.data_type
    if (row.max_length) {
      typeStr += `(${row.max_length})`
    } else if (row.numeric_precision) {
      typeStr += `(${row.numeric_precision}${row.numeric_scale ? ',' + row.numeric_scale : ''})`
    }

    const column: Column = {
      name: row.name,
      type: typeStr,
      comment: row.comment || undefined,
      isPrimaryKey: row.is_primary,
      isForeignKey: row.is_foreign,
      notNull: row.is_nullable === 'NO',
      unique: row.is_unique,
      autoIncrement: row.default_value?.includes('nextval') || false,
      default:
        row.default_value && !row.default_value.includes('nextval') ? row.default_value : undefined,

      check: row.checkConstraint || undefined,
      enum: row.enumList || undefined
    }

    return column
  })
}

async function fetchPostgreSQLForeignKeys(
  client: Client,
  tableName: string
): Promise<ForeignKey[]> {
  const fkResult = await client.query(
    `SELECT
      kcu.column_name,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column,
      tc.constraint_name,
      rc.delete_rule as on_delete,
      rc.update_rule as on_update
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = $1
      AND tc.table_schema = 'public'`,
    [tableName]
  )

  return (fkResult.rows as PostgreSQLForeignKeyRow[]).map((row) => ({
    column_name: row.column_name,
    referenced_table: row.referenced_table,
    referenced_column: row.referenced_column,
    constraint_name: row.constraint_name,
    on_delete: row.on_delete || undefined,
    on_update: row.on_update || undefined
  }))
}

async function fetchPostgreSQLIndexes(client: Client, tableName: string): Promise<Index[]> {
  const indexResult = await client.query(
    `SELECT
      i.relname as index_name,
      array_agg(a.attname ORDER BY x.ordinality) as columns,
      ix.indisunique as is_unique,
      ix.indisprimary as is_primary,
      am.amname as index_type
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_am am ON i.relam = am.oid
    CROSS JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS x(attnum, ordinality)
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = x.attnum
    WHERE t.relname = $1
      AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    GROUP BY i.relname, ix.indisunique, ix.indisprimary, am.amname
    ORDER BY i.relname`,
    [tableName]
  )

  return (indexResult.rows as PostgreSQLIndexRow[]).map((row) => ({
    index_name: row.index_name,
    columns: row.columns,
    is_unique: row.is_unique,
    is_primary: row.is_primary,
    index_type: row.index_type || undefined
  }))
}

export async function fetchDatabaseSchema(config: DatabaseConfig): Promise<DatabaseSchema> {
  if (config.dbType === 'MySQL') {
    return await fetchMySQLSchema(config)
  } else if (config.dbType === 'PostgreSQL') {
    return await fetchPostgreSQLSchema(config)
  } else {
    throw new Error(`지원하지 않는 데이터베이스: ${config.dbType}`)
  }
}

/**
 * 프로젝트 ID 기반 스키마 조회 (AI Generator용)
 * - getDatabaseByProjectId, getDBMSById를 사용하여 자동으로 연결 정보 구성
 */
export async function fetchSchema(projectId: number): Promise<Table[]> {
  // 1. Database 정보 조회
  const database = getDatabaseByProjectId(projectId)
  if (!database) {
    throw new Error(`Database not found for project: ${projectId}`)
  }

  // 2. DBMS 정보 조회
  const dbms = getDBMSById(database.dbms_id)
  if (!dbms) {
    throw new Error(`DBMS not found: ${database.dbms_id}`)
  }

  // 3. URL 파싱
  const [host, portStr] = database.url.split(':')
  const port = parseInt(portStr || (dbms.name === 'MySQL' ? '3306' : '5432'), 10)

  // 4. DatabaseConfig 구성
  const config: DatabaseConfig = {
    dbType: dbms.name as 'MySQL' | 'PostgreSQL',
    host,
    port,
    username: database.username,
    password: database.password,
    database: database.database_name
  }

  // 5. 스키마 조회
  const schema = await fetchDatabaseSchema(config)

  return schema.tables
}
