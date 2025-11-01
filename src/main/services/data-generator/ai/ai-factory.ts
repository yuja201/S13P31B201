import { AIGateway } from './ai-client'
import { OpenAIAdapter } from './openai-adapter'
import { AnthropicAdapter } from './anthropic-adapter'
import { GoogleAdapter } from './google-adapter'

export type AIVendor = 'openai' | 'anthropic' | 'google'

/**
 * AI Gateway 팩토리
 * 환경변수에서 설정을 자동으로 로드하여 어댑터 생성
 */
export function createAIGateway(vendor: AIVendor): AIGateway {
  switch (vendor) {
    case 'anthropic':
      return new AnthropicAdapter()
    case 'google':
      return new GoogleAdapter()
    case 'openai':
    default:
      return new OpenAIAdapter()
  }
}
