import React from 'react'
import yujaWorking from '@renderer/assets/imgs/yuja_working.png'

const PreparationView: React.FC = () => {
  return (
    <div className="preparation-container">
      <img src={yujaWorking} alt="Coming Soon" className="preparation-image" />
      <h1 className="preparation-title">COMING SOON</h1>
      <p className="preparation-subtitle">
        조금만 기다려주세요.
        <br />
        새로운 기능을 준비중입니다.
      </p>

      <style>{`
        .preparation-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background-color: var(--color-background);
          text-align: center;
        }

        .preparation-image {
          width: 300px;
          height: 300px;
          object-fit: contain;
          margin-bottom: 20px;
        }

        .preparation-title {
          font-size: 50px;
          font-weight: 900;
          letter-spacing: 12px;
          margin-bottom: 20px;
          color: var(--color-black);
        }

        .preparation-subtitle {
          font-size: 20px;
          font-weight: 300;
          line-height: 1.6;
          color: var(--color-gray-600);
          white-space: pre-line;
        }
      `}</style>
    </div>
  )
}

export default PreparationView
