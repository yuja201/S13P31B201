import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
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
  RuleUpdate
} from '../main/database/types'

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
    delete: (id: number): Promise<boolean> => ipcRenderer.invoke('db:project:delete', id)
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
    delete: (id: number): Promise<boolean> => ipcRenderer.invoke('db:rule:delete', id)
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
  }> => ipcRenderer.invoke('db:connection:test', config)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
