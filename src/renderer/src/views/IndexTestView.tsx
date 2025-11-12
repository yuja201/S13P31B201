import React from 'react'
import InfoCard from '@renderer/components/InfoCard'
import PageTitle from '@renderer/components/PageTitle'
import AIRecommendation from '@renderer/components/AIRecommendation'

const IndexTestView: React.FC = () => {
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
        <PageTitle
          title="인덱스 테스트 결과"
          description="인덱스 효율성 분석 및 최적화 제안을 확인해보세요."
        />

        <div className="section-gap">
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

        <div className="section-gap">
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

        .section-gap {
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
