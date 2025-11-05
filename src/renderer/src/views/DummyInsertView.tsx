import React, { useState, useEffect, useRef } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import successIcon from '@renderer/assets/imgs/success.svg'
import warningIcon from '@renderer/assets/imgs/warning.svg'
import failureIcon from '@renderer/assets/imgs/failure.svg'
import Button from '@renderer/components/Button'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useGenerationStore } from '@renderer/stores/generationStore'
import { useLocation, useNavigate } from 'react-router-dom'
import type {
  ColumnMetaData,
  DataSourceType,
  GenerationMode,
  GenerateRequest
} from '@main/services/data-generator/types'

type InsertMode = 'sql' | 'db'

interface ProgressMessage {
  type: 'row-progress' | 'column-progress' | 'table-complete' | 'all-complete' | 'log' | 'error'
  progress?: number
  message?: string
  tableName?: string
  status?: 'success' | 'warning' | 'failure'
  totalCount?: number
  insertedCount?: number
  successCount?: number
  failCount?: number
}

const DummyInsertView: React.FC = () => {
  const location = useLocation()
  const state = location.state as {
    tables?: Array<{ id: string; name: string }>
    mode?: InsertMode
  } | null

  const selectedTables = state?.tables ?? []
  const selectedTablesRef = useRef(selectedTables) // ✅ 중요 코드: deps 안정화
  const mode: InsertMode = state?.mode ?? 'sql'

  const [progress, setProgress] = useState<number>(0)
  const [isCompleted, setIsCompleted] = useState<boolean>(false)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [insertedCount, setInsertedCount] = useState<number>(0)
  const [logs, setLogs] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [tables, setTables] = useState<Array<{ name: string; status: string }>>([])
  const [zipPath, setZipPath] = useState<string | null>(null)

  const logEndRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { selectedProject } = useProjectStore()
  const { exportAllTables } = useGenerationStore()

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    window.api.dataGenerator.onProgress((msg: unknown) => {
      const message = msg as ProgressMessage
      setLogs((prev) => [...prev, `[DEBUG] ${JSON.stringify(message)}`])

      if (message.type === 'row-progress' && message.progress !== undefined) {
        setProgress(message.progress)
      }

      if (message.type === 'table-complete' && message.tableName) {
        setTables((prev) =>
          prev.map((t) => (t.name === message.tableName ? { ...t, status: 'success' } : t))
        )
      }

      if (message.type === 'error' && message.message) {
        setErrors((prev) => [...prev, message.message!])
      }

      if (message.type === 'all-complete') {
        setIsCompleted(true)
        const total = (message.successCount ?? 0) + (message.failCount ?? 0)
        setTotalCount(total)
        setInsertedCount(message.successCount ?? 0)
      }
    })

    return () => {
      window.api.dataGenerator.removeProgressListeners()
    }
  }, [])

  useEffect(() => {
    const startGeneration = async (): Promise<void> => {
      if (!selectedProject?.id) {
        setErrors(['프로젝트가 선택되지 않았습니다.'])
        return
      }

      const allTables = exportAllTables()
      const filteredTables = allTables.filter((t) =>
        selectedTablesRef.current.some((sel) => sel.name === t.tableName)
      )

      setTables(filteredTables.map((t) => ({ name: t.tableName, status: 'pending' })))

      const generationMode: GenerationMode = mode === 'db' ? 'DIRECT_DB' : 'SQL_FILE'

      const payload: GenerateRequest = {
        projectId: selectedProject.id,
        mode: generationMode,
        tables: filteredTables.map((tableData) => ({
          tableName: tableData.tableName,
          recordCnt: tableData.recordCnt,
          columns: tableData.columns.map((col) => ({
            columnName: col.columnName,
            dataSource: col.dataSource as DataSourceType,
            metaData: col.metaData as ColumnMetaData
          }))
        }))
      }

      const result = await window.api.dataGenerator.generate(payload)

      if (result?.zipPath) setZipPath(result.zipPath)
      if (result.errors?.length) setErrors(result.errors)
    }

    startGeneration()
  }, [selectedProject, exportAllTables, mode]) // ✅ selectedTables 제거 (ref 사용으로 경고 없음)

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'success':
        return successIcon
      case 'warning':
        return warningIcon
      case 'failure':
        return failureIcon
      default:
        return warningIcon
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        height: 'calc(100vh - 160px)',
        overflow: 'hidden',
        backgroundColor: 'var(--color-background)',
        padding: '40px 60px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 상단 제목 */}
      <div style={{ marginBottom: 30, flexShrink: 0 }}>
        <PageTitle
          title={
            isCompleted
              ? mode === 'sql'
                ? '더미데이터 SQL 삽입문 생성 완료'
                : '더미데이터 삽입 완료'
              : mode === 'sql'
                ? '더미데이터 SQL 삽입문 생성 중'
                : '더미데이터 삽입 중'
          }
          description={
            isCompleted
              ? `생성이 완료되었습니다.`
              : mode === 'sql'
                ? 'SQL 삽입문을 생성중입니다. 잠시만 기다려주세요.'
                : '데이터를 DB에 직접 삽입중입니다. 잠시만 기다려주세요.'
          }
        />
      </div>

      {/* 좌우 레이아웃 */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flex: 1,
          minHeight: 0
        }}
      >
        {/* 테이블 목록 */}
        <div
          style={{
            width: 260,
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-gray-200)',
            borderRadius: 16,
            boxShadow: 'var(--shadow)',
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <p style={{ font: 'var(--preBold18)', color: 'var(--color-black)' }}>Table List</p>
            <p style={{ font: 'var(--preRegular14)', color: 'var(--color-gray-500)' }}>
              {tables.length} table
            </p>
          </div>

          <ul
            style={{
              flex: 1,
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              overflowY: 'auto'
            }}
          >
            {tables.map((t, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  font: 'var(--preRegular16)',
                  color: 'var(--color-black)'
                }}
              >
                <img
                  src={getStatusIcon(t.status)}
                  alt={t.status}
                  style={{ width: 18, height: 18 }}
                />
                {t.name}
              </li>
            ))}
          </ul>
        </div>

        {/* 우측 로그 + 완료 화면 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              flex: 1,
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-gray-200)',
              borderRadius: 16,
              boxShadow: 'var(--shadow)',
              padding: '30px 40px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {!isCompleted ? (
              <>
                <p style={{ font: 'var(--preBold20)', marginBottom: 16 }}>더미데이터 생성 중</p>
                <p style={{ marginBottom: 8 }}>진행률: {progress}%</p>

                <div
                  style={{
                    width: '100%',
                    height: 25,
                    backgroundColor: 'var(--color-gray-200)',
                    borderRadius: 12,
                    marginBottom: 20,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      backgroundColor: 'var(--color-main-blue)',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>

                <div
                  style={{
                    flex: 1,
                    border: '1px solid var(--color-gray-blue)',
                    borderRadius: 12,
                    padding: '20px 30px',
                    overflowY: 'auto'
                  }}
                >
                  {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </>
            ) : (
              <>
                <p style={{ font: 'var(--preBold20)', marginBottom: 16 }}>더미데이터 삽입 완료</p>
                <p style={{ marginBottom: 20 }}>
                  전체 {totalCount.toLocaleString()}개 중 {insertedCount.toLocaleString()}개 삽입
                  완료
                </p>

                <div
                  style={{
                    flex: 1,
                    border: '1px solid var(--color-gray-blue)',
                    borderRadius: 12,
                    padding: '20px 30px',
                    overflowY: 'auto',
                    marginBottom: 20
                  }}
                >
                  {errors.length > 0 ? (
                    errors.map((e, i) => (
                      <div key={i} style={{ color: 'var(--color-red)', marginBottom: 8 }}>
                        {e}
                      </div>
                    ))
                  ) : (
                    <div>
                      {mode === 'sql'
                        ? '모든 SQL 삽입문이 정상적으로 생성되었습니다.'
                        : '모든 데이터가 정상적으로 삽입되었습니다.'}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  {mode === 'sql' && (
                    <Button
                      variant="blue"
                      onClick={() => zipPath && window.api.dataGenerator.downloadZip(zipPath)}
                    >
                      SQL문 다운로드
                    </Button>
                  )}
                  <Button variant="gray" onClick={() => navigate('/')}>
                    완료
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DummyInsertView
