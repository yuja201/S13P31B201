import { useState, useCallback } from 'react'
import type { IndexAnalysisSummary } from '@main/database/types'

interface UseIndexTestReturn {
  isAnalyzing: boolean
  analysisResult: IndexAnalysisSummary | null
  error: string | null
  analyzeIndexes: (databaseId: number) => Promise<void>
  clearResult: () => void
}

export function useIndexTest(): UseIndexTestReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<IndexAnalysisSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeIndexes = useCallback(async (databaseId: number): Promise<void> => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await window.api.indexTest.analyze(databaseId)

      if (response.success && response.data) {
        setAnalysisResult(response.data)
      } else {
        setError(response.error || '인덱스 분석에 실패했습니다.')
        setAnalysisResult(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      setAnalysisResult(null)
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const clearResult = useCallback((): void => {
    setAnalysisResult(null)
    setError(null)
  }, [])

  return {
    isAnalyzing,
    analysisResult,
    error,
    analyzeIndexes,
    clearResult
  }
}
