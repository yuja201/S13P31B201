/**
 * AI 서비스 설정
 * 환경변수에서 API 키와 엔드포인트를 로드
 */

export interface AIVendorConfig {
  apiKey: string
  baseURL?: string
  timeout: number
  maxRetries: number
}

/**
 * OpenAI 설정
 */
export function getOpenAIConfig(): AIVendorConfig {
  const apiKey = process.env.OPENAI_API_KEY ?? ''

  if (!apiKey) {
    console.warn('[OpenAI] API key가 설정되지 않았습니다. OPENAI_API_KEY 환경변수를 확인하세요.')
  }

  return {
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    timeout: parseInt(process.env.OPENAI_TIMEOUT || '60000', 10),
    maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '2', 10)
  }
}

/**
 * Anthropic 설정
 */
export function getAnthropicConfig(): AIVendorConfig {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? ''

  if (!apiKey) {
    console.warn(
      '[Anthropic] API key가 설정되지 않았습니다. ANTHROPIC_API_KEY 환경변수를 확인하세요.'
    )
  }

  return {
    apiKey,
    baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
    timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || '60000', 10),
    maxRetries: parseInt(process.env.ANTHROPIC_MAX_RETRIES || '2', 10)
  }
}

/**
 * Google 설정
 */
export function getGoogleConfig(): AIVendorConfig {
  const apiKey = process.env.GOOGLE_API_KEY ?? ''

  if (!apiKey) {
    console.warn('[Google] API key가 설정되지 않았습니다. GOOGLE_API_KEY 환경변수를 확인하세요.')
  }

  return {
    apiKey,
    baseURL: process.env.GOOGLE_BASE_URL || 'https://generativelanguage.googleapis.com',
    timeout: parseInt(process.env.GOOGLE_TIMEOUT || '60000', 10),
    maxRetries: parseInt(process.env.GOOGLE_MAX_RETRIES || '2', 10)
  }
}

/**
 * 벤더별 설정 가져오기
 */
export function getAIConfig(vendor: 'openai' | 'anthropic' | 'google'): AIVendorConfig {
  switch (vendor) {
    case 'openai':
      return getOpenAIConfig()
    case 'anthropic':
      return getAnthropicConfig()
    case 'google':
      return getGoogleConfig()
    default:
      throw new Error(`Unknown AI vendor: ${vendor}`)
  }
}
