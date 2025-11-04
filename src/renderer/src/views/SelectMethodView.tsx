import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageTitle from '@renderer/components/PageTitle'
import { ArrowLeft } from 'react-feather'

const SelectMethodView: React.FC = () => {
  const navigate = useNavigate()
  const { projectId, tableId } = useParams<{ projectId: string; tableId: string }>()
  const [isHover, setIsHover] = useState(false)

  const baseColor = 'var(--color-dark-gray)'
  const hoverColor = 'var(--color-black)'

  return (
    <div className="flex flex-col">
      {/* 상단 타이틀 */}
      <div style={{ marginBottom: '40px' }}>
        <PageTitle
          title="더미데이터 생성"
          description={
            '생성 방식을 선택하세요.\n' +
            'SQL 스크립트를 생성하거나, 연결된 DB에 직접 삽입할 수 있습니다.'
          }
        />
      </div>

      {/* 이전으로 */}
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

      {/* 카드 선택 영역 */}
      <div style={{ display: 'flex', gap: 40 }}>
        {/* INSERT SQL 생성하기 */}
        <div
          onClick={() => navigate(`/main/insert/sql/${projectId}/${tableId}`)}
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
            더미데이터 삽입을 위한 SQL문을 생성할게요.
          </p>
        </div>

        {/* 바로 DB에 삽입하기 */}
        <div
          onClick={() => navigate(`/main/insert/db/${projectId}/${tableId}`)}
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
            연결된 DB에 바로 더미데이터를 삽입할게요.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SelectMethodView
