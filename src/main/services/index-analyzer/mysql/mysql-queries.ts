import type { Connection } from 'mysql2/promise'

/**
 * MySQL 인덱스 기본 정보 조회
 */
export async function fetchIndexBasicInfo(
  connection: Connection,
  databaseName: string
): Promise<
  Array<{
    table_name: string
    index_name: string
    column_name: string
    seq_in_index: number
    non_unique: number
    index_type: string
    cardinality: number | null
  }>
> {
  const [rows] = await connection.query(
    `
    SELECT
      TABLE_NAME as table_name,
      INDEX_NAME as index_name,
      COLUMN_NAME as column_name,
      SEQ_IN_INDEX as seq_in_index,
      NON_UNIQUE as non_unique,
      INDEX_TYPE as index_type,
      CARDINALITY as cardinality
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = ?
    ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `,
    [databaseName]
  )
  return rows as Array<{
    table_name: string
    index_name: string
    column_name: string
    seq_in_index: number
    non_unique: number
    index_type: string
    cardinality: number | null
  }>
}

/**
 * 테이블 통계 정보 조회
 */
export async function fetchTableStats(
  connection: Connection,
  databaseName: string
): Promise<
  Array<{
    table_name: string
    table_rows: number
    data_length: number
    index_length: number
  }>
> {
  const [rows] = await connection.query(
    `
    SELECT
      TABLE_NAME as table_name,
      TABLE_ROWS as table_rows,
      DATA_LENGTH as data_length,
      INDEX_LENGTH as index_length
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ?
      AND TABLE_TYPE = 'BASE TABLE'
    `,
    [databaseName]
  )
  return rows as Array<{
    table_name: string
    table_rows: number
    data_length: number
    index_length: number
  }>
}

/**
 * 외래키 정보 조회
 */
export async function fetchForeignKeys(
  connection: Connection,
  databaseName: string
): Promise<
  Array<{
    table_name: string
    column_name: string
    constraint_name: string
    referenced_table_name: string
    referenced_column_name: string
  }>
> {
  const [rows] = await connection.query(
    `
    SELECT
      TABLE_NAME as table_name,
      COLUMN_NAME as column_name,
      CONSTRAINT_NAME as constraint_name,
      REFERENCED_TABLE_NAME as referenced_table_name,
      REFERENCED_COLUMN_NAME as referenced_column_name
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = ?
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `,
    [databaseName]
  )
  return rows as Array<{
    table_name: string
    column_name: string
    constraint_name: string
    referenced_table_name: string
    referenced_column_name: string
  }>
}

/**
 * 컬럼 타입 정보 조회
 */
export async function fetchColumnTypes(
  connection: Connection,
  databaseName: string
): Promise<
  Array<{
    table_name: string
    column_name: string
    data_type: string
    column_type: string
  }>
> {
  const [rows] = await connection.query(
    `
    SELECT
      TABLE_NAME as table_name,
      COLUMN_NAME as column_name,
      DATA_TYPE as data_type,
      COLUMN_TYPE as column_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ?
    `,
    [databaseName]
  )
  return rows as Array<{
    table_name: string
    column_name: string
    data_type: string
    column_type: string
  }>
}
