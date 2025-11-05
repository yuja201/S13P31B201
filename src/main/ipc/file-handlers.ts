import { ipcMain } from 'electron'
import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { getFileCacheRoot } from '../utils/cache-path'
const STREAM_TIMEOUT_MS = 5 * 60 * 1000

type ActiveStream = {
  stream: fs.WriteStream
  timeout: NodeJS.Timeout
  filePath: string
}

const activeStreams = new Map<string, ActiveStream>()

const ensureCacheDir = async (): Promise<string> => {
  const dir = getFileCacheRoot()
  await fsPromises.mkdir(dir, { recursive: true })
  return dir
}

interface CacheWritePayload {
  content: string
  encoding?: BufferEncoding
  extension?: string
}

interface CacheRemovePayload {
  filePath: string
}

interface StreamOpenPayload {
  extension?: string
}

interface StreamWritePayload {
  streamId: string
  chunk: number[] | Uint8Array
}

interface StreamClosePayload {
  streamId: string
}

ipcMain.handle('file:cache:write', async (_event, payload: CacheWritePayload) => {
  if (!payload || typeof payload.content !== 'string') {
    throw new Error('파일 캐시 쓰기 요청이 올바르지 않습니다.')
  }

  const encoding: BufferEncoding = payload.encoding ?? 'utf8'
  const ext = sanitizeExtension(payload.extension)

  const dir = await ensureCacheDir()
  const fileName = `${Date.now()}-${randomUUID()}${ext}`
  const filePath = path.join(dir, fileName)

  await fsPromises.writeFile(filePath, payload.content, { encoding })

  return { filePath }
})

ipcMain.handle('file:cache:stream-open', async (_event, payload: StreamOpenPayload = {}) => {
  const dir = await ensureCacheDir()
  const ext = sanitizeExtension(payload.extension)

  const streamId = randomUUID()
  const fileName = `${Date.now()}-${streamId}${ext}`
  const filePath = path.join(dir, fileName)

  const stream = fs.createWriteStream(filePath)
  const timeout = setTimeout(() => {
    console.warn(`[file-cache] stream ${streamId} timed out, closing automatically`)
    stream.destroy()
    activeStreams.delete(streamId)
    void fsPromises.unlink(filePath).catch(() => {})
  }, STREAM_TIMEOUT_MS)
  activeStreams.set(streamId, { stream, timeout, filePath })

  return { streamId, filePath }
})

ipcMain.handle('file:cache:stream-write', async (_event, payload: StreamWritePayload) => {
  const { streamId, chunk } = payload ?? {}
  if (!streamId || !chunk) throw new Error('스트림 쓰기 요청이 올바르지 않습니다.')

  const streamInfo = activeStreams.get(streamId)
  if (!streamInfo) throw new Error(`활성 스트림을 찾을 수 없습니다. (${streamId})`)

  const buffer = Buffer.isBuffer(chunk)
    ? chunk
    : Array.isArray(chunk)
      ? Buffer.from(chunk)
      : Buffer.from(chunk as Uint8Array)

  await new Promise<void>((resolve, reject) => {
    streamInfo.stream.write(buffer, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })

  if (typeof streamInfo.timeout.refresh === 'function') {
    streamInfo.timeout.refresh()
  }

  return { ok: true }
})

ipcMain.handle('file:cache:stream-close', async (_event, payload: StreamClosePayload) => {
  const { streamId } = payload ?? {}
  if (!streamId) return false

  const streamInfo = activeStreams.get(streamId)
  if (!streamInfo) return false

  clearTimeout(streamInfo.timeout)

  try {
    await new Promise<void>((resolve, reject) => {
      streamInfo.stream.end((err) => {
        if (err) reject(err)
        else resolve()
      })
    })
    return true
  } finally {
    activeStreams.delete(streamId)
  }
})

ipcMain.handle('file:cache:remove', async (_event, payload: CacheRemovePayload) => {
  if (!payload || typeof payload.filePath !== 'string') return false

  const dir = await ensureCacheDir()
  const normalizedTarget = ensurePathWithinDir(payload.filePath, dir)

  try {
    await fsPromises.unlink(normalizedTarget)
    return true
  } catch {
    return false
  }
})

function sanitizeExtension(extension?: string): string {
  if (!extension) return ''
  const trimmed = extension.trim().toLowerCase()
  if (!trimmed) return ''
  if (!trimmed.startsWith('.')) return `.${trimmed}`
  return trimmed
}

function ensurePathWithinDir(targetPath: string, baseDir: string): string {
  const resolvedTarget = path.resolve(targetPath)
  const resolvedBase = path.resolve(baseDir)
  const baseWithSep = resolvedBase.endsWith(path.sep) ? resolvedBase : `${resolvedBase}${path.sep}`

  const compareTarget = process.platform === 'win32' ? resolvedTarget.toLowerCase() : resolvedTarget
  const compareBase = process.platform === 'win32' ? baseWithSep.toLowerCase() : baseWithSep

  if (!compareTarget.startsWith(compareBase)) {
    throw new Error('허용되지 않은 경로 삭제 시도입니다.')
  }

  return resolvedTarget
}
