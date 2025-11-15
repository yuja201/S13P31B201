import React, { useState } from 'react'
import AIRecommendationCard from './AIRecommendationCard'
import UserQueryAIModal from '@renderer/modals/UserQueryAIModal'
import LoadingSpinner from '@renderer/components/LoadingSpinner'
import { AIRecommendationItem } from '@shared/types'

interface AIRecommendationProps {
  list: AIRecommendationItem[]
  loading: boolean
  requested: boolean
  onGenerate?: (modelId: number) => void
  onRegenerate?: () => void
}

const AIRecommendation: React.FC<AIRecommendationProps> = ({
  list = [],
  loading,
  requested,
  onGenerate,
  onRegenerate
}) => {
  const [isAISettingOpen, setAISettingOpen] = useState(false)

  const handleSubmit = (modelId: number): void => {
    setAISettingOpen(false)
    onGenerate?.(modelId)
  }

  return (
    <>
      <UserQueryAIModal
        isOpen={isAISettingOpen}
        onClose={() => setAISettingOpen(false)}
        onSubmit={handleSubmit}
      />

      <style>{`
        .ai-section {
          background: white;
          padding: 30px;
          border-radius: 12px;
          border: 1px solid var(--color-gray-200, #e5e7eb);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
        }

        .ai-section-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .ai-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ai-count {
          font: var(--preRegular16);
          color: var(--color-dark-gray);
          margin: 0;
        }

        .ai-regenerate-button {
          padding: 4px 18px;
          background-color: var(--color-main-blue);
          color: white;
          border: none;
          border-radius: 8px;
          font: var(--preSemiBold14);
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .ai-regenerate-button:hover {
          background-color: #0d3a6b;
        }

        .ai-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px 0;
          gap: 20px;
        }

        .ai-empty-message {
          font: var(--preRegular16);
          text-align: center;
        }

        .ai-empty-text {
          font: var(--preRegular16);
          color: var(--color-dark-gray);
          text-align: center;
        }

        .ai-generate-button {
          padding: 8px 40px;
          background-color: var(--color-main-blue);
          color: white;
          border: none;
          border-radius: 8px;
          font: var(--preSemiBold14);
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .ai-generate-button:hover {
          background-color: #0d3a6b;
        }
      `}</style>

      <div className="ai-section">
        {/* 0) 로딩 */}
        {requested && loading && (
          <div className="ai-empty-state">
            <LoadingSpinner
              text="AI가 쿼리를 분석 중입니다..."
              width={500}
              size={60}
              background="#ffffff"
            />
          </div>
        )}

        {/* 1) 정상 응답 */}
        {!loading && list.length > 0 && (
          <div className="ai-section-grid">
            <div className="ai-header">
              <p className="ai-count">응답 {list.length}개</p>
              <button className="ai-regenerate-button" onClick={onRegenerate}>
                AI 응답 재생성
              </button>
            </div>

            {list.map((item) => (
              <AIRecommendationCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* 2) 요청 후 빈 응답 → 개선 없음 */}
        {!loading && requested && list.length === 0 && (
          <div className="ai-empty-state">
            <p className="ai-empty-text">AI 분석 결과 개선할 부분이 없습니다.</p>
          </div>
        )}

        {/* 3) 요청 전 */}
        {!requested && list.length === 0 && (
          <div className="ai-empty-state">
            <p className="ai-empty-message">AI를 통해 쿼리 개선 추천을 받아보세요.</p>

            <button className="ai-generate-button" onClick={() => setAISettingOpen(true)}>
              AI 응답 생성
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default AIRecommendation
