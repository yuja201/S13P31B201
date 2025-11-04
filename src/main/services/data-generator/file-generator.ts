import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { FileMetaData } from './types'

type ParsedFile =
  | {
      kind: 'tabular'
      headers: string[]
      rows: string[][]
    }
  | {
      kind: 'json'
      headers: string[]
      rows: Record<string, unknown>[]
    }

type ParseCacheKey = string

const CACHE_DIR_NAME = 'heresdummy-file-cache'
const CACHE_DIR_ENV_KEY = 'HERESDUMMY_CACHE_DIR'
const parseCache = new Map<ParseCacheKey, Promise<ParsedFile>>()

export function createFileValueStream(
  meta: FileMetaData,
  recordCnt: number
): AsyncGenerator<string> {
  return (async function* generator() {
    const parsed = await parseFile(meta)

    for (let rowIndex = 0; rowIndex < recordCnt; rowIndex++) {
      const value = extractValue(parsed, meta, rowIndex)
      if (value === undefined) {
        throw new Error(
          `[파일 데이터 부족] ${meta.filePath}에서 ${rowIndex + 1}번째 행을 읽을 수 없습니다.`
        )
      }
      yield formatValue(value)
    }
  })()
}

async function parseFile(meta: FileMetaData): Promise<ParsedFile> {
  const safeFilePath = resolveCacheFilePath(meta.filePath)
  const normalizedMeta = safeFilePath === meta.filePath ? meta : { ...meta, filePath: safeFilePath }

  const cacheKey = buildCacheKey(normalizedMeta)
  const cached = parseCache.get(cacheKey)
  if (cached) return cached

  const parsePromise =
    normalizedMeta.fileType === 'json'
      ? parseJson(normalizedMeta)
      : parseDelimited(
          normalizedMeta,
          normalizedMeta.fileType === 'csv'
            ? ','
            : resolveSeparator(normalizedMeta.columnSeparator, '\t')
        )

  parseCache.set(cacheKey, parsePromise)
  try {
    return await parsePromise
  } catch (error) {
    parseCache.delete(cacheKey)
    throw error
  }
}

async function parseJson(meta: FileMetaData): Promise<ParsedFile> {
  const encoding = resolveEncoding(meta.encoding)
  const content = await fs.readFile(meta.filePath, { encoding })

  let data: unknown
  try {
    data = JSON.parse(content)
  } catch (error) {
    throw new Error(`[JSON 파싱 오류] ${meta.filePath}: ${(error as Error).message}`)
  }

  if (!Array.isArray(data)) {
    throw new Error(`[JSON 형식 오류] ${meta.filePath}: 최상위가 배열이어야 합니다.`)
  }

  const rows: Record<string, unknown>[] = []
  const headerSet = new Set<string>()

  data.forEach((item, index) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const row = item as Record<string, unknown>
      rows.push(row)
      Object.keys(row).forEach((key) => headerSet.add(key))
    } else {
      throw new Error(
        `[JSON 구조 오류] ${meta.filePath}: ${index + 1}번째 요소가 객체 형태가 아닙니다.`
      )
    }
  })

  const headers = dedupeHeaders(Array.from(headerSet))

  return {
    kind: 'json',
    headers,
    rows
  }
}

async function parseDelimited(meta: FileMetaData, columnSeparator: string): Promise<ParsedFile> {
  const encoding = resolveEncoding(meta.encoding)
  const lineSeparator = resolveSeparator(meta.lineSeparator, '\n')

  const content = await fs.readFile(meta.filePath, { encoding })
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const rawLines = lineSeparator === '\n' ? normalized.split('\n') : normalized.split(lineSeparator)

  const matrix: string[][] = rawLines
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .map((line) => line.split(columnSeparator).map((value) => value.trim()))

  if (!matrix.length) {
    throw new Error(`[파일 데이터 없음] ${meta.filePath}에서 데이터를 찾지 못했습니다.`)
  }

  const [headers, dataRows] = extractMatrix(matrix, meta.useHeaderRow)

  return {
    kind: 'tabular',
    headers,
    rows: dataRows
  }
}

