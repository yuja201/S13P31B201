// 데이터베이스 스키마 생성
export const createTablesSQL = `
-- DBMS 테이블
CREATE TABLE IF NOT EXISTS dbmses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 프로젝트 테이블
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 데이터베이스 테이블
CREATE TABLE IF NOT EXISTS databases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  dbms_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now')),
  connected_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (dbms_id) REFERENCES dbmses(id) ON DELETE CASCADE
);

-- 생성 규칙 테이블
CREATE TABLE IF NOT EXISTS rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  data_source TEXT NOT NULL,
  domain TEXT NOT NULL,
  model_id NUMERIC,
  prompt TEXT,
  created_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_databases_project_id ON databases(project_id);
CREATE INDEX IF NOT EXISTS idx_databases_dbms_id ON databases(dbms_id);
CREATE INDEX IF NOT EXISTS idx_rules_domain ON rules(domain);
`

// DBMS 종류 저장
export const insertDefaultDBMSData = `
INSERT OR IGNORE INTO dbmses (id, name) VALUES
  (1, 'MySQL'),
  (2, 'PostgreSQL')
`
