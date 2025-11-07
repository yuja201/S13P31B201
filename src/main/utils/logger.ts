import log from 'electron-log'
import { app } from 'electron'
import path from 'path'

/**
 * electron-log 설정
 */
function configureLogger(): void {
  const userDataPath = app.getPath('userData')
  const logPath = path.join(userDataPath, 'logs')

  log.transports.file.resolvePathFn = () => path.join(logPath, 'logs.log')
  log.transports.file.level = 'info'
  log.transports.file.maxSize = 10 * 1024 * 1024 // 10MB
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

  // 개발용 콘솔
  log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info'
  log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

  // hook 추가
  log.errorHandler.startCatching({
    showDialog: false,
    onError: (error) => {
      log.error('Uncaught error:', error)
    }
  })
}

/**
 * 네임스페이스 기반 로거 생성
 */
function createLogger(namespace: string): {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  verbose: (...args: unknown[]) => void
} {
  return {
    debug: (...args: unknown[]) => log.debug(`[${namespace}]`, ...args),
    info: (...args: unknown[]) => log.info(`[${namespace}]`, ...args),
    warn: (...args: unknown[]) => log.warn(`[${namespace}]`, ...args),
    error: (...args: unknown[]) => log.error(`[${namespace}]`, ...args),
    verbose: (...args: unknown[]) => log.verbose(`[${namespace}]`, ...args)
  }
}

export { log, configureLogger, createLogger }
