import { app } from 'electron'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const KEY_FILE_NAME = 'encryption.key'

function getKeyFilePath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, KEY_FILE_NAME)
}

/**
 * 암호화된 키를 불러오거나 생성
 */
export function getOrCreateEncryptionKey(): string {
  const keyFilePath = getKeyFilePath()

  try {
    // 기존 키 파일이 있는 경우
    if (fs.existsSync(keyFilePath)) {
      const key = fs.readFileSync(keyFilePath, 'utf8').trim()
      return key
    }

    const newKey = crypto.randomBytes(32).toString('hex').slice(0, 32)
    fs.writeFileSync(keyFilePath, newKey, 'utf8')

    return newKey
  } catch (error) {
    console.error('암호화 키 로드/생성 중 오류 발생:', error)
    throw new Error('암호화 키 초기화 실패')
  }
}
