import React, { useState } from 'react'
import InfoCard from './InfoCard'
import AISettingModal from '@renderer/modals/AISettingModal'

interface AIRecommendationItem {
  id: number
  icon: string
  title: string
  content: string
}

interface AIRecommendationProps {
  list?: AIRecommendationItem[]
  onRegenerate?: () => void
}

const AIRecommendation: React.FC<AIRecommendationProps> = ({ list = [], onRegenerate }) => {
  const [isAISettingOpen, setAISettingOpen] = useState(false)

  const handleOpenAISetting = (): void => {
    setAISettingOpen(true)
  }

  return (
    <>
      {/* AI 설정 모달 */}
      <AISettingModal isOpen={isAISettingOpen} onClose={() => setAISettingOpen(false)} />

      <style>
        {`
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
        `}
      </style>

      <div className="ai-section">
        {list.length > 0 ? (
          <div className="ai-section-grid">
            <div className="ai-header">
              <p className="ai-count">응답 {list.length}개</p>
              <button className="ai-regenerate-button" onClick={onRegenerate}>
                AI 응답 재생성
              </button>
            </div>

            {list.map((item) => (
              <InfoCard
                key={item.id}
                title={item.title}
                titleIcon={<span style={{ fontSize: '28px' }}>{item.icon}</span>}
                content={item.content}
                width="100%"
                variant="inner"
              />
            ))}
          </div>
        ) : (
          <div className="ai-empty-state">
            <p className="ai-empty-message">AI를 통해 인덱스 개선 추천을 받아보세요.</p>

            <button className="ai-generate-button" onClick={handleOpenAISetting}>
              AI 응답 생성
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default AIRecommendation
