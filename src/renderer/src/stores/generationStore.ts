import { create } from 'zustand'

export type DataSourceType = 'FAKER' | 'AI' | 'FILE' | 'MANUAL'

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

export type ManualMetaData = {
  kind: 'manual'
  fixedValue: string
}

export type ColumnMetaData = FakerMetaData | AIMetaData | FileMetaData | ManualMetaData

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
  applyFileMapping: (tableName: string, payload: FileMappingApplyPayload) => void
  resetTable: (tableName: string) => void
}

export const useGenerationStore = create<GenerationState>((set) => ({
  tables: {},

  setTableRecordCount: (tableName: string, recordCnt: number) => {
    set((state) => {
      const existing = state.tables[tableName]
      return {
        tables: {
          ...state.tables,
          [tableName]: {
            tableName,
            recordCnt,
            columns: existing?.columns ?? {}
          }
        }
      }
    })
  },

  applyFileMapping: (tableName: string, payload: FileMappingApplyPayload) => {
    set((state) => {
      const existing = state.tables[tableName]
      const baseColumns = { ...(existing?.columns ?? {}) }

      // remove previous FILE mappings for this table before applying new ones
      Object.keys(baseColumns).forEach((colName) => {
        if (baseColumns[colName].dataSource === 'FILE') {
          delete baseColumns[colName]
        }
      })

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

  resetTable: (tableName: string) => {
    set((state) => {
      const nextTables = { ...state.tables }
      delete nextTables[tableName]
      return { tables: nextTables }
    })
  }
}))
