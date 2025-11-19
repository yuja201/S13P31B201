import type { Database } from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

interface MetaRow {
  value: string
}

export class MigrationManager {
  private readonly db: Database
  private readonly migrationsPath: string

  constructor(db: Database, migrationsPath: string) {
    this.db = db
    this.migrationsPath = migrationsPath
  }

  // 신규 설치에서만 호출됨 — 최신 버전 계산
  public getLatestMigrationVersion(): number {
    const files = fs.readdirSync(this.migrationsPath).filter((f) => f.endsWith('.sql'))

    const versions = files.map((f) => Number(f.split('_')[0])).filter((n) => !isNaN(n))

    return versions.length > 0 ? Math.max(...versions) : 1
  }

  // 신규 설치용 — schema_version 세팅
  public setSchemaVersion(version: number): void {
    // meta table에 값 넣기
    this.db
      .prepare(
        `
        INSERT INTO meta (key, value) VALUES ('schema_version', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value;
      `
      )
      .run(String(version))
  }

  // 기존 버전 읽기 (runMigrations용)
  private getCurrentVersion(): number {
    try {
      const stmt = this.db.prepare<[], MetaRow>(
        "SELECT value FROM meta WHERE key = 'schema_version'"
      )
      const row = stmt.get()

      if (!row) {
        // 테이블은 있지만 schema_version row가 없을 때 → 기본값 0 기록
        this.db
          .prepare(
            `
        INSERT OR IGNORE INTO meta (key, value)
        VALUES ('schema_version', '0')
      `
          )
          .run()
        return 0
      }

      return Number(row.value)
    } catch (err: any) {
      // 테이블 자체가 없을 때
      if (err.message.includes('no such table')) {
        // meta 테이블 생성
        this.db
          .prepare(
            `
        CREATE TABLE IF NOT EXISTS meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `
          )
          .run()

        // 기본 버전 0 저장
        this.db
          .prepare(
            `
        INSERT INTO meta (key, value)
        VALUES ('schema_version', '0')
      `
          )
          .run()

        return 0
      }

      // 다른 오류는 그냥 throw
      throw err
    }
  }

  private setVersion(version: number): void {
    this.db
      .prepare(
        `
        UPDATE meta SET value = ? WHERE key = 'schema_version'
      `
      )
      .run(String(version))
  }

  // 기존 사용자 마이그레이션 실행
  public runMigrations(): void {
    const files = fs
      .readdirSync(this.migrationsPath)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    let currentVersion = this.getCurrentVersion()

    for (const file of files) {
      const match = file.match(/^(\d+)_/)
      if (!match) throw new Error(`Invalid migration file name: ${file}`)

      const version = Number(match[1])
      if (version <= currentVersion) continue

      const filePath = path.join(this.migrationsPath, file)
      const sql = fs.readFileSync(filePath, 'utf8')

      this.db.exec('BEGIN')
      try {
        this.db.exec(sql)
        this.setVersion(version)
        this.db.exec('COMMIT')
      } catch (err) {
        this.db.exec('ROLLBACK')
        const isDuplicateColumnError =
          err instanceof Error && /duplicate column name/i.test(err.message)

        if (!isDuplicateColumnError) {
          throw err
        }

        this.setVersion(version)
        console.warn(
          `Migration for version ${version} skipped due to duplicate column:`,
          err.message
        )
      }
      currentVersion = version
    }
  }
}
