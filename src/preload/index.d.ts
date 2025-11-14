import { FakerRuleInput, AIRuleInput, GenerationResult } from '@shared/types'
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
  DatabaseSchema,
  DomainCategory,
  IndexAnalysisSummary,
  Test,
  TestInput
} from '../main/database/types'
import type { GenerateRequest, GenerationResult } from '@shared/types'

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
    updateUpdatedAt: (id: number) => Promise<Project | undefined>
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
    createFaker: (data: FakerRuleInput) => Promise<Rule>
    createAI: (data: AIRuleInput) => Promise<Rule>
    getByLogicalType: (logicalType: string) => Promise<Rule[]>
  }
  test: {
    create: (data: TestInput) => Promise<Test>
    getAll: () => Promise<Test[]>
    getById: (id: number) => Promise<Test | undefined>
    getDashboardData: () => Promise<DashboardData>
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
    }) => Promise<{ sample: unknown }>
    validateFkValue: (params: {
      databaseId: number
      table: string
      column: string
      value: unknown
    }) => Promise<{ isValid: boolean }>
    validateCheckConstraint: (args: {
      value: string
      checkConstraint: string
      columnName: string
    }) => Promise<boolean>
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
    generate: (payload: GenerateRequest) => Promise<GenerationResult>
    onProgress: (callback: (msg: unknown) => void) => void
    removeProgressListeners: () => void
    downloadZip: (zipPath: string) => void
  }
  env: {
    updateApiKey: (key: string, value: string) => Promise<{ success: boolean; error?: string }>
    load: () => Promise<Record<string, string>>
    getPath: () => Promise<string>
    openFolder: () => Promise<void>
  }
  logger: {
    debug: (...args: unknown[]) => void
    info: (...args: unknown[]) => void
    warn: (...args: unknown[]) => void
    error: (...args: unknown[]) => void
    verbose: (...args: unknown[]) => void
  }
  domain: {
    getAll: () => Promise<DomainCategory[]>
    getByLogicalType: (logicalType: string) => Promise<DomainCategory[]>
  }

  tests: {
    getById: (id: number) => Promise<Test | undefined>
  }

  userQueryTest: {
    run: (payload: {
      projectId: number
      query: string
      runCount: number
      timeout: number
    }) => Promise<{ testId: number }>
  }

  indexTest: {
    analyze: (databaseId: number) => Promise<{
      success: boolean
      data?: IndexAnalysisSummary
      error?: string
    }>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
