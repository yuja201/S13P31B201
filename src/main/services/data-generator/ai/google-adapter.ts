import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { AIGateway, AIRequest, AIResponse } from './ai-client'
import { getGoogleConfig } from './ai-config'

export class GoogleAdapter implements AIGateway {
  private readonly client: GoogleGenerativeAI

  constructor() {
    const config = getGoogleConfig()

    this.client = new GoogleGenerativeAI(config.apiKey)
  }

  public async generate(request: AIRequest): Promise<AIResponse> {
    const { model, prompt, temperature = 0.3, schema } = request
    const config = getGoogleConfig()

    const generativeModel: GenerativeModel = this.client.getGenerativeModel(
      { model },
      {
        baseUrl: config.baseURL,
        timeout: config.timeout
      }
    )

    const finalPrompt = schema
      ? `${prompt}\n\n응답은 반드시 유효한 JSON 형식이어야 합니다.`
      : prompt

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
      generationConfig: {
        temperature,
        responseMimeType: schema ? 'application/json' : 'text/plain'
      }
    })

    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

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
