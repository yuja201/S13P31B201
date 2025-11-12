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

interface MySQLColumnRowExtended extends MySQLColumnRow {
  maxLength: number | null
  numericPrecision: number | null
  numericScale: number | null
  checkConstraint?: string | null
}

// PostgreSQL
interface PostgreSQLTableRow {
  name: string
  schema: string
  comment: string | null
  column_count: number
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

      const [countRows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``)
      const rowCount = (countRows as { count: number }[])[0]?.count ?? tableRow.rowCount ?? 0

      const columns = await fetchMySQLColumns(connection, databaseName, tableName)
      const foreignKeys = await fetchMySQLForeignKeys(connection, databaseName, tableName)
      const indexes = await fetchMySQLIndexes(connection, databaseName, tableName)

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
      c.COLUMN_NAME as name,
      c.COLUMN_TYPE as type,
      c.COLUMN_COMMENT as comment,
      c.IS_NULLABLE as isNullable,
      c.COLUMN_KEY as columnKey,
      c.COLUMN_DEFAULT as defaultValue,
      c.EXTRA as extra,
      c.CHARACTER_MAXIMUM_LENGTH as maxLength,
      c.NUMERIC_PRECISION as numericPrecision,
      c.NUMERIC_SCALE as numericScale,

      /* --- CHECK 제약조건 조회 --- */
      (SELECT cc.CHECK_CLAUSE
       FROM information_schema.TABLE_CONSTRAINTS tc
       JOIN information_schema.CHECK_CONSTRAINTS cc 
         ON tc.CONSTRAINT_SCHEMA = cc.CONSTRAINT_SCHEMA
         AND tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
       WHERE tc.TABLE_SCHEMA = c.TABLE_SCHEMA
         AND tc.TABLE_NAME = c.TABLE_NAME 
         AND tc.CONSTRAINT_TYPE = 'CHECK'
         AND cc.CHECK_CLAUSE LIKE CONCAT('%', c.COLUMN_NAME, '%')
       LIMIT 1) AS checkConstraint

