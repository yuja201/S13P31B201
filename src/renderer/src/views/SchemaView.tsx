import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '@renderer/components/Button'
import PageTitle from '@renderer/components/PageTitle'
import TableInfoContainer from '@renderer/components/TableInfoContainer'
import { useSchemaStore } from '@renderer/stores/schemaStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import type { Table } from '../../../main/database/types'

const SchemaView: React.FC = () => {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const selectedProject = useProjectStore((state) => state.selectedProject)
  const { fetchSchema, isLoading } = useSchemaStore()

  const [tables, setTables] = useState<Table[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadSchema = async (): Promise<void> => {
      if (!selectedProject?.database?.id) {
        setErrorMessage('데이터베이스 정보를 찾을 수 없습니다.')
        return
      }

      try {
        setErrorMessage(null)
        const schema = await fetchSchema(selectedProject.database.id)
        setTables(schema.tables)
      } catch (err) {
        console.error('스키마 로딩 실패:', err)
        const message = '스키마 정보를 불러오는데 실패했습니다.'
        setErrorMessage(message)
      }
    }

    loadSchema()
  }, [projectId, selectedProject, fetchSchema])

  const handlePrevious = (): void => {
    if (selectedProject?.id) {
      navigate(`/main/info/${selectedProject.id}`)
    } else {
      navigate('/main')
    }
  }

  const handleConfirm = (): void => {
    if (selectedProject?.id) {
      navigate(`/main/dashboard/${selectedProject.id}`)
    } else {
      navigate('/main')
    }
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
          {isLoading ? (
            <div className="schema-view-loading">
              <p>스키마 정보를 불러오는 중...</p>
            </div>
          ) : errorMessage ? (
            <div className="schema-view-error">
              <p style={{ fontSize: '16px', textAlign: 'center' }}>{errorMessage}</p>
            </div>
          ) : tables.length === 0 ? (
            <div className="schema-view-empty">
              <p style={{ fontSize: '16px', textAlign: 'center' }}>테이블이 없습니다.</p>
            </div>
          ) : (
            <TableInfoContainer tables={tables} />
          )}
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
