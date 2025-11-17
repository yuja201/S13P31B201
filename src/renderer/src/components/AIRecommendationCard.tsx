import React from 'react'
import type { AIRecommendationItem } from '@shared/types'

import { FiTool } from 'react-icons/fi'
import { VscSymbolKeyword } from 'react-icons/vsc'
import { BiEditAlt } from 'react-icons/bi'

interface Props {
  item: AIRecommendationItem
}

const AIRecommendationCard: React.FC<Props> = ({ item }) => {
  let IconComponent: React.ReactNode = null

  if (item.type === 'improve') {
    IconComponent = <FiTool size={24} color="#134686" />
  } else if (item.type === 'index') {
    IconComponent = <VscSymbolKeyword size={24} color="#15803d" />
  } else if (item.type === 'rewrite') {
    IconComponent = <BiEditAlt size={24} color="#d97706" />
  }

  return (
    <div className="ai-item-card">
      <div className="ai-item-header">
        <span className="ai-item-emoji">{IconComponent}</span>
        <h3 className="ai-item-title">{item.title}</h3>
      </div>

      <p className="ai-item-desc">{item.description}</p>

      <div className="ai-item-section">
        <h4>개선 제안</h4>
        <p>{item.suggestion}</p>
      </div>

      {item.exampleSQL && (
        <div className="ai-item-section">
          <h4>예시 SQL</h4>
          <pre className="ai-item-sql">{item.exampleSQL}</pre>
        </div>
      )}

      <style>{`
        .ai-item-card {
          background: white;
          padding: 18px 22px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ai-item-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ai-item-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .ai-item-desc {
          margin: 0;
          color: #475569;
          line-height: 1.5;
        }

        .ai-item-section h4 {
          margin: 0 0 4px 0;
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
        }

        .ai-item-sql {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 8px;
          white-space: pre-wrap;
          font-family: monospace;
          font-size: 14px;
          color: #1e293b;
        }
      `}</style>
    </div>
  )
}

export default AIRecommendationCard
