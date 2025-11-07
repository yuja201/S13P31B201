/// <reference types="vite/client" />
declare global {
  interface Window {
    env?: {
      OPENAI_API_KEY?: string | null
      ANTHROPIC_API_KEY?: string | null
      GOOGLE_API_KEY?: string | null
    }
  }
}

export {}
