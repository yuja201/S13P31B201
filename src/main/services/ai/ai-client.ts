export interface AIRequest {
  model: string
  prompt: string
  temperature?: number
  schema?: Record<string, unknown> // JSON Schema
}

export interface AIResponse {
  text: string
  json?: unknown
}

export interface AIGateway {
  generate(request: AIRequest): Promise<AIResponse>
}
