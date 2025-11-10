import { create } from 'zustand'
import type { DatabaseSchema, Table } from '@main/database/types'

interface SchemaState {
  // 데이터베이스 ID별로 스키마 캐싱
  schemas: Map<number, DatabaseSchema>

  // 로딩 상태
  isLoading: boolean
  error: string | null

  // 스키마 가져오기 (캐시 우선)
  fetchSchema: (databaseId: number) => Promise<DatabaseSchema>

  // 스키마 새로고침 (새로 가져오기)
  refreshSchema: (databaseId: number) => Promise<DatabaseSchema>

  // 특정 데이터베이스 스키마 조회
  getSchema: (databaseId: number) => DatabaseSchema | null

  // 특정 테이블 조회
  getTable: (databaseId: number, tableName: string) => Table | null

  // 에러 초기화
  clearError: () => void

  // 특정 데이터베이스 스키마 삭제
  clearSchema: (databaseId: number) => void

  // 모든 스키마 삭제
  clearAllSchemas: () => void
}

export const useSchemaStore = create<SchemaState>((set, get) => ({
  schemas: new Map(),
  isLoading: false,
  error: null,

  fetchSchema: async (databaseId: number) => {
    const cached = get().schemas.get(databaseId)
    if (cached) {
      return cached
    }

    return get().refreshSchema(databaseId)
  },

  refreshSchema: async (databaseId: number) => {
    set({ isLoading: true, error: null })

    try {
      const schema = await window.api.schema.fetch(databaseId)

      set((state) => {
        const newSchemas = new Map(state.schemas)
        newSchemas.set(databaseId, schema)
        return { schemas: newSchemas, isLoading: false }
      })

      return schema
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch schema'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  getSchema: (databaseId: number) => {
    return get().schemas.get(databaseId) || null
  },

  getTable: (databaseId: number, tableName: string) => {
    const schema = get().schemas.get(databaseId)
    if (!schema) return null

    return schema.tables.find((table) => table.name === tableName) || null
  },

  clearError: () => {
    set({ error: null })
  },

  clearSchema: (databaseId: number) => {
    set((state) => {
      const newSchemas = new Map(state.schemas)
      newSchemas.delete(databaseId)
      return { schemas: newSchemas }
    })
  },

  clearAllSchemas: () => {
    set({ schemas: new Map(), error: null })
  }
}))
