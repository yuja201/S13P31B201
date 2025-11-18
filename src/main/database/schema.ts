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
  database_name TEXT NOT NULL DEFAULT '',
  created_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now')),
  connected_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (dbms_id) REFERENCES dbmses(id) ON DELETE CASCADE
);

-- 도메인 카테고리 테이블
CREATE TABLE IF NOT EXISTS domain_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 도메인 테이블
CREATE TABLE IF NOT EXISTS domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logical_type TEXT NOT NULL DEFAULT 'string',
  created_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (category_id) REFERENCES domain_categories(id) ON DELETE CASCADE
);

-- 생성 규칙 테이블
CREATE TABLE IF NOT EXISTS rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  data_source TEXT NOT NULL,
  domain_id INTEGER NOT NULL,
  model_id NUMERIC,
  prompt TEXT,
  locale TEXT,
  created_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

-- 테스트 결과 테이블
CREATE TABLE IF NOT EXISTS tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  type TEXT CHECK(type IN ('QUERY', 'INDEX')) NOT NULL,
  grade TEXT CHECK(grade IN('good', 'warning', 'critical')),
  summary TEXT,
  created_at NUMERIC NOT NULL DEFAULT (strftime('%s', 'now')),
  result TEXT NOT NULL,
  response_time REAL,
  index_ratio REAL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 메타 정보 테이블
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_databases_project_id ON databases(project_id);
CREATE INDEX IF NOT EXISTS idx_databases_dbms_id ON databases(dbms_id);
CREATE INDEX IF NOT EXISTS idx_rules_domain ON rules(domain_id);
CREATE INDEX IF NOT EXISTS idx_tests_project_id ON tests(project_id);
CREATE INDEX IF NOT EXISTS idx_tests_type ON tests(type);
`

// DBMS 종류 저장
export const insertDefaultDBMSData = `
INSERT OR IGNORE INTO dbmses (id, name) VALUES
  (1, 'MySQL'),
  (2, 'PostgreSQL')
`

// 도메인 카테고리 종류 저장
export const insertDefaultDomainCategories = `
INSERT OR IGNORE INTO domain_categories (id, name) VALUES
  (1, '이름/사람'),
  (2, '주소/지역'),
  (3, '연락처/계정'),
  (4, '회사/조직'),
  (5, '금융/결제'),
  (6, '상품/상거래'),
  (7, '차량/이동수단'),
  (8, '날짜/시간'),
  (9, '시스템/기술'),
  (10, '데이터/숫자'),
  (11, '텍스트/콘텐츠'),
  (12, '과학/교육'),
  (13, '색상/디자인'),
  (14, '엔터테인먼트/기타');
`

// 도메인 종류 저장
export const insertDefaultDomainData = `
INSERT OR IGNORE INTO domains (id, category_id, name, description, logical_type) VALUES
  (1, 1, '이름', '이름(First Name)', 'string'),
  (2, 1, '성', '성(Last Name)', 'string'),
  (3, 1, '전체 이름', '이름과 성을 합친 전체 이름', 'string'),
  (4, 1, '직업명', '직업 또는 직책', 'string'),
  (5, 2, '도로명 주소', '상세 도로명 주소', 'string'),
  (6, 2, '도시', '도시 이름', 'string'),
  (7, 2, '국가', '국가 이름', 'string'),
  (8, 2, '우편번호', '우편번호', 'string'),
  (9, 3, '이메일', '이메일 주소', 'string'),
  (10, 3, '전화번호', '전화번호', 'string'),
  (11, 3, '사용자명', '계정 아이디 또는 닉네임', 'string'),
  (12, 3, '도메인', '도메인 이름', 'string'),
  (13, 4, '회사명', '회사 이름', 'string'),
  (14, 4, '슬로건', '회사 슬로건 또는 문구', 'string'),
  (15, 4, '부서', '부서 이름', 'string'),
  (16, 4, '직종', '직무 분야', 'string'),
  (17, 5, '계좌번호', '은행 계좌번호', 'string'),
  (18, 5, '금액', '거래 금액', 'number'),
  (19, 5, '카드번호', '신용/체크카드 번호', 'string'),
  (20, 5, '거래유형', '입금, 출금 등 거래 종류', 'string'),
  (21, 6, '상품명', '제품 이름', 'string'),
  (22, 6, '카테고리', '제품 분류', 'string'),
  (23, 6, '가격', '제품 가격', 'number'),
  (24, 6, '설명', '제품 설명 또는 소개문', 'string'),
  (25, 7, '제조사', '차량 브랜드명', 'string'),
  (26, 7, '모델명', '모델 이름', 'string'),
  (27, 7, '차량번호', '차량 번호판', 'string'),
  (28, 7, '차량 타입', '차량 종류 (SUV, 트럭 등)', 'string'),
  (29, 8, '과거 날짜', '무작위 과거 일시', 'date'),
  (30, 8, '미래 날짜', '무작위 미래 일시', 'date'),
  (31, 8, '최근 날짜', '최근 시점의 일시', 'date'),
  (32, 8, '타임스탬프', 'UNIX timestamp', 'number'),
  (33, 9, 'UUID', '고유 식별자(UUID)', 'string'),
  (34, 9, '파일명', '파일 이름', 'string'),
  (35, 9, '버전', '소프트웨어 버전 문자열', 'string'),
  (36, 9, '커밋 메시지', 'Git 커밋 메시지', 'string'),
  (37, 10, '정수', '랜덤 정수 값', 'number'),
  (38, 10, '실수', '랜덤 실수 값', 'number'),
  (39, 10, '불리언', 'true 또는 false 값', 'boolean'),
  (40, 10, '랜덤 문자열', '무작위 문자열 데이터', 'string'),
  (41, 11, '문장', '짧은 문장', 'string'),
  (42, 11, '문단', '랜덤 긴 문단', 'string'),
  (43, 11, '단어', '단어 하나', 'string'),
  (44, 11, '키워드', '주제나 태그용 단어', 'string'),
  (45, 12, '화학 원소', '화학 원소 이름', 'string'),
  (46, 12, '단위', '물리 단위', 'string'),
  (47, 12, '과목명', '학교 과목 이름', 'string'),
  (48, 12, '학교명', '학교 또는 기관 이름', 'string'),
  (49, 13, '색상명', '사람이 읽을 수 있는 색상 이름', 'string'),
  (50, 13, 'RGB 값', 'RGB 형태의 색상값', 'string'),
  (51, 13, 'HEX 코드', '16진수 색상 코드', 'string'),
  (52, 13, '이미지 URL', '랜덤 이미지 주소', 'string'),
  (53, 14, '음악 장르', '랜덤 음악 장르', 'string'),
  (54, 14, '노래 이름', '랜덤 노래 제목', 'string'),
  (55, 14, '동물 이름', '동물 이름', 'string');
`
// 초기 스키마 버전 설정
export const insertInitialSchemaVersion = `INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', '1');`
