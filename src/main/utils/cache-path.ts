import { app } from 'electron'
import path from 'node:path'

const CACHE_DIR_NAME = 'heresdummy-file-cache'

export function getFileCacheRoot(): string {
  return path.join(app.getPath('userData'), CACHE_DIR_NAME)
}

export { CACHE_DIR_NAME }
