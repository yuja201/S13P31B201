import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  DBMS,
  DBMSInput,
  DBMSUpdate,
  Project,
  ProjectInput,
  ProjectUpdate,
  Database,
  DatabaseInput,
  DatabaseUpdate,
  Rule,
  RuleInput,
  RuleUpdate,
  DatabaseSchema
} from '../main/database/types'

interface API {
  dbms: {
    getAll: () => Promise<DBMS[]>
    getById: (id: number) => Promise<DBMS | undefined>
    create: (data: DBMSInput) => Promise<DBMS>
    update: (data: DBMSUpdate) => Promise<DBMS | undefined>
    delete: (id: number) => Promise<boolean>
  }
  project: {
    getAll: () => Promise<Project[]>
    getById: (id: number) => Promise<Project | undefined>
    create: (data: ProjectInput) => Promise<Project>
    update: (data: ProjectUpdate) => Promise<Project | undefined>
    delete: (id: number) => Promise<boolean>
  }
  database: {
    getAll: () => Promise<Database[]>
    getById: (id: number) => Promise<Database | undefined>
    getByProjectId: (projectId: number) => Promise<Database[]>
    create: (data: DatabaseInput) => Promise<Database>
    update: (data: DatabaseUpdate) => Promise<Database | undefined>
    delete: (id: number) => Promise<boolean>
    updateConnectedAt: (id: number) => Promise<Database | undefined>
  }
  rule: {
    getAll: () => Promise<Rule[]>
    getById: (id: number) => Promise<Rule | undefined>
    getByDomain: (domain: string) => Promise<Rule[]>
    create: (data: RuleInput) => Promise<Rule>
    update: (data: RuleUpdate) => Promise<Rule | undefined>
    delete: (id: number) => Promise<boolean>
  }
  testConnection: (config: {
    dbType: 'MySQL' | 'PostgreSQL'
    host: string
    port: number
    username: string
    password: string
    database?: string
  }) => Promise<{
    success: boolean
    message: string
    details?: {
      serverVersion?: string
      connectionTime?: number
    }
  }>
  schema: {
    fetch: (databaseId: number) => Promise<DatabaseSchema>

    getRandomSample: (params: {
      databaseId: number
      table: string
      column: string
    }) => Promise<{ sample: any }>

    validateFkValue: (params: {
      databaseId: number
      table: string
      column: string
      value: any
    }) => Promise<{ isValid: boolean }>
  }

  file: {
    cache: {
      write: (payload: { content: string; encoding?: string; extension?: string }) => Promise<{
        filePath: string
      }>
      remove: (filePath: string) => Promise<boolean>
      stream: {
        open: (payload: { extension?: string }) => Promise<{ streamId: string; filePath: string }>
        write: (payload: {
          streamId: string
          chunk: number[] | Uint8Array
        }) => Promise<{ ok: true }>
        close: (payload: { streamId: string }) => Promise<boolean>
      }
    }
  }
  dataGenerator: {
    generate: (payload: unknown) => Promise<unknown>
    onProgress: (callback: (msg: unknown) => void) => void
    removeProgressListeners: () => void
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
