import React, { useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import PageTitle from '@renderer/components/PageTitle'
import { ArrowLeft } from 'react-feather'
import { useGenerationStore } from '@renderer/stores/generationStore'
import type { GenerateRequest, GenerationResult } from '@main/services/data-generator/types'

const SelectMethodView: React.FC = () => {
  const navigate = useNavigate()
  const [isHover, setIsHover] = useState(false)

  const baseColor = 'var(--color-dark-gray)'
  const hoverColor = 'var(--color-black)'

  const handleDirectInsert = async (): Promise<void> => {
    if (isProcessing) return

    if (!projectId || !tableId) {
      setStatusMessage('프로젝트 또는 테이블 정보가 없습니다.')
      return
    }

    if (!tableConfig || mappedColumns.length === 0) {
      setStatusMessage('선택한 테이블에 매핑된 컬럼이 없습니다. 먼저 생성 방식을 설정해주세요.')
      return
    }

    const recordCnt = tableConfig.recordCnt > 0 ? tableConfig.recordCnt : 1

    const payload: GenerateRequest = {
      projectId: Number(projectId),
      mode: 'DIRECT_DB',
      tables: [
        {
          tableName: tableConfig.tableName ?? tableId,
          recordCnt,
          columns: mappedColumns
        }
      ]
    }

    try {
      setIsProcessing(true)
      setStatusMessage('데이터 생성 및 DB 삽입을 진행합니다...')
      const result = (await window.api.dataGenerator.generate(payload)) as GenerationResult
      console.log('[DirectInsert]', result)

      if (result.success) {
        const fallbackName = tableConfig.tableName ?? tableId
        const executed = result.executedTables?.join(', ') ?? fallbackName
        setStatusMessage(`DB 삽입 완료: ${executed}`)
      } else {
        setStatusMessage(result.errors?.join('\n') ?? 'DB 삽입 중 오류가 발생했습니다.')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setStatusMessage(`DB 삽입 실패: ${message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div style={{ marginBottom: '40px' }}>
        <PageTitle
          title="더미 데이터 생성"
          description={
            '생성 방식을 선택해주세요.\nSQL 스크립트를 생성하거나 연결된 DB에 직접 삽입할 수 있습니다.'
          }
        />
      </div>

      <div
        onClick={() => navigate(-1)}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          userSelect: 'none',
          color: isHover ? hoverColor : baseColor,
          textDecoration: isHover ? 'underline' : 'none',
          transition: 'color 0.2s ease, text-decoration 0.2s ease',
          marginBottom: 16
        }}
      >
        <ArrowLeft size={18} color={isHover ? hoverColor : baseColor} />
        <span className="preRegular16">이전으로</span>
      </div>

      <div style={{ display: 'flex', gap: 40 }}>
        <div
          onClick={() =>
            navigate(`/main/insert/sql/${projectId}`, {
              state: { tables: selectedTables }
            })
          }
          style={{
            width: 500,
            height: 160,
            backgroundColor: 'var(--color-white)',
            border: '1.5px solid var(--color-gray-200)',
            borderRadius: 12,
            boxShadow: 'var(--shadow)',
            cursor: 'pointer',
            padding: '30px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            transition: 'all 0.25s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-light-blue)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-white)')}
        >
          <p className="preSemiBold20" style={{ color: 'var(--color-black)', marginBottom: 8 }}>
            INSERT SQL 생성하기
          </p>
          <p className="preRegular18" style={{ color: 'var(--color-dark-gray)' }}>
            더미 데이터 삽입용 SQL 문서를 생성합니다.
          </p>
        </div>

        <div
          onClick={() => navigate(`/main/insert/db/${projectId}`)}
          style={{
            width: 500,
            height: 160,
            backgroundColor: 'var(--color-white)',
            border: '1.5px solid var(--color-gray-200)',
            borderRadius: 12,
            boxShadow: 'var(--shadow)',
            cursor: isProcessing ? 'wait' : 'pointer',
            padding: '30px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            transition: 'all 0.25s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-light-blue)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-white)')}
        >
          <p className="preSemiBold20" style={{ color: 'var(--color-black)', marginBottom: 8 }}>
            바로 DB에 삽입하기
          </p>
          <p className="preRegular18" style={{ color: 'var(--color-dark-gray)' }}>
            연결된 데이터베이스에 즉시 더미 데이터를 삽입합니다.
          </p>
          {isProcessing && (
            <p className="preRegular14" style={{ color: 'var(--color-main-blue)', marginTop: 12 }}>
              처리 중...
            </p>
          )}
        </div>
      </div>

      {statusMessage && (
        <div style={{ marginTop: 24, color: 'var(--color-dark-gray)', whiteSpace: 'pre-line' }}>
          {statusMessage}
        </div>
      )}
    </div>
  )
}

export default SelectMethodView
