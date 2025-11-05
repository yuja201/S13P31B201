import crypto from 'crypto'
import { getOrCreateEncryptionKey } from './key-manager'

const ALGORITHM = 'aes-256-gcm'
let encryptionKey: string | null = null

function getEncryptionKey(): string {
  if (!encryptionKey) {
    encryptionKey = getOrCreateEncryptionKey()
  }
  return encryptionKey
}

/**
 * 비밀번호 암호화
 * @param text 평문
 * @returns 암호화된 텍스트
 */
export function encrypt(text: string): string {
  try {
    // 초기화 벡터 생성
    const iv = crypto.randomBytes(12)

    // 암호화 cipher 생성
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(getEncryptionKey()), iv)

    // 텍스트 암호화
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // GCM 모드 데이터 무결성 검증용 인증 태그
    const authTag = cipher.getAuthTag()

    // iv:authTag:encryptedData 형식으로 반환
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error) {
    console.error('암호화 중 오류 발생:', error)
    throw new Error('암호화 실패')
  }
}

/**
 * 비밀번호 복호화
 * @param encryptedText 암호화된 텍스트
 * @returns 평문
 */
export function decrypt(encryptedText: string): string {
  try {
    // iv:authTag:encryptedData 분리
    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
      throw new Error('잘못된 암호화 형식')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]

    // 복호화 decipher 생성
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(getEncryptionKey()), iv)
    decipher.setAuthTag(authTag)

    // 텍스트 복호화
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('복호화 중 오류 발생:', error)
    throw new Error('복호화 실패')
  }
}
