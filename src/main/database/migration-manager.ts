import type { Database } from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

// 1) SELECT 결과 타입 정의
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

  private getCurrentVersion(): number {
    const stmt = this.db.prepare<[], MetaRow>("SELECT value FROM meta WHERE key = 'schema_version'")

    // get(): MetaRow | undefined
    const row = stmt.get()

    if (!row) return 0
    return Number(row.value)
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

  public runMigrations(): void {
    const files = fs
      .readdirSync(this.migrationsPath)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    let currentVersion = this.getCurrentVersion()

    for (const file of files) {
      const match = file.match(/^(\d+)_/)
      if (!match) {
        throw new Error(`Invalid migration file name: ${file}`)
      }
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
        throw err
      }

      currentVersion = version
    }
  }
}
