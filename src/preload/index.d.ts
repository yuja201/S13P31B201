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
  RuleUpdate
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
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
