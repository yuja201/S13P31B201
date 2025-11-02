export const DBMS_MAP = {
  mysql: {
    id: 1,
    name: 'MySQL',
    quote: '`',
    driver: 'mysql2/promise'
  },
  postgres: {
    id: 2,
    name: 'PostgreSQL',
    quote: '"',
    driver: 'pg'
  }
} as const

export type SupportedDBMS = keyof typeof DBMS_MAP

export const DBMS_ID_TO_KEY: Record<number, SupportedDBMS> = {
  1: 'mysql',
  2: 'postgres'
}
