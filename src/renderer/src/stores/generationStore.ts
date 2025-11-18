import { create } from 'zustand'
import { RuleSelection } from '@renderer/modals/rule/RuleSelectContent'

export type DataSourceType = 'FAKER' | 'AI' | 'FILE' | 'FIXED' | 'REFERENCE' | 'DEFAULT'

export type FileMetaData = {
  kind: 'file'
  filePath: string
  fileType: 'csv' | 'json' | 'txt'
  fileColumn: string
  useHeaderRow: boolean
  columnIndex?: number
  lineSeparator?: string
  columnSeparator?: string
  encoding?: string
}

export type FakerMetaData = {
  kind: 'faker'
  ruleId: number
  ensureUnique?: boolean
}

export type AIMetaData = {
  kind: 'ai'
  ruleId: number
  ensureUnique?: boolean
}

export type FixedMetaData = {
  kind: 'fixed'
  fixedValue: string
}

export type ReferenceMetaData = {
  kind: 'reference'
  refTable: string
  refColumn: string
  ensureUnique?: boolean
  previewValue?: string | number
  fixedValue?: string
  refColCount?: number | null
}

export type DefaultMetaData = {
  kind: 'default'
  fixedValue: string
}

export type ColumnMetaData =
  | FakerMetaData
  | AIMetaData
  | FileMetaData
  | FixedMetaData
  | ReferenceMetaData
  | DefaultMetaData

export interface ColumnConfig {
  columnName: string
  dataSource: DataSourceType
  metaData: ColumnMetaData
}

export interface TableGenerationConfig {
  tableName: string
  recordCnt: number
  columns: Record<string, ColumnConfig>
}

export interface FileMappingApplyPayload {
  filePath: string
  fileType: 'csv' | 'json' | 'txt'
  encoding: string
  parseOptions: {
    useHeaderRow: boolean
    lineSeparator?: string
    columnSeparator?: string
  }
  mappings: {
    tableColumn: string
    fileColumn: string
    columnIndex: number
  }[]
  recordCount?: number
}

interface GenerationState {
  tables: Record<string, TableGenerationConfig>

  setTableRecordCount: (tableName: string, recordCnt: number) => void
  getTableRecordCount: (tableName: string) => number

  applyFileMapping: (tableName: string, payload: FileMappingApplyPayload) => void
  setColumnRule: (tableName: string, columnName: string, rule: RuleSelection) => void

  selectedTables: Set<string>
  setSelectedTables: (tables: Set<string>) => void
  clearSelectedTables: () => void

  resetTable: (tableName: string) => void
  resetColumnRule: (tableName: string, columnName: string) => void
  clearAll: () => void

  exportRulesForTable: (tableName: string) => {
    tableName: string
    recordCnt: number
    columns: { columnName: string; dataSource: string; metaData: object }[]
  }

  exportAllTables: () => Array<{
    tableName: string
    recordCnt: number
    columns: { columnName: string; dataSource: string; metaData: object }[]
  }>
  reset: () => void
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  tables: {},

  // recordCnt 관리
  setTableRecordCount: (tableName, recordCnt) => {
    set((state) => {
      const existing = state.tables[tableName] ?? {
        tableName,
        recordCnt: 0,
        columns: {}
      }
      return {
        tables: {
          ...state.tables,
          [tableName]: {
            ...existing,
            recordCnt
          }
        }
      }
    })
  },

  getTableRecordCount: (tableName: string) => {
    const table = get().tables[tableName]
    return table?.recordCnt ?? 1000
  },

  selectedTables: new Set(),
  setSelectedTables: (tables) => set({ selectedTables: tables }),
  clearSelectedTables: () => set({ selectedTables: new Set() }),

  // 파일 매핑
  applyFileMapping: (tableName, payload) => {
    set((state) => {
      const existing = state.tables[tableName]
      const baseColumns = { ...(existing?.columns ?? {}) }

      // 이전 FILE 매핑 제거
      Object.keys(baseColumns).forEach((colName) => {
        if (baseColumns[colName].dataSource === 'FILE') {
          delete baseColumns[colName]
        }
      })

      // 새로운 매핑 추가
      payload.mappings.forEach((mapping) => {
        baseColumns[mapping.tableColumn] = {
          columnName: mapping.tableColumn,
          dataSource: 'FILE',
          metaData: {
            kind: 'file',
            filePath: payload.filePath,
            fileType: payload.fileType,
            fileColumn: mapping.fileColumn,
            columnIndex: mapping.columnIndex,
            useHeaderRow: payload.parseOptions.useHeaderRow,
            lineSeparator: payload.parseOptions.lineSeparator,
            columnSeparator: payload.parseOptions.columnSeparator,
            encoding: payload.encoding
          }
        }
      })

      return {
        tables: {
          ...state.tables,
          [tableName]: {
            tableName,
            recordCnt: payload.recordCount ?? existing?.recordCnt ?? 0,
            columns: baseColumns
          }
        }
      }
    })
  },