    FROM INFORMATION_SCHEMA.COLUMNS c
    WHERE c.TABLE_SCHEMA = ? AND c.TABLE_NAME = ?
    ORDER BY c.ORDINAL_POSITION`,
    [databaseName, tableName]
  )

  return (columnRows as MySQLColumnRowExtended[]).map((row) => {
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
      check: row.checkConstraint || undefined,
      maxLength: row.maxLength ?? undefined,
      numericPrecision: row.numericPrecision ?? undefined,
      numericScale: row.numericScale ?? undefined
    }

    // MySQL 숫자 타입별 min/max 값 설정
    const typeLower = row.type.toLowerCase()
    const isUnsigned = typeLower.includes('unsigned')

    if (typeLower.startsWith('tinyint')) {
      column.minValue = isUnsigned ? 0 : -128
      column.maxValue = isUnsigned ? 255 : 127
    } else if (typeLower.startsWith('smallint')) {
      column.minValue = isUnsigned ? 0 : -32768
      column.maxValue = isUnsigned ? 65535 : 32767
    } else if (typeLower.startsWith('mediumint')) {
      column.minValue = isUnsigned ? 0 : -8388608
      column.maxValue = isUnsigned ? 16777215 : 8388607
    } else if (typeLower.startsWith('int')) {
      column.minValue = isUnsigned ? 0 : -2147483648
      column.maxValue = isUnsigned ? 4294967295 : 2147483647
    } else if (typeLower.startsWith('bigint')) {
      // JS의 안전한 정수 범위를 초과할 수 있으므로, 우선 Number.MAX_SAFE_INTEGER를 사용
      column.minValue = isUnsigned ? 0 : -9007199254740991
      column.maxValue = 9007199254740991
    }

    // ENUM 타입 파싱 (UI에서 enum 사용 중이면 유지)
    if (row.type.startsWith('enum(')) {
      const enumMatch = row.type.match(/enum\((.*)\)/)
      if (enumMatch) {
        column.enum = enumMatch[1].split(',').map((v) => v.trim().replace(/^'|'$/g, ''))
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
     t.table_name AS name,
     t.table_schema AS schema,
     obj_description((quote_ident(t.table_schema)||'.'||quote_ident(t.table_name))::regclass) AS comment,
     (SELECT COUNT(*) FROM information_schema.columns c
       WHERE c.table_name = t.table_name AND c.table_schema = t.table_schema) AS column_count
   FROM information_schema.tables t
   WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
   ORDER BY t.table_name`
    )

    for (const tableRow of tableResult.rows as PostgreSQLTableRow[]) {
      const tableName = tableRow.name
      const tableSchema = tableRow.schema

      let rowCount = 0
      try {
        const countResult = await client.query(
          `SELECT COUNT(*) AS count FROM "${tableSchema}"."${tableName}"`
        )
        rowCount = parseInt(countResult.rows[0].count)
      } catch (error) {
        console.warn(`Failed to get row count for table ${tableSchema}.${tableName}:`, error)
      }

      const columns = await fetchPostgreSQLColumns(client, tableName, tableSchema)
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
async function fetchPostgreSQLColumns(
  client: Client,
  tableName: string,
  tableSchema: string
): Promise<Column[]> {
  const columnResult = await client.query(
    `
    SELECT
      c.column_name AS name,
      c.data_type,
      c.character_maximum_length,
      c.numeric_precision,
      c.numeric_scale,
      c.udt_name,
      c.udt_schema,
      c.is_nullable,
      c.column_default,
      col_description((quote_ident(c.table_schema)||'.'||quote_ident(c.table_name))::regclass, c.ordinal_position) AS comment,

      -- PRIMARY KEY 감지
      EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema    = kcu.table_schema
       WHERE tc.table_schema = c.table_schema
         AND tc.table_name   = c.table_name
         AND kcu.column_name = c.column_name
         AND tc.constraint_type = 'PRIMARY KEY'
      ) AS is_primary_key,

      -- UNIQUE 감지
      EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema    = kcu.table_schema
       WHERE tc.table_schema = c.table_schema
         AND tc.table_name   = c.table_name
         AND kcu.column_name = c.column_name
         AND tc.constraint_type = 'UNIQUE'
      ) AS is_unique,

      -- CHECK 제약조건 조회 (NOT NULL 제약조건은 제외)
      (
        SELECT
          CASE
            WHEN cc.check_clause ~* '^[[:space:]]*\\(?[[:space:]]*["'']?\\w+["'']?[[:space:]]+IS[[:space:]]+NOT[[:space:]]+NULL[[:space:]]*\\)?$'  THEN NULL 
            ELSE cc.check_clause
          END
        FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu
          ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_schema = c.table_schema
          AND ccu.table_name = c.table_name
          AND ccu.column_name = c.column_name
        LIMIT 1
      ) AS check_constraint,

      -- ENUM 여부 및 값 목록
      (t.typtype = 'e') AS is_enum,
      (
        SELECT json_agg(e.enumlabel ORDER BY e.enumsortorder)
        FROM pg_enum e
       WHERE e.enumtypid = t.oid
      ) AS enumList

    FROM information_schema.columns c
    LEFT JOIN pg_type t
      ON t.typname = c.udt_name
     AND t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = c.udt_schema)
    WHERE c.table_schema = $1
      AND c.table_name   = $2
    ORDER BY c.ordinal_position
    `,
    [tableSchema, tableName]
  )

  return columnResult.rows.map((row) => {
    const enumValues = row.is_enum && Array.isArray(row.enumlist) ? row.enumlist : null
    const typeLower = row.data_type.toLowerCase()

    const column: Column = {
      name: row.name,
      type: enumValues ? `enum(${enumValues.join(', ')})` : row.data_type,
      enum: enumValues,

      maxLength: row.character_maximum_length ?? undefined,
      numericPrecision: row.numeric_precision ?? undefined,
      numericScale: row.numeric_scale ?? undefined,

      isPrimaryKey: row.is_primary_key,
      isForeignKey: false,
      notNull: row.is_nullable === 'NO',
      unique: row.is_unique,
      autoIncrement: row.column_default?.includes('nextval(') || false,
      default: row.column_default || null,
      check: row.check_constraint || null,
      comment: row.comment || null
    }

    if (/smallint/.test(typeLower)) {
      column.minValue = -32768
      column.maxValue = 32767
    } else if (/integer/.test(typeLower)) {
      column.minValue = -2147483648
      column.maxValue = 2147483647
    } else if (/bigint/.test(typeLower)) {
      column.minValue = -9007199254740991
      column.maxValue = 9007199254740991
    }

    // VARCHAR 계열인데 명시적 길이 제한이 없는 경우: 기본값 255
    if (/character varying|varchar/.test(typeLower) && !column.maxLength) {
      column.maxLength = 255
    }

    // TEXT 타입은 PostgreSQL에서 사실상 무제한이므로 length 제한 안 둠
    if (/text/.test(typeLower)) {
      column.maxLength = undefined
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
