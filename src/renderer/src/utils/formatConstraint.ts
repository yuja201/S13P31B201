export function formatCheckConstraint(constraint: string | undefined): string {
  if (!constraint) return ''

  //  `_utf8mb4` 제거, `\` 제거, `(``)` 괄호/백틱 정리
  const cleanConstraint = constraint
    .replace(/_utf8mb4/g, '')
    .replace(/\\'/g, "'")
    .replace(/`|'/g, '')
    .replace(/^\((.*)\)$/, '$1')

  // "IN" 구문인지 확인
  const inRegex = /in\s*\(([^)]+)\)/i
  const match = cleanConstraint.match(inRegex)

  if (match && match[1]) {
    // "IN" 구문인 경우: 값 목록만 추출
    const values = match[1].split(',').map((v) => v.trim())
    return `${values.join(', ')}`
  } else {
    // "IN"이 아닌 "조건" 구문인 경우
    return `${cleanConstraint} `
  }
}
