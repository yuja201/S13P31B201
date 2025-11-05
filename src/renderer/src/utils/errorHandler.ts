import { NavigateFunction } from 'react-router-dom'

/**
 * API 호출을 래핑하여 에러 발생 시 자동으로 에러 페이지로 이동
 */
export const handleApiError = async <T>(
  apiCall: () => Promise<T>,
  navigate: NavigateFunction,
  showErrorPage = true
): Promise<T | null> => {
  try {
    return await apiCall()
  } catch (error) {
    console.error('API Error:', error)
    if (showErrorPage) {
      navigate('/error')
    }
    return null
  }
}

/**
 * try catch 블록을 간단하게 만들어주는 헬퍼 함수
 */
export const safeAsync = async <T>(fn: () => Promise<T>, fallback?: T): Promise<T | undefined> => {
  try {
    return await fn()
  } catch (error) {
    console.error('Error:', error)
    return fallback
  }
}
