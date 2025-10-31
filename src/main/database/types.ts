export interface DBMS {
  id: number
  name: string
  created_at: number
  updated_at: number
}

export interface Project {
  id: number
  name: string
  description: string
  created_at: number
  updated_at: number
}

export interface Database {
  id: number
  project_id: number
  dbms_id: number
  url: string
  username: string
  password: string
  created_at: number
  updated_at: number
  connected_at: number
}

export interface Rule {
  id: number
  name: string
  data_source: string
  domain_id: number
  domain_name: string
  category_name: string
  model_id: number | null
  prompt: string | null
  created_at: number
  updated_at: number
}

// 새로운 레코드 생성을 위한 Input types (id와 timestamp 제외)
export interface DBMSInput {
  name: string
}

export interface ProjectInput {
  name: string
  description: string
}

export interface DatabaseInput {
  project_id: number
  dbms_id: number
  url: string
  username: string
  password: string
}

export interface RuleInput {
  name: string
  data_source: string
  domain: number
  model_id?: number | null
  prompt?: string | null
}

// 레코드 업데이트 (id 제외 모두 선택)
export interface DBMSUpdate {
  id: number
  name?: string
}

export interface ProjectUpdate {
  id: number
  name?: string
  description?: string
}

export interface DatabaseUpdate {
  id: number
  project_id?: number
  dbms_id?: number
  url?: string
  username?: string
  password?: string
  connected_at?: number
}

export interface RuleUpdate {
  id: number
  name?: string
  data_source?: string
  domain?: number
  model_id?: number | null
  prompt?: string | null
}
