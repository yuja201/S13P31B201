import type { LogFunctions } from 'electron-log'

// Define a common logger interface that matches the core functions
interface ILogger extends Pick<LogFunctions, 'debug' | 'info' | 'warn' | 'error' | 'verbose'> {}

// Check if we are in a plain Node.js process (like a worker)
const isWorker = typeof process.type === 'undefined'

let log: ILogger & { transports?: unknown; errorHandler?: unknown }
let configureLogger: () => void
let createLogger: (namespace: string) => ILogger

if (isWorker) {
  // --- Worker-safe logger implementation ---
  const createSimpleLogger = (namespace: string): ILogger => ({
    debug: (...args: unknown[]) => console.debug(`[${namespace}]`, ...args),
    info: (...args: unknown[]) => console.info(`[${namespace}]`, ...args),
    warn: (...args: unknown[]) => console.warn(`[${namespace}]`, ...args),
    error: (...args: unknown[]) => console.error(`[${namespace}]`, ...args),
    verbose: (...args: unknown[]) => console.log(`[${namespace}]`, ...args)
  })

  log = createSimpleLogger('default')
  configureLogger = (): void => {
    /* no-op in worker */
  }
  createLogger = createSimpleLogger
} else {
  // --- Electron-specific logger implementation ---
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const electronLog = require('electron-log')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { app } = require('electron')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path')

  const configureElectronLogger = (): void => {
    const userDataPath = app.getPath('userData')
    const logPath = path.join(userDataPath, 'logs')

    electronLog.transports.file.resolvePathFn = () => path.join(logPath, 'logs.log')
    electronLog.transports.file.level = 'info'
    electronLog.transports.file.maxSize = 10 * 1024 * 1024 // 10MB
    electronLog.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

    electronLog.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info'
    electronLog.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

    electronLog.errorHandler.startCatching({
      showDialog: false,
      onError: (error: Error) => {
        electronLog.error('Uncaught error:', error)
      }
    })
  }

  const createElectronLogger = (namespace: string): ILogger => {
    return {
      debug: (...args: unknown[]) => electronLog.debug(`[${namespace}]`, ...args),
      info: (...args: unknown[]) => electronLog.info(`[${namespace}]`, ...args),
      warn: (...args: unknown[]) => electronLog.warn(`[${namespace}]`, ...args),
      error: (...args: unknown[]) => electronLog.error(`[${namespace}]`, ...args),
      verbose: (...args: unknown[]) => electronLog.verbose(`[${namespace}]`, ...args)
    }
  }

  log = electronLog
  configureLogger = configureElectronLogger
  createLogger = createElectronLogger
}

export { log, configureLogger, createLogger }
