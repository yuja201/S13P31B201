import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@renderer/components/Button'
import PageTitle from '@renderer/components/PageTitle'
import TableInfoContainer from '@renderer/components/TableInfoContainer'

interface Column {
  name: string
  type: string
  isPrimaryKey?: boolean
  isForeignKey?: boolean
  notNull?: boolean
  unique?: boolean
  check?: string
  autoIncrement?: boolean
  default?: string
  enum?: string[]
  domain?: string
}

interface Table {
  name: string
  rowCount: number
  columns: Column[]
}

const SchemaView: React.FC = () => {
  const navigate = useNavigate()

  // 임시 데이터 (나중에 실제 데이터베이스 정보로 대체)
  const [tables] = useState<Table[]>([
    {
      name: 'users',
      rowCount: 1262,
      columns: [
        { name: 'id', type: 'INT', isPrimaryKey: true, notNull: true, autoIncrement: true },
        { name: 'username', type: 'VARCHAR(50)', notNull: true, unique: true },
        {
          name: 'email',
          type: 'VARCHAR(50)',
          notNull: true,
          unique: true,
          check: 'email LIKE "%@%"'
        },
        { name: 'age', type: 'INT', check: 'age >= 0' },
        {
          name: 'status',
          type: 'VARCHAR(20)',
          default: 'active',
          enum: ['active', 'inactive', 'banned']
        },
        { name: 'created_at', type: 'DATETIME', notNull: true, default: 'CURRENT_TIMESTAMP' }
      ]
    },
    {
      name: 'posts',
      rowCount: 52489,
      columns: [
        { name: 'id', type: 'INT', isPrimaryKey: true, notNull: true, autoIncrement: true },
        { name: 'user_id', type: 'INT', isForeignKey: true, notNull: true },
        { name: 'title', type: 'VARCHAR(200)', notNull: true },
        { name: 'content', type: 'TEXT', notNull: true },
        { name: 'view_count', type: 'INT', default: '0', check: 'view_count >= 0' },
        { name: 'created_at', type: 'DATETIME', notNull: true, default: 'CURRENT_TIMESTAMP' }
      ]
    },
    {
      name: 'comments',
      rowCount: 893157246,
      columns: [
        { name: 'id', type: 'INT', isPrimaryKey: true, notNull: true, autoIncrement: true },
        { name: 'post_id', type: 'INT', isForeignKey: true, notNull: true },
        { name: 'user_id', type: 'INT', isForeignKey: true, notNull: true },
        { name: 'content', type: 'TEXT', notNull: true },
        { name: 'created_at', type: 'DATETIME', notNull: true, default: 'CURRENT_TIMESTAMP' }
      ]
    }
  ])

  const handlePrevious = (): void => {
    navigate('/main/info')
  }

  const handleConfirm = (): void => {
    // TODO: 확인 후 다음 단계로 이동
  }

  return (
    <>
      <style>
        {`
          .schema-view-container {
            display: flex;
            flex-direction: column;
            height: 100%;
          }

          .schema-view-header {
            margin-bottom: 30px;
          }

          .schema-view-content {
            flex: 1;
            overflow-y: auto;
          }

          .schema-view-button-container {
            display: flex;
            justify-content: flex-end;
            gap: 20px;
            margin-top: 20px;
            padding-top: 20px;
          }
        `}
      </style>
      <div className="schema-view-container">
        <div className="schema-view-header">
          <PageTitle
            title="프로젝트 정보"
            description="연결된 데이터베이스의 테이블 스키마를 확인하세요."
          />
        </div>

        <div className="schema-view-content">
          <TableInfoContainer tables={tables} />
        </div>

        <div className="schema-view-button-container">
          <Button variant="gray" onClick={handlePrevious}>
            이전
          </Button>
          <Button onClick={handleConfirm}>확인</Button>
        </div>
      </div>
    </>
  )
}

export default SchemaView
