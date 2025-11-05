import React, { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import PageTitle from '@renderer/components/PageTitle'
import { ArrowLeft } from 'react-feather'
import { useGenerationStore } from '@renderer/stores/generationStore'

const SelectMethodView: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { projectId } = useParams<{ projectId: string }>()
  useGenerationStore() // ✅ Store는 여전히 유지하지만 별도 추출 없음

  const selectedTables =
    (location.state as { tables?: Array<{ id: string; name: string }> } | undefined)?.tables ?? []

  const [isHover, setIsHover] = useState(false)
  const baseColor = 'var(--color-dark-gray)'
  const hoverColor = 'var(--color-black)'

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
        {/* SQL 생성 */}
        <div
          onClick={() =>
            navigate(`/main/insert/sql/${projectId}`, {
              state: { tables: selectedTables, mode: 'sql' }
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

        {/* DB 직접 삽입 */}
        <div
          onClick={() =>
            navigate(`/main/insert/sql/${projectId}`, {
              state: { tables: selectedTables, mode: 'db' }
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
            바로 DB에 삽입하기
          </p>
          <p className="preRegular18" style={{ color: 'var(--color-dark-gray)' }}>
            연결된 데이터베이스에 즉시 더미 데이터를 삽입합니다.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SelectMethodView
