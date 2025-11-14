import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import log from 'electron-log/renderer'
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
  DatabaseSchema,
  DomainCategory
} from '../main/database/types'

import { FakerRuleInput, AIRuleInput, GenerateRequest, GenerationResult } from '@shared/types'

// Custom APIs for renderer
const api = {
  // DBMS operations
  dbms: {
    getAll: (): Promise<DBMS[]> => ipcRenderer.invoke('db:dbms:getAll'),
    getById: (id: number): Promise<DBMS | undefined> => ipcRenderer.invoke('db:dbms:getById', id),
    create: (data: DBMSInput): Promise<DBMS> => ipcRenderer.invoke('db:dbms:create', data),
    update: (data: DBMSUpdate): Promise<DBMS | undefined> =>
      ipcRenderer.invoke('db:dbms:update', data),
    delete: (id: number): Promise<boolean> => ipcRenderer.invoke('db:dbms:delete', id)
  },

  // Project operations
  project: {
    getAll: (): Promise<Project[]> => ipcRenderer.invoke('db:project:getAll'),
    getById: (id: number): Promise<Project | undefined> =>
      ipcRenderer.invoke('db:project:getById', id),
    create: (data: ProjectInput): Promise<Project> => ipcRenderer.invoke('db:project:create', data),
    update: (data: ProjectUpdate): Promise<Project | undefined> =>
      ipcRenderer.invoke('db:project:update', data),
    delete: (id: number): Promise<boolean> => ipcRenderer.invoke('db:project:delete', id),
    updateUpdatedAt: (id: number): Promise<Project | undefined> =>
      ipcRenderer.invoke('db:project:updateUpdatedAt', id)
  },

  // Database operations
  database: {
    getAll: (): Promise<Database[]> => ipcRenderer.invoke('db:database:getAll'),
    getById: (id: number): Promise<Database | undefined> =>
      ipcRenderer.invoke('db:database:getById', id),
    getByProjectId: (projectId: number): Promise<Database[]> =>
      ipcRenderer.invoke('db:database:getByProjectId', projectId),
    create: (data: DatabaseInput): Promise<Database> =>
      ipcRenderer.invoke('db:database:create', data),
    update: (data: DatabaseUpdate): Promise<Database | undefined> =>
      ipcRenderer.invoke('db:database:update', data),
    delete: (id: number): Promise<boolean> => ipcRenderer.invoke('db:database:delete', id),
    updateConnectedAt: (id: number): Promise<Database | undefined> =>
      ipcRenderer.invoke('db:database:updateConnectedAt', id)
  },

  // Rule operations
  rule: {
    getAll: (): Promise<Rule[]> => ipcRenderer.invoke('db:rule:getAll'),
    getById: (id: number): Promise<Rule | undefined> => ipcRenderer.invoke('db:rule:getById', id),
    getByDomain: (domain: string): Promise<Rule[]> =>
      ipcRenderer.invoke('db:rule:getByDomain', domain),
    create: (data: RuleInput): Promise<Rule> => ipcRenderer.invoke('db:rule:create', data),
    update: (data: RuleUpdate): Promise<Rule | undefined> =>
      ipcRenderer.invoke('db:rule:update', data),
    delete: (id: number): Promise<boolean> => ipcRenderer.invoke('db:rule:delete', id),
    createFaker: (data: FakerRuleInput): Promise<Rule> =>
      ipcRenderer.invoke('db:rule:createFaker', data),
    createAI: (data: AIRuleInput): Promise<Rule> => ipcRenderer.invoke('db:rule:createAI', data),
    getByLogicalType: (logicalType: string) =>
      ipcRenderer.invoke('db:rule:getByLogicalType', logicalType)
  },

  // Database connection test
  testConnection: (config: {
    dbType: 'MySQL' | 'PostgreSQL'
    host: string
    port: number
    username: string
    password: string
    database?: string
  }): Promise<{
    success: boolean
    message: string
    details?: {
      serverVersion?: string
      connectionTime?: number
    }
  }> => ipcRenderer.invoke('db:connection:test', config),

  // Schema operations
  schema: {
    fetch: (databaseId: number): Promise<DatabaseSchema> =>
      ipcRenderer.invoke('db:schema:fetch', databaseId),

    getRandomSample: (params: {
      databaseId: number
      table: string
      column: string
    }): Promise<{ sample: unknown }> => ipcRenderer.invoke('db:get-random-sample', params),

    // FK
    validateFkValue: (params: {
      databaseId: number
      table: string
      column: string
      value: unknown
    }): Promise<{ isValid: boolean }> => ipcRenderer.invoke('db:validate-fk-value', params),

    // CHECK
    validateCheckConstraint: (args: {
      value: string
      checkConstraint: string
      columnName: string
    }): Promise<boolean> => ipcRenderer.invoke('schema:validate-check-constraint', args)
  },

  file: {
    cache: {
      write: (payload: { content: string; encoding?: string; extension?: string }) =>
        ipcRenderer.invoke('file:cache:write', payload),
      remove: (filePath: string) => ipcRenderer.invoke('file:cache:remove', { filePath }),
      stream: {
        open: (payload: { extension?: string }) =>
          ipcRenderer.invoke('file:cache:stream-open', payload),
        write: (payload: { streamId: string; chunk: number[] | Uint8Array }) =>
          ipcRenderer.invoke('file:cache:stream-write', payload),
        close: (payload: { streamId: string }) =>
          ipcRenderer.invoke('file:cache:stream-close', payload)
      }
    }
  },

  // dataGenerator operations
  dataGenerator: {
    generate: (payload: GenerateRequest): Promise<GenerationResult> =>
      ipcRenderer.invoke('gen:dummy:bulk', payload),
    onProgress: (callback: (msg: unknown) => void) => {
      ipcRenderer.on('data-generator:progress', (_, msg) => {
        callback(msg)
      })
    },
    removeProgressListeners: () => {
      ipcRenderer.removeAllListeners('data-generator:progress')
    },
    downloadZip: (zipPath: string) => {
      ipcRenderer.invoke('gen:dummy:download', zipPath)
    }
  },
  env: {
    updateApiKey: (key: string, value: string) =>
      ipcRenderer.invoke('env:update-api-key', { key, value }),
    load: () => ipcRenderer.invoke('env:load'),
    getPath: () => ipcRenderer.invoke('env:get-path'),
    openFolder: () => ipcRenderer.invoke('env:open-folder')
  },
  logger: {
    debug: (...args: unknown[]) => log.debug(...args),
    info: (...args: unknown[]) => log.info(...args),
    warn: (...args: unknown[]) => log.warn(...args),
    error: (...args: unknown[]) => log.error(...args),
    verbose: (...args: unknown[]) => log.verbose(...args)
  },
  domain: {
    getAll: (): Promise<DomainCategory[]> => ipcRenderer.invoke('domain:getAll'),
    getByLogicalType: (logicalType: string): Promise<DomainCategory[]> =>
      ipcRenderer.invoke('domain:getByLogicalType', logicalType)
  },

  // Index test operations
  indexTest: {
    analyze: (databaseId: number) => ipcRenderer.invoke('index:analyze', databaseId)
  },

  // test crud operations
  test: {
    getDashboardData: () => ipcRenderer.invoke('tests:get-dashboard-data')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('env', {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || null,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || null,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || null
    })
  } catch (error) {
    log.error('Failed to set up contextBridge:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
