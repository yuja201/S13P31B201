/**
 * Unix timestamp를 상대 시간 형식으로 변환합니다.
 * @param timestamp Unix timestamp (초 단위)
 * @returns 상대 시간 문자열 (예: "방금 전", "5분 전", "3시간 전", "2일 전", "5개월 전", "2년 전")
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp

  const MINUTE = 60
  const HOUR = 3600
  const DAY = 86400
  const MONTH = 2592000 // 30일 기준
  const YEAR = 31536000 // 365일 기준

  if (diff < MINUTE) return '방금 전'
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}분 전`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간 전`
  if (diff < MONTH) return `${Math.floor(diff / DAY)}일 전`
  if (diff < YEAR) return `${Math.floor(diff / MONTH)}개월 전`
  return `${Math.floor(diff / YEAR)}년 전`
}
