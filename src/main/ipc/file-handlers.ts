import { app, ipcMain } from 'electron'
import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

const CACHE_DIR_NAME = 'heresdummy-file-cache'

const activeStreams = new Map<string, fs.WriteStream>()

const ensureCacheDir = async (): Promise<string> => {
  const dir = path.join(app.getPath('temp'), CACHE_DIR_NAME)
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
  activeStreams.set(streamId, stream)

  return { streamId, filePath }
})

ipcMain.handle('file:cache:stream-write', async (_event, payload: StreamWritePayload) => {
  const { streamId, chunk } = payload ?? {}
  if (!streamId || !chunk) throw new Error('잘못된 스트림 쓰기 요청입니다.')

  const stream = activeStreams.get(streamId)
  if (!stream) throw new Error(`활성 스트림을 찾을 수 없습니다. (${streamId})`)

  const buffer = Buffer.isBuffer(chunk)
    ? chunk
    : Array.isArray(chunk)
      ? Buffer.from(chunk)
      : Buffer.from(chunk as Uint8Array)

  await new Promise<void>((resolve, reject) => {
    stream.write(buffer, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })

  return { ok: true }
})

ipcMain.handle('file:cache:stream-close', async (_event, payload: StreamClosePayload) => {
  const { streamId } = payload ?? {}
  if (!streamId) return false

  const stream = activeStreams.get(streamId)
  if (!stream) return false

  await new Promise<void>((resolve, reject) => {
    stream.end((err) => {
      if (err) reject(err)
      else resolve()
    })
  })

  activeStreams.delete(streamId)
  return true
})

ipcMain.handle('file:cache:remove', async (_event, payload: CacheRemovePayload) => {
  if (!payload || typeof payload.filePath !== 'string') return false

  const dir = await ensureCacheDir()
  const normalizedTarget = path.normalize(payload.filePath)

  if (!normalizedTarget.startsWith(dir)) {
    throw new Error('허용되지 않은 경로 삭제 시도입니다.')
  }

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