  // ------------------------
  // 컬럼 규칙 저장
  setColumnRule: (tableName, columnName, rule) => {
    let dataSource: DataSourceType
    let metaData: ColumnMetaData

    switch (rule.dataSource) {
      case 'FAKER': {
        const ruleId = rule.metaData.ruleId ?? Number(rule.metaData.ruleId)
        if (!Number.isInteger(ruleId)) {
          console.warn(`유효하지 않은 Faker rule id: ${rule.metaData.ruleId}`)
          return
        }
        dataSource = 'FAKER'
        metaData = { kind: 'faker', ruleId, ensureUnique: rule.metaData.ensureUnique }
        break
      }

      case 'AI': {
        const ruleId = rule.metaData.ruleId ?? Number(rule.metaData.ruleId)
        if (!Number.isInteger(ruleId)) {
          console.warn(`유효하지 않은 AI rule id: ${rule.metaData.ruleId}`)
          return
        }
        dataSource = 'AI'
        metaData = { kind: 'ai', ruleId, ensureUnique: rule.metaData.ensureUnique }
        break
      }

      case 'FIXED':
      case 'ENUM': {
        const fixedValue = rule.metaData.fixedValue
        if (typeof fixedValue !== 'string') {
          console.warn(`유효하지 않은 고정값: ${fixedValue}`)
          return
        }
        dataSource = 'FIXED'
        metaData = { kind: 'fixed', fixedValue }
        break
      }

      case 'FILE': {
        dataSource = 'FILE'
        metaData = {
          kind: 'file',
          filePath: rule.metaData.filePath ?? '',
          fileType: rule.metaData.fileType ?? 'csv',
          fileColumn: rule.metaData.domainName ?? '',
          useHeaderRow: rule.metaData.useHeaderRow ?? true
        }
        break
      }

      case 'REFERENCE': {
        const refTable = rule.metaData.refTable ?? ''
        const refColumn = rule.metaData.refColumn ?? ''
        if (!refTable || !refColumn) {
          console.warn(`유효하지 않은 참조(FK) 설정: ${rule.metaData}`)
          return
        }
        dataSource = 'REFERENCE'
        metaData = {
          kind: 'reference',
          refTable,
          refColumn,
          ensureUnique: rule.metaData.ensureUnique,
          previewValue: rule.metaData.previewValue,
          fixedValue:
            rule.metaData.fixedValue != null ? String(rule.metaData.fixedValue) : undefined,
          refColCount: rule.metaData.refColCount
        }
        break
      }

      case 'DEFAULT': {
        dataSource = 'DEFAULT'
        metaData = { kind: 'default', fixedValue: String(rule.metaData.fixedValue ?? '') }
        break
      }

      default:
        console.warn(`Unknown dataSource: ${rule.dataSource}`)
        return
    }

    set((state) => {
      const existingTable = state.tables[tableName] || {
        tableName,
        recordCnt: 1000,
        columns: {}
      }

      const newConfig: ColumnConfig = {
        columnName,
        dataSource,
        metaData
      }

      return {
        tables: {
          ...state.tables,
          [tableName]: {
            ...existingTable,
            columns: {
              ...existingTable.columns,
              [columnName]: newConfig
            }
          }
        }
      }
    })
  },

  // ------------------------
  // 초기화
  resetTable: (tableName) =>
    set((state) => {
      const next = { ...state.tables }
      delete next[tableName]
      return { tables: next }
    }),

  resetColumnRule: (tableName, columnName) =>
    set((state) => {
      const tableConfig = state.tables[tableName]
      if (!tableConfig) return state

      const newColumns = { ...tableConfig.columns }
      delete newColumns[columnName]

      return {
        tables: {
          ...state.tables,
          [tableName]: {
            ...tableConfig,
            columns: newColumns
          }
        }
      }
    }),

  clearAll: () => set({ tables: {} }),

  // ------------------------
  // export 기능
  exportRulesForTable: (tableName) => {
    const table = get().tables[tableName]
    if (!table) return { tableName, recordCnt: 1000, columns: [] }

    const columns = Object.values(table.columns).map((col) => ({
      columnName: col.columnName,
      dataSource: col.dataSource,
      metaData: col.metaData
    }))

    return { tableName, recordCnt: table.recordCnt, columns }
  },

  exportAllTables: () => {
    const tables = get().tables
    return Object.keys(tables).map((tableName) => {
      const table = tables[tableName]
      const columns = Object.values(table.columns)
        .filter((col) => col.dataSource !== 'DEFAULT')
        .map((col) => ({
          columnName: col.columnName,
          dataSource: col.dataSource,
          metaData: col.metaData
        }))

      return { tableName, recordCnt: table.recordCnt, columns }
    })
  },
  reset: () => set({ tables: {}, selectedTables: new Set() })
}))
