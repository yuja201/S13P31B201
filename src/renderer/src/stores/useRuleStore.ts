// @renderer/stores/useRuleStore.ts
import { create } from 'zustand'

interface RuleSelection {
  columnName: string
  dataSource: 'FAKER' | 'AI' | 'FILE' | 'FIXED'
  metaData: {
    ruleId?: number
    ruleName?: string
    domainId?: number
    domainName?: string
    filePath?: string
    columnIdx?: number
    fixedValue?: string
  }
}

interface TableConfig {
  tableName: string
  recordCnt: number
  rules: Record<string, RuleSelection>
}

interface RuleStore {
  tables: Record<string, TableConfig>

  // 테이블별 recordCnt 설정
  setTableRecordCnt: (tableName: string, recordCnt: number) => void
  getTableRecordCnt: (tableName: string) => number

  // 룰 설정 (테이블별로 저장)
  setRule: (tableName: string, column: string, rule: RuleSelection) => void
  getRule: (tableName: string, column: string) => RuleSelection | undefined
  getTableRules: (tableName: string) => Record<string, RuleSelection>

  clearRules: () => void
  clearTableRules: (tableName: string) => void

  // 백엔드 전송용 데이터 추출
  exportRulesForTable: (tableName: string) => {
    tableName: string
    recordCnt: number
    columns: { columnName: string; dataSource: string; metaData: object }[]
  }

  // 모든 테이블 정보 추출
  exportAllTables: () => Array<{
    tableName: string
    recordCnt: number
    columns: { columnName: string; dataSource: string; metaData: object }[]
  }>
}

export const useRuleStore = create<RuleStore>((set, get) => ({
  tables: {},

  setTableRecordCnt: (tableName, recordCnt) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [tableName]: {
          ...state.tables[tableName],
          tableName,
          recordCnt,
          rules: state.tables[tableName]?.rules || {}
        }
      }
    })),

  getTableRecordCnt: (tableName) => {
    return get().tables[tableName]?.recordCnt || 1000
  },

  setRule: (tableName, column, rule) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [tableName]: {
          ...state.tables[tableName],
          tableName,
          recordCnt: state.tables[tableName]?.recordCnt || 1000,
          rules: {
            ...(state.tables[tableName]?.rules || {}),
            [column]: rule
          }
        }
      }
    })),

  getRule: (tableName, column) => {
    return get().tables[tableName]?.rules[column]
  },

  getTableRules: (tableName) => {
    return get().tables[tableName]?.rules || {}
  },

  clearRules: () => set({ tables: {} }),

  clearTableRules: (tableName) =>
    set((state) => {
      const newTables = { ...state.tables }
      delete newTables[tableName]
      return { tables: newTables }
    }),

  exportRulesForTable: (tableName) => {
    const table = get().tables[tableName]
    if (!table) {
      return {
        tableName,
        recordCnt: 1000,
        columns: []
      }
    }

    const rules = Object.values(table.rules)
    return {
      tableName,
      recordCnt: table.recordCnt,
      columns: rules.map((r) => ({
        columnName: r.columnName,
        dataSource: r.dataSource,
        metaData: r.metaData
      }))
    }
  },

  exportAllTables: () => {
    const tables = get().tables
    return Object.keys(tables).map((tableName) => {
      const table = tables[tableName]
      const rules = Object.values(table.rules)
      return {
        tableName,
        recordCnt: table.recordCnt,
        columns: rules.map((r) => ({
          columnName: r.columnName,
          dataSource: r.dataSource,
          metaData: r.metaData
        }))
      }
    })
  }
}))
