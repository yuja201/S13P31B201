import React from 'react'
import { SiSpeedtest } from 'react-icons/si'
import Button from './Button'

interface Metric {
  label: string
  value: string | number
}

interface TestCardProps {
  title: string
  description: string
  metrics: Metric[]
  onStart: () => void
}

const TestCard: React.FC<TestCardProps> = ({ title, description, metrics, onStart }) => {
  return (
    <>
      <div className="test-card">
        {/* 헤더 영역 */}
        <div className="test-card__header">
          <div className="test-card__icon">
            <SiSpeedtest size={28} color="#134686" />
          </div>
          <div>
            <div className="test-card__title">{title}</div>
            <div className="test-card__desc">{description}</div>
          </div>
        </div>

        {/* 지표 영역 */}
        <div className="test-card__metrics">
          {metrics.map((m, idx) => (
            <div key={idx} className="test-card__metric">
              <div className="test-card__metric-label">{m.label}</div>
              <div className="test-card__metric-value">{m.value}</div>
            </div>
          ))}
        </div>

        {/* 버튼 영역 */}
        <div className="test-card__footer">
          <Button variant="blue" size="md" onClick={onStart}>
            테스트 시작 →
          </Button>
        </div>
      </div>

      <style>{`
        .test-card {
          background-color: var(--color-white);
          border: 1px solid var(--color-gray-200);
          border-radius: 16px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          padding: 32px 40px;
          width: 480px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          box-sizing: border-box;
        }

        /* 헤더 */
        .test-card__header {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          text-align: left;
          width: 100%;
        }

        .test-card__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          background-color: var(--color-light-blue);
          border-radius: 50%;
        }

        .test-card__title {
          font: var(--preSemiBold24);
          color: var(--color-black);
        }

        .test-card__desc {
          font: var(--preRegular16);
          color: var(--color-dark-gray);
          margin-top: 2px;
        }

        /* 지표 */
        .test-card__metrics {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 24px;
          width: 100%;
          flex-wrap: wrap;
        }

        .test-card__metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 130px;
          height: 130px;
          flex-shrink: 0;
          border: 2px solid var(--color-gray-blue);
          border-radius: 50%;
          text-align: center;
          box-sizing: border-box;
        }

        .test-card__metric-label {
          font: var(--preRegular16);
          color: var(--color-dark-gray);
        }

        .test-card__metric-value {
          font: var(--preSemiBold24);
          color: var(--color-main-blue);
          margin-top: 4px;
        }

        /* 버튼 */
        .test-card__footer {
          display: flex;
          justify-content: center;
          width: 100%;
        }
      `}</style>
    </>
  )
}

export default TestCard
