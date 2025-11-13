import type { Client } from 'pg'

/**
 * PostgreSQL 인덱스 기본 정보, 사용 통계 조회
 */
export async function fetchIndexStatsWithUsage(
  client: Client,
  schemaName: string = 'public'
): Promise<
  Array<{
    schemaname: string
    tablename: string
    indexname: string
    idx_scan: number
    idx_tup_read: number
    idx_tup_fetch: number
    index_size_bytes: number
    index_def: string
  }>
> {
  const result = await client.query(
    `
    SELECT
      s.schemaname,
      s.relname as tablename,
      s.indexrelname as indexname,
      s.idx_scan,
      s.idx_tup_read,
      s.idx_tup_fetch,
      CAST(pg_relation_size(s.indexrelid) AS NUMERIC) as index_size_bytes,
      pg_get_indexdef(s.indexrelid) as index_def
    FROM pg_stat_user_indexes s
    WHERE s.schemaname = $1
    ORDER BY s.relname, s.indexrelname
    `,
    [schemaName]
  )
  return result.rows
}

/**
 * PostgreSQL 인덱스 상세 정보
 */
export async function fetchIndexDetails(
  client: Client,
  schemaName: string = 'public'
): Promise<
  Array<{
    schemaname: string
    tablename: string
    indexname: string
    column_name: string
    column_position: number
    is_unique: boolean
    is_primary: boolean
    index_type: string
  }>
> {
  const result = await client.query(
    `
    SELECT
      n.nspname as schemaname,
      t.relname as tablename,
      i.relname as indexname,
      a.attname as column_name,
      a.attnum as column_position,
      ix.indisunique as is_unique,
      ix.indisprimary as is_primary,
      am.amname as index_type
    FROM pg_index ix
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_am am ON am.oid = i.relam
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE n.nspname = $1
      AND t.relkind = 'r'
    ORDER BY t.relname, i.relname, a.attnum
    `,
    [schemaName]
  )
  return result.rows
}

/**
 * 테이블 통계 정보
 */
export async function fetchTableStats(
  client: Client,
  schemaName: string = 'public'
): Promise<
  Array<{
    schemaname: string
    tablename: string
    n_live_tup: number
    seq_scan: number
    idx_scan: number
    table_size_bytes: number
  }>
> {
  const result = await client.query(
    `
    SELECT
      schemaname,
      relname as tablename,
      n_live_tup,
      seq_scan,
      idx_scan,
      CAST(pg_total_relation_size(relid) AS NUMERIC) as table_size_bytes
    FROM pg_stat_user_tables
    WHERE schemaname = $1
    `,
    [schemaName]
  )
  return result.rows
}

/**
 * 외래키 정보
 */
export async function fetchForeignKeys(
  client: Client,
  schemaName: string = 'public'
): Promise<
  Array<{
    schemaname: string
    tablename: string
    column_name: string
    constraint_name: string
    referenced_table: string
    referenced_column: string
    ordinal_position: number
  }>
> {
  const result = await client.query(
    `
    SELECT DISTINCT ON (c.conname, a.attname)
      n.nspname as schemaname,
      t.relname as tablename,
      a.attname as column_name,
      c.conname as constraint_name,
      rt.relname as referenced_table,
      ra.attname as referenced_column,
      array_position(c.conkey, a.attnum) as ordinal_position
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class rt ON rt.oid = c.confrelid
    JOIN pg_attribute ra ON ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)
    WHERE c.contype = 'f'
      AND n.nspname = $1
    ORDER BY c.conname, a.attname, ordinal_position
    `,
    [schemaName]
  )
  return result.rows
}

/**
 * 컬럼 타입 정보
 */
export async function fetchColumnTypes(
  client: Client,
  schemaName: string = 'public'
): Promise<
  Array<{
    schemaname: string
    tablename: string
    column_name: string
    data_type: string
    udt_name: string
  }>
> {
  const result = await client.query(
    `
    SELECT
      table_schema as schemaname,
      table_name as tablename,
      column_name,
      data_type,
      udt_name
    FROM information_schema.columns
    WHERE table_schema = $1
    `,
    [schemaName]
  )
  return result.rows
}

/**
 * 컬럼별 카디널리티 정보
 */
export async function fetchColumnStats(
  client: Client,
  schemaName: string = 'public'
): Promise<
  Array<{
    schemaname: string
    tablename: string
    column_name: string
    n_distinct: number
  }>
> {
  const result = await client.query(
    `
    SELECT
      schemaname,
      tablename,
      attname as column_name,
      n_distinct
    FROM pg_stats
    WHERE schemaname = $1
      AND n_distinct IS NOT NULL
    `,
    [schemaName]
  )
  return result.rows
}
