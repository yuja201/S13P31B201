import { create } from 'zustand'
import type { Rule } from '@main/database/types'

interface RuleState {
  rules: Rule[]
  isLoading: boolean
  error: string | null
  fetchRules: () => Promise<void>
  addRule: (newRule: Rule) => void
  getRuleById: (id: number) => Rule | undefined
}

export const useRuleStore = create<RuleState>((set, get) => ({
  rules: [],
  isLoading: false,
  error: null,

  fetchRules: async () => {
    // Avoid refetching if rules are already loaded
    if (get().rules.length > 0) {
      return
    }
    set({ isLoading: true, error: null })
    try {
      const rules = await window.api.rule.getAll()
      set({ rules, isLoading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch rules'
      set({ error: errorMessage, isLoading: false })
    }
  },

  addRule: (newRule: Rule) => {
    set((state) => ({
      rules: [...state.rules, newRule]
    }))
  },

  getRuleById: (id: number) => {
    return get().rules.find((rule) => rule.id === id)
  }
}))
