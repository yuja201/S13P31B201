import { create } from 'zustand'
import type { RuleResult } from '@renderer/modals/rule/RuleModal'

export type DataSourceType = 'FAKER' | 'AI' | 'FILE' | 'MANUAL' | 'REFERENCE'

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

export type ReferenceMetaData = {
  kind: 'reference'
  refTable: string
  refColumn: string
}

export type ColumnMetaData =
  | FakerMetaData
  | AIMetaData
  | FileMetaData
  | ManualMetaData
  | ReferenceMetaData

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
  setColumnRule: (tableName: string, columnName: string, rule: RuleResult) => void
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
  setColumnRule: (tableName, columnName, rule) => {
    let dataSource: DataSourceType
    let metaData: ColumnMetaData

    if (rule.generation === '고정값' || rule.generation === 'ENUM') {
      dataSource = 'MANUAL'
      metaData = { kind: 'manual', fixedValue: rule.setting }
    } else if (rule.generation === 'Faker.js') {
      const ruleId = Number(rule.setting)
      if (!Number.isInteger(ruleId)) {
        console.warn(`유효하지 않은 Faker rule id: ${rule.setting}`)
        return
      }
      dataSource = 'FAKER'
      metaData = { kind: 'faker', ruleId }
    } else if (rule.generation === 'AI') {
      const ruleId = Number(rule.setting)
      if (!Number.isInteger(ruleId)) {
        console.warn(`유효하지 않은 Faker rule id: ${rule.setting}`)
        return
      }
      dataSource = 'AI'
      metaData = { kind: 'ai', ruleId }
    } else if (rule.generation === '참조') {
      dataSource = 'REFERENCE'
      const [refTable, refColumn] = rule.setting.split('.')
      if (!refTable || !refColumn) {
        console.warn(`유효하지 않은 참조(FK) 설정: ${rule.setting}`)
        return
      }
      metaData = {
        kind: 'reference',
        refTable: refTable,
        refColumn: refColumn
      }
    } else {
      console.warn(`Unknown generation type: ${rule.generation}`)
      return
    }
    // 새 ColumnConfig 생성
    const newColumnConfig: ColumnConfig = {
      columnName: columnName,
      dataSource: dataSource,
      metaData: metaData
    }

    // 스토어 상태 업데이트
    set((state) => {
      const existingTable = state.tables[tableName] || {
        tableName,
        recordCnt: 1000, // 기본값
        columns: {}
      }

      return {
        tables: {
          ...state.tables,
          [tableName]: {
            ...existingTable,
            columns: {
              ...existingTable.columns,
              [columnName]: newColumnConfig // [!] 이 컬럼의 규칙을 덮어쓰기
            }
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
