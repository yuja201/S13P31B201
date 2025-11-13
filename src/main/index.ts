import path from 'path'
import fs from 'fs'
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase } from './database'
import { configureLogger, createLogger } from './utils/logger'
import './ipc/database-handlers'
import './ipc/data-generator-handlers'
import './ipc/rule-handlers'
import './ipc/file-handlers'
import './ipc/env-handlers'
import './ipc/domain-handler'
import './ipc/index-test-handlers'
import './ipc/test-handler'

const logger = createLogger('Main')

/**
 * userData에 .env 파일이 없으면 템플릿에서 복사
 */
function ensureEnvFile(): void {
  const userDataPath = app.getPath('userData')
  const userEnvPath = path.join(userDataPath, '.env')

  // 이미 존재하면 복사 안 함
  if (fs.existsSync(userEnvPath)) {
    logger.info(`[ENV] .env file already exists at: ${userEnvPath}`)
    return
  }

  // 프로젝트 루트의 .env 파일 찾기
  const possibleEnvPaths = [path.join(__dirname, '../../.env')]

  let sourceEnvPath: string | null = null
  for (const envPath of possibleEnvPaths) {
    if (fs.existsSync(envPath)) {
      sourceEnvPath = envPath
      break
    }
  }

  if (sourceEnvPath) {
    try {
      fs.copyFileSync(sourceEnvPath, userEnvPath)
      logger.info(`[ENV] Copied .env template from ${sourceEnvPath} to ${userEnvPath}`)
    } catch (error) {
      logger.error('[ENV] Failed to copy .env file:', error)
    }
  } else {
    // 템플릿이 없으면 기본 내용으로 생성
    logger.info('[ENV] No template found, creating default .env file')
    const defaultContent = `# AI 서비스 API 키
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

# AI 서비스 엔드포인트
OPENAI_BASE_URL=https://api.openai.com/v1
ANTHROPIC_BASE_URL=https://api.anthropic.com
GOOGLE_BASE_URL=https://generativelanguage.googleapis.com

# 타임아웃 설정
OPENAI_TIMEOUT=60000
OPENAI_MAX_RETRIES=2
ANTHROPIC_TIMEOUT=60000
ANTHROPIC_MAX_RETRIES=2
GOOGLE_TIMEOUT=60000
GOOGLE_MAX_RETRIES=2
`
    fs.writeFileSync(userEnvPath, defaultContent, 'utf-8')
  }
}

/**
 * userData 폴더의 .env 파일 로드
 */
function loadUserDataEnv(): void {
  const userDataPath = app.getPath('userData')
  const envPath = path.join(userDataPath, '.env')

  logger.info(`[ENV] Loading from: ${envPath}`)

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    let loadedCount = 0

    envContent.split('\n').forEach((line) => {
      const trimmedLine = line.trim()
      // 주석이나 빈 줄 무시
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim()
          // 빈 값이 아닌 경우만 설정
          if (value) {
            process.env[key.trim()] = value
            loadedCount++
          }
        }
      }
    })

    logger.info(`[ENV] Loaded ${loadedCount} environment variables`)
  } else {
    logger.info(`[ENV] No .env file found at ${envPath}`)
  }
}

function createWindow(): void {
  const DIRNAME = import.meta.dirname

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 1024,
    minWidth: 1000,
    minHeight: 800,
    show: false,
    autoHideMenuBar: true,
    title: "Here's Dummy",
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(DIRNAME, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(DIRNAME, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Configure logger first
  configureLogger()

  // Ensure .env file exists in userData (copy from template if needed)
  ensureEnvFile()

  // Load environment variables from userData
  loadUserDataEnv()

  // Initialize database
  initDatabase()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => logger.debug('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