function extractMatrix(matrix: string[][], useHeaderRow: boolean): [string[], string[][]] {
  if (useHeaderRow && matrix.length > 0) {
    const headerRow = matrix[0]
    return [
      dedupeHeaders(headerRow.map((header, idx) => header || `col${idx + 1}`)),
      matrix.slice(1)
    ]
  }

  const maxLength = matrix.reduce((max, row) => Math.max(max, row.length), 0)
  const headers = dedupeHeaders(Array.from({ length: maxLength }, (_, idx) => `col${idx + 1}`))
  return [headers, matrix]
}

function extractValue(parsed: ParsedFile, meta: FileMetaData, rowIndex: number): unknown {
  if (parsed.kind === 'tabular') {
    const row = parsed.rows[rowIndex]
    if (!row) return undefined

    const columnIndex = resolveColumnIndex(parsed.headers, meta)
    return row[columnIndex]
  }

  const row = parsed.rows[rowIndex]
  if (!row) return undefined

  const key = resolveJsonKey(parsed.headers, meta)
  return row[key]
}

function resolveColumnIndex(headers: string[], meta: FileMetaData): number {
  if (typeof meta.columnIndex === 'number' && meta.columnIndex >= 0) {
    return meta.columnIndex
  }

  const index = headers.findIndex((header) => header === meta.fileColumn)
  if (index === -1) {
    throw new Error(
      `[컬럼 매핑 오류] ${meta.filePath}: "${meta.fileColumn}" 컬럼을 찾지 못했습니다.`
    )
  }
  return index
}

function resolveJsonKey(headers: string[], meta: FileMetaData): string {
  if (headers.includes(meta.fileColumn)) {
    return meta.fileColumn
  }

  if (typeof meta.columnIndex === 'number' && headers[meta.columnIndex]) {
    return headers[meta.columnIndex]
  }

  throw new Error(
    `[JSON 컬럼 매핑 오류] ${meta.filePath}: "${meta.fileColumn}" 속성을 찾지 못했습니다.`
  )
}

function dedupeHeaders(headers: string[]): string[] {
  const counter = new Map<string, number>()
  return headers.map((header, idx) => {
    const base = header && header.trim() ? header.trim() : `col${idx + 1}`
    const count = counter.get(base) ?? 0
    counter.set(base, count + 1)
    if (count === 0) return base
    return `${base}_${count + 1}`
  })
}

function buildCacheKey(meta: FileMetaData): ParseCacheKey {
  return [
    path.resolve(meta.filePath),
    meta.fileType,
    meta.useHeaderRow ? '1' : '0',
    meta.lineSeparator ?? '',
    meta.columnSeparator ?? '',
    resolveEncoding(meta.encoding)
  ].join('|')
}

function resolveCacheFilePath(filePath: string): string {
  const resolvedTarget = path.resolve(filePath)
  const envDir = process.env[CACHE_DIR_ENV_KEY]
  const cacheDir = envDir ? path.resolve(envDir) : path.resolve(os.tmpdir(), CACHE_DIR_NAME)
  const cacheDirWithSep = cacheDir.endsWith(path.sep) ? cacheDir : `${cacheDir}${path.sep}`

  const targetCompare = process.platform === 'win32' ? resolvedTarget.toLowerCase() : resolvedTarget
  const dirCompare = process.platform === 'win32' ? cacheDirWithSep.toLowerCase() : cacheDirWithSep

  if (!targetCompare.startsWith(dirCompare)) {
    throw new Error('[보안 오류] 허용되지 않은 파일 경로입니다.')
  }

  return resolvedTarget
}

function resolveSeparator(value: string | undefined, fallback: string): string {
  if (!value) return fallback
  if (value === '\\n') return '\n'
  if (value === '\\t') return '\t'
  return value
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function resolveEncoding(encoding?: string): BufferEncoding {
  if (!encoding) return 'utf8'
  const normalized = encoding.toLowerCase()
  switch (normalized) {
    case 'utf8':
    case 'utf-8':
      return 'utf8'
    case 'latin1':
      return 'latin1'
    case 'ascii':
      return 'ascii'
    case 'ucs2':
    case 'ucs-2':
      return 'ucs2'
    case 'utf16le':
    case 'utf-16le':
      return 'utf16le'
    default:
      return normalized as BufferEncoding
  }
}
