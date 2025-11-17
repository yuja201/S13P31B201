import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import {
  createTablesSQL,
  insertDefaultDBMSData,
  insertDefaultDomainCategories,
  insertDefaultDomainData
} from './schema'
import { MigrationManager } from './migration-manager'
import fs from 'node:fs'

let db: Database.Database | null = null

/**
 * 데이터베이스 초기화
 */
export function initDatabase(): Database.Database {
  if (db) {
    return db
  }

  // 사용자 데이터 디렉토리에 데이터베이스 파일 생성
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'heresdummy.db')

  // 데이터베이스 연결
  db = new Database(dbPath, {
    // 개발 중 SQL 쿼리 로깅
    verbose: console.log
  })

  // 성능 향상을 위한 WAL 모드 활성화
  db.pragma('journal_mode = WAL')

  // FK 제약조건 활성화
  db.pragma('foreign_keys = ON')

  // meta 테이블 생성
  db.exec(`
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', '1');
`)

  // 데이터베이스 스키마 생성
  db.exec(createTablesSQL)
  try {
    // domains 테이블에 logical_type 컬럼이 없으면 추가
    db.prepare("ALTER TABLE domains ADD COLUMN logical_type TEXT NOT NULL DEFAULT 'string'").run()
    console.log('Database migration: Added logical_type to domains table.')
  } catch (err) {
    const isDuplicateColumnError =
      err instanceof Error && err.message.includes('duplicate column name')

    if (!isDuplicateColumnError) {
      throw err
    }
  }

  // DBMS 종류 저장
  db.exec(insertDefaultDBMSData)

  // 도메인 종류 저장
  db.exec(insertDefaultDomainCategories)
  db.exec(insertDefaultDomainData)

  // migration 실행 경로 자동 분기
  let migrationsPath: string

  if (!app.isPackaged) {
    // dev 환경 — src 직접 읽음
    migrationsPath = path.join(process.cwd(), 'src', 'main', 'database', 'migrations')
  } else {
    // build 환경 — electron-builder가 복사한 폴더
    migrationsPath = path.join(process.resourcesPath, 'migrations')
  }

  if (!fs.existsSync(migrationsPath)) {
    console.warn('[Migration] migrations folder not found:', migrationsPath)
  } else {
    const migrationManager = new MigrationManager(db, migrationsPath)
    migrationManager.runMigrations()
  }

  // 폴더 존재 여부 확인 (안전)
  if (!fs.existsSync(migrationsPath)) {
    console.warn('[Migration] migrations folder not found:', migrationsPath)
  } else {
    const migrationManager = new MigrationManager(db, migrationsPath)
    migrationManager.runMigrations()
  }

  return db
}

/**
 * 데이터베이스 인스턴스 가져오기
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase()
  }
  return db
}

/**
 * 데이터베이스 연결 종료
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

// 앱 종료 시 데이터베이스 연결 종료
app.on('before-quit', () => {
  closeDatabase()
})
