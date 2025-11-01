import Anthropic from '@anthropic-ai/sdk'
import { AIGateway, AIRequest, AIResponse } from './ai-client'
import { getAnthropicConfig } from './ai-config'

export class AnthropicAdapter implements AIGateway {
  private readonly client: Anthropic

  constructor() {
    const config = getAnthropicConfig()

    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: config.timeout,
      maxRetries: config.maxRetries
    })
  }

  public async generate(request: AIRequest): Promise<AIResponse> {
    const { model, prompt, temperature = 0.3 } = request

    const resp = await this.client.messages.create({
      model,
      temperature,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = resp.content?.[0]?.type === 'text' ? resp.content[0].text : ''
    return { text, json: this.tryParseJson(text) }
  }

  private tryParseJson(text: string): unknown {
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  }
}
