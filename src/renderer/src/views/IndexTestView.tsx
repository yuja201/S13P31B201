import React from 'react'
import InfoCard from '@renderer/components/InfoCard'
import warningIcon from '@renderer/assets/imgs/warning.svg'
import AIRecommendation from '@renderer/components/AIRecommendation'
import TestHeader from '@renderer/components/TestHeader'
import SummaryCards from '@renderer/components/SummaryCards'

const IndexTestView: React.FC = () => {
  // TODO: 실제 기능 구현
  const handleRerunTest = (): void => {
    console.log('테스트 재실행')
  }
  const handleDownload = (): void => {
    console.log('결과 다운로드')
  }

  // TODO: 요약 정보 파싱
  const summaryMainCard = {
    icon: warningIcon,
    title: '정상 인덱스 비율',
    value: '50%',
    color: 'orange' as const
  }
  const summarySubCardStats = [
    { label: '정상', value: 10, color: 'green' as const },
    { label: '미사용', value: 7, color: 'red' as const },
    { label: '저효율', value: 3, color: 'orange' as const }
  ]

  // TODO: 실제 데이터 파싱
  const indexData = [
    {
      id: 1,
      title: 'idx_test_1',
      badge: {
        text: '저효율',
        color: 'yellow' as const
      },
      content: '크기: 10MB  스캔: 14,525회  생성: 2025-11-06  카디널리티: 0.004%  고유값: 3개'
    },
    {
      id: 2,
      title: 'idx_user_email',
      badge: {
        text: '미사용',
        color: 'red' as const
      },
      content: '크기: 25MB 스캔: 8,320회  생성: 2025-10-15  카디널리티: 98.5%  고유값: 1,245,890개'
    }
  ]
  const aiRecommendations = [
    {
      id: 1,
      icon: '📝',
      title: "'idx_orders_user_created'를 수정하세요.",
      content:
        '테이블: orders  컬럼: user_id, created_at\n사용자별 최근 주문 조회 시 두 컬럼을 함께 사용합니다.'
    },
    {
      id: 2,
      icon: '➕',
      title: "'idx_orders_user_created'를 추가해보세요.",
      content:
        '테이블: orders  컬럼: user_id, created_at\n사용자별 최근 주문 조회 시 두 컬럼을 함께 사용합니다.'
    },
    {
      id: 3,
      icon: '➖',
      title: "'idx_orders_user_created'를 삭제해보세요.",
      content:
        '테이블: orders  컬럼: user_id, created_at\n사용자별 최근 주문 조회 시 두 컬럼을 함께 사용합니다.'
    }
  ]

  return (
    <>
      <div className="view-container">
        <TestHeader
          title="사용자 쿼리 테스트 결과"
          subtitle="테스트 결과를 확인하고 다시 실행할 수 있습니다."
          onRerunTest={handleRerunTest}
          onDownload={handleDownload}
        />

        <SummaryCards
          mainCard={summaryMainCard}
          subCard={{
            stats: summarySubCardStats
          }}
        />

        <div className="index-section-gap">
          <h2 className="section-title preSemiBold20">보완 인덱스 목록</h2>
          <div className="section-grid">
            {indexData.map((index) => (
              <InfoCard
                key={index.id}
                title={index.title}
                badge={index.badge}
                content={index.content}
                width="100%"
              />
            ))}
          </div>
        </div>

        <div className="ai-section-gap">
          <h2 className="section-title preSemiBold20">AI 개선 추천</h2>
          <AIRecommendation />
          <AIRecommendation list={aiRecommendations} />
        </div>
      </div>
      <style>{`
        .view-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          overflow-y: auto;
        }

        .index-section-gap {
          margin-top: 20px;
        }

        .ai-section-gap {
          margin-top: 40px;
        }

        .section-title {
          color: var(--color-black);
          margin-bottom: 16px;
        }

        .section-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
      `}</style>
    </>
  )
}

export default IndexTestView
