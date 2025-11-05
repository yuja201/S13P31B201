import OpenAI from 'openai'
import { AIGateway, AIRequest, AIResponse } from './ai-client'
import { getOpenAIConfig } from './ai-config'

export class OpenAIAdapter implements AIGateway {
  private readonly client: OpenAI

  constructor() {
    const config = getOpenAIConfig()

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: config.timeout,
      maxRetries: config.maxRetries
    })
  }

  public async generate(request: AIRequest): Promise<AIResponse> {
    const { model, prompt, schema, temperature = 0.3 } = request

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: 'user', content: prompt }]

    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      model,
      messages,
      temperature,
      max_tokens: 4096
    }

    if (schema) {
      params.response_format = {
        type: 'json_schema',
        json_schema: {
          name: 'data_generation',
          strict: true,
          schema
        }
      }
    }

    const resp = await this.client.chat.completions.create(params)
    const text = resp.choices[0]?.message?.content ?? ''

    return {
      text,
      json: this.tryParseJson(text)
    }
  }

  private tryParseJson(text: string): unknown {
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  }
}
