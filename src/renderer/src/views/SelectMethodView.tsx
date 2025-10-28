import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageTitle from '@renderer/components/PageTitle'
import { ArrowLeft } from 'react-feather'

const SelectMethodView: React.FC = () => {
  const navigate = useNavigate()
  const [isHover, setIsHover] = useState(false)

  const baseColor = 'var(--color-dark-gray)'
  const hoverColor = 'var(--color-black)'

  return (
    <div className="flex flex-col">
      <div style={{ marginBottom: '40px' }}>
        <PageTitle
          title="더미데이터 생성"
          description={
            '생성 방식을 선택하세요.\n' +
            'SQL 스크립트를 생성하거나, 연결된 DB에 직접 삽입할 수 있습니다.'
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
          marginBottom: 40
        }}
      >
        <ArrowLeft size={18} color={isHover ? hoverColor : baseColor} />
        <span className="preRegular16">이전으로</span>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div
          className="shadow flex flex-col justify-center items-start bg-[var(--color-white)] border border-[var(--color-gray-200)] rounded-2xl cursor-pointer transition-all"
          style={{
            width: '500px',
            height: '200px',
            padding: '30px 50px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow)'
          }}
          onClick={() => navigate('/generate-sql')}
        >
          <p className="preBold18" style={{ color: 'var(--color-black)' }}>
            INSERT SQL 생성하기
          </p>
          <p className="preRegular16" style={{ color: 'var(--color-dark-gray)' }}>
            더미데이터 삽입을 위한 SQL문을 생성할게요.
          </p>
        </div>

        <div
          className="shadow flex flex-col justify-center items-start bg-[var(--color-white)] border border-[var(--color-gray-200)] rounded-2xl cursor-pointer transition-all"
          style={{
            width: '500px',
            height: '200px',
            padding: '30px 50px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow)'
          }}
          onClick={() => navigate('/insert-db')}
        >
          <p className="preBold18" style={{ color: 'var(--color-black)' }}>
            바로 DB에 삽입하기
          </p>
          <p className="preRegular16" style={{ color: 'var(--color-dark-gray)' }}>
            연결된 DB에 바로 더미데이터를 삽입할게요.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SelectMethodView
