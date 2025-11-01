export interface AIModelInfo {
  id: number
  vendor: 'openai' | 'anthropic' | 'google'
  model: string
  displayName: string
}

export const AI_MODELS: AIModelInfo[] = [
  { id: 1, vendor: 'openai', model: 'gpt-4.1-mini', displayName: 'GPT-4.1 Mini' },
  {
    id: 2,
    vendor: 'anthropic',
    model: 'claude-3-5-haiku-latest',
    displayName: 'Claude 3.5 Haiku'
  },
  { id: 3, vendor: 'google', model: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash' }
]

export function resolveModel(modelId?: number | null): {
  vendor: 'openai' | 'anthropic' | 'google'
  model: string
} {
  const found = AI_MODELS.find((m) => m.id === modelId)
  return found
    ? { vendor: found.vendor, model: found.model }
    : { vendor: 'openai', model: 'gpt-4.1-mini' }
}
