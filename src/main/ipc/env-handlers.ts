import { ipcMain, app, shell } from 'electron'
import fs from 'fs'
import path from 'path'

/**
 * userData 폴더의 .env 파일 경로 가져오기
 */
function getEnvPath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, '.env')
}

/**
 * API 키 업데이트
 */
ipcMain.handle('env:update-api-key', async (_, data: { key: string; value: string }) => {
  try {
    const envPath = getEnvPath()

    // .env 파일 읽기 (없으면 빈 내용)
    let envContent = ''
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8')
    }

    // 환경 변수 업데이트 또는 추가
    const lines = envContent.split('\n') // 빈 줄 필터링 제거!
    let keyFound = false

    // 기존 키 찾아서 업데이트
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim()
      // 주석이나 빈 줄은 건드리지 않음
      if (trimmedLine.startsWith('#') || trimmedLine === '') {
        continue
      }
      // KEY= 형식으로 시작하는 라인 찾기
      if (trimmedLine.startsWith(`${data.key}=`)) {
        lines[i] = `${data.key}=${data.value}`
        keyFound = true
        break
      }
    }

    // 키가 없으면 맨 끝에 추가
    if (!keyFound) {
      lines.push(`${data.key}=${data.value}`)
    }

    // .env 파일에 쓰기
    fs.writeFileSync(envPath, lines.join('\n'), 'utf-8')

    // 메모리에도 즉시 반영
    process.env[data.key] = data.value

    console.log(`[ENV] Updated ${data.key} in ${envPath}`)

    return { success: true }
  } catch (error) {
    console.error('Error updating .env file:', error)
    return { success: false, error: String(error) }
  }
})

/**
 * 저장된 환경 변수 로드
 */
ipcMain.handle('env:load', async () => {
  try {
    const envPath = getEnvPath()

    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8')
      const env: Record<string, string> = {}

      envContent.split('\n').forEach((line) => {
        const trimmedLine = line.trim()
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=')
          if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim()
          }
        }
      })

      console.log(`[ENV] Loaded from ${envPath}`)
      return env
    }

    console.log(`[ENV] No .env file found at ${envPath}`)
    return {}
  } catch (error) {
    console.error('Error loading .env file:', error)
    return {}
  }
})

/**
 * .env 파일 경로 가져오기
 */
ipcMain.handle('env:get-path', async () => {
  return getEnvPath()
})

/**
 * .env 파일이 있는 폴더 열기
 */
ipcMain.handle('env:open-folder', async () => {
  const userDataPath = app.getPath('userData')
  shell.openPath(userDataPath)
})
