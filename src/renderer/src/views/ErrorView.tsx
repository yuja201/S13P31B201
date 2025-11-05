import React from 'react'
import { useNavigate } from 'react-router-dom'
import yujaSweating from '../assets/imgs/yuja_sweating.png'

const ErrorView: React.FC = () => {
  const navigate = useNavigate()

  const handleBack = (): void => {
    // 히스토리가 있는지 확인
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      // 히스토리가 없으면 메인 페이지로
      navigate('/')
    }
  }

  return (
    <div className="error-view-container">
      <img src={yujaSweating} alt="Error" className="error-image" />
      <h1 className="preSemiBold30 error-title">오류가 발생했습니다.</h1>
      <div className="preMedium20 error-back-link" onClick={handleBack}>
        ← 이전으로
      </div>

      <style>{`
        .error-view-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
        }

        .error-image {
          width: 300px;
          height: 300px;
          object-fit: contain;
        }

        .error-title {
          margin-top: 20px;
        }

        .error-back-link {
          margin-top: 20px;
          color: var(--color-main-blue);
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .error-back-link:hover {
          opacity: 0.7;
        }
      `}</style>
    </div>
  )
}

export default ErrorView
