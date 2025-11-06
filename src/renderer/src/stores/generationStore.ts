// @renderer/stores/generationStore.ts
import { create } from 'zustand'
import { RuleSelection } from '@renderer/modals/rule/RuleSelectContent'

export type DataSourceType = 'FAKER' | 'AI' | 'FILE' | 'FIXED'

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
}

export type AIMetaData = {
  kind: 'ai'
  ruleId: number
}

export type FixedMetaData = {
  kind: 'fixed'
  fixedValue: string
}

export type ColumnMetaData = FakerMetaData | AIMetaData | FileMetaData | FixedMetaData

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
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  tables: {},

  // ------------------------
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

  // ------------------------
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
      case 'FAKER':
        dataSource = 'FAKER'
        metaData = { kind: 'faker', ruleId: rule.metaData.ruleId! }
        break
      case 'AI':
        dataSource = 'AI'
        metaData = { kind: 'ai', ruleId: rule.metaData.ruleId! }
        break
      case 'FIXED':
      case 'ENUM':
        dataSource = 'FIXED'
        metaData = { kind: 'fixed', fixedValue: rule.metaData.fixedValue! }
        break
      case 'FILE':
        dataSource = 'FILE'
        metaData = {
          kind: 'file',
          filePath: rule.metaData.filePath ?? '',
          fileType: 'csv',
          fileColumn: rule.metaData.domainName ?? '',
          useHeaderRow: true
        }
        break
      default:
        console.warn(`Unknown dataSource: ${rule.dataSource}`)
        return
    }

    // DB/백엔드와 바로 연동 가능한 형태로 저장
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
      const columns = Object.values(table.columns).map((col) => ({
        columnName: col.columnName,
        dataSource: col.dataSource,
        metaData: col.metaData
      }))
      return { tableName, recordCnt: table.recordCnt, columns }
    })
  }
}))
