import { getDatabaseByProjectId } from '../../database/databases'
import { getDBMSById } from '../../database/dbms'

export interface ConnectionConfig {
  dbType: 'MySQL' | 'PostgreSQL'
  host: string
  port: number
  username: string
  password: string
  database: string
}

export function getConnectionConfig(projectId: number): ConnectionConfig {
  const database = getDatabaseByProjectId(projectId)
  if (!database) throw new Error(`Database not found for project ${projectId}`)

  const dbms = getDBMSById(database.dbms_id)
  if (!dbms) throw new Error(`DBMS not found: ${database.dbms_id}`)

  let host = ''
  let port = 0

  const full = database.url.match(/^(?:mysql|postgresql):\/\/([^:]+):(\d+)$/)
  if (full) {
    host = full[1]
    port = Number(full[2])
  } else {
    const simple = database.url.match(/^([^:]+):(\d+)$/)
    if (!simple) throw new Error(`Invalid DB URL: ${database.url}`)
    host = simple[1]
    port = Number(simple[2])
  }

  return {
    dbType: dbms.name as 'MySQL' | 'PostgreSQL',
    host,
    port,
    username: database.username,
    password: database.password,
    database: database.database_name
  }
}
