import React from 'react'
import { useNavigate } from 'react-router-dom'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="landing-container">
      <h1 className="preSemiBold32" style={{ color: 'var(--color-main-blue)' }}>
        Here is Dummy
      </h1>
      <p className="preRegular16" style={{ marginTop: '8px' }}>
        더미 데이터 생성 플랫폼에 오신 것을 환영합니다.
      </p>

      <button className="start-button preMedium16" onClick={() => navigate('/main')}>
        시작하기
      </button>
    </div>
  )
}

export default LandingPage
