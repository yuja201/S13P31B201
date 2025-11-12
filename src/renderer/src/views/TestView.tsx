import React from 'react'
import PageTitle from '@renderer/components/PageTitle'
import TestSummaryCard from '@renderer/components/TestSummaryCard'
import TestCard from '@renderer/components/TestCard'

const TestView: React.FC = () => {
  const statsData = [
    { name: 'Mon', value: 10 },
    { name: 'Tue', value: 40 },
    { name: 'Wed', value: 20 },
    { name: 'Thu', value: 70 },
    { name: 'Fri', value: 30 },
    { name: 'Sat', value: 80 },
    { name: 'Sun', value: 50 }
  ]

  return (
    <div className="test-main-container">
      {/* 상단 헤더 */}
      <section className="test-main-header">
        <PageTitle
          title="DB 성능 테스트"
          description="사용자 쿼리 및 인덱스 테스트를 통해 데이터베이스의 성능을 확인하세요."
        />
      </section>

      {/* 테스트 히스토리 */}
      <section className="test-history-section">
        <h2 className="preSemiBold24 section-title">테스트 히스토리</h2>
        <div className="stats-card-grid">
          <TestSummaryCard
            title="총 테스트 횟수"
            subtitle="사용자 쿼리. 인덱스 테스트"
            total={107}
            currentWeek={26}
            changePercent={40}
            data={statsData}
            positive
          />
          <TestSummaryCard
            title="평균 개선율"
            subtitle="인덱스 테스트"
            total={18}
            currentWeek={20}
            changePercent={3}
            data={statsData}
            positive
          />
          <TestSummaryCard
            title="평균 개선율"
            subtitle="사용자 쿼리 테스트"
            total={79}
            currentWeek={80}
            changePercent={-3}
            data={statsData}
            positive={false}
          />
        </div>
      </section>

      {/* 사용자 테스트 카드 */}
      <section className="test-card-section">
        <div className="test-card-grid">
          <TestCard
            title="사용자 쿼리 테스트"
            description="사용자 쿼리 성능 분석 및 최적화 방안을 제안"
            metrics={[
              { label: '테스트 수', value: 107 },
              { label: '평균 응답', value: '12.3m' },
              { label: '최적화 완료', value: 892 }
            ]}
            onStart={() => console.log('사용자 쿼리 테스트 시작')}
          />
          <TestCard
            title="인덱스 테스트"
            description="사용자 쿼리 성능 분석 및 최적화 방안을 제안"
            metrics={[
              { label: '테스트 수', value: 107 },
              { label: '평균 응답', value: '12.3m' },
              { label: '최적화 완료', value: 892 }
            ]}
            onStart={() => console.log('인덱스 테스트 시작')}
          />
        </div>
      </section>

      <style>{`
        /* 전체 컨테이너 */
        .test-main-container {
          display: flex;
          flex-direction: column;
          gap: 48px;
          width: 100%;
          height: 100%;
          padding-bottom: 48px;
          overflow-y: auto;
          box-sizing: border-box;
        }

        .section-title {
          margin-bottom: 24px;
          color: var(--color-black);
        }

        /* 테스트 히스토리 */
        .stats-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          justify-content: center;
          gap: 24px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        /* 테스트 카드 */
        .test-card-section {
          margin-top: 24px;
        }

        .test-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
          justify-content: center;
          align-items: start;
          gap: 32px;
          width: 100%;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .test-card-grid > * {
          min-width: 0;
        }
      `}</style>
    </div>
  )
}

export default TestView
