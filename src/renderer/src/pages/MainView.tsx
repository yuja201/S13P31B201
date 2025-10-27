import React from 'react'
import { useNavigate } from 'react-router-dom'

const MainPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div>
      <button
        className="preMedium16"
        onClick={() => navigate(-1)}
        style={{
          backgroundColor: 'var(--color-light-blue)',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          cursor: 'pointer'
        }}
      >
        ← 뒤로가기
      </button>

      <h2 className="preSemiBold24" style={{ marginTop: '24px' }}>
        메인 페이지
      </h2>
      <p className="preRegular16">여기는 사이드바가 포함된 메인 화면입니다.</p>
    </div>
  )
}

export default MainPage
