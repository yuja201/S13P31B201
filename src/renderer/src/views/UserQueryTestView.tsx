import React from 'react'
import InfoCard from '@renderer/components/InfoCard'
import AIRecommendation from '@renderer/components/AIRecommendation'
import SummaryCards from '@renderer/components/SummaryCards'
import ResponseTimeChart from '@renderer/components/ResponseTimeChart'
import TestHeader from '@renderer/components/TestHeader'

const successIcon = new URL('@renderer/assets/imgs/success.svg', import.meta.url).href
const warningIcon = new URL('@renderer/assets/imgs/warning.svg', import.meta.url).href

const UserQueryTestView: React.FC = () => {
  const aiRecommendations = []

  /** 🔹 테스트 다시 실행 */
  const handleRerunTest = (): void => {
    console.log('테스트 다시 실행')
    // TODO: 실제 쿼리 재테스트 로직 연결
  }

  /** 🔹 결과 다운로드 */
  const handleDownload = (): void => {
    console.log('테스트 결과 다운로드')
    // TODO: 결과 내보내기 로직 연결
  }

  return (
    <>
      <div className="view-container">
        {/* 페이지 제목 + 버튼 */}
        <TestHeader
          title="사용자 쿼리 테스트"
          subtitle="테스트할 쿼리를 입력하고 성능을 확인해 보세요."
          onDownload={handleDownload}
          onRerunTest={handleRerunTest}
        />

        {/* 테스트 통계 */}
        <div className="section-gap">
          <h2 className="section-title preSemiBold20">테스트 통계</h2>
          <SummaryCards
            mainCard={{
              icon: warningIcon,
              title: '성능 점수',
              value: '167ms',
              color: 'orange'
            }}
            subCard={{
              stats: [
                { label: '총 실행 횟수', value: 50 },
                { label: '성공', value: 50, color: 'green' },
                { label: '실패', value: 0, color: 'red' }
              ]
            }}
          />
        </div>

        {/* 응답시간 분포 */}
        <div className="section-gap">
          <h2 className="section-title preSemiBold20">응답시간 분포</h2>
          <ResponseTimeChart
            //TODO: 실제 응답시간으로 변경
            responseTimes={[38, 45, 67, 89, 125, 140].map((v) => v + Math.floor(Math.random() * 5))}
          />
        </div>

        {/* 쿼리 실행 계획 분석 */}
        <div className="section-gap">
          <h2 className="section-title preSemiBold20">쿼리 실행 계획 분석</h2>
          <div className="section-grid">
            <InfoCard
              title="Seq Scan 감지"
              content="users 테이블 (1,245,800 rows)"
              titleIcon={<img src={warningIcon} alt="warning" width={24} height={24} />}
            />
            <InfoCard
              title="Index Scan 사용"
              content="orders 테이블 (idx_user_id)"
              titleIcon={<img src={successIcon} alt="success" width={24} height={24} />}
            />
          </div>
        </div>
        {/* AI 개선 추천 */}
        <div className="section-gap">
          <h2 className="section-title preSemiBold20">AI 개선 추천</h2>
          <AIRecommendation list={aiRecommendations} />
        </div>
      </div>

      {/* 스타일 정의 */}
      <style>{`
        .view-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          overflow-y: auto;
          background-color: var(--color-bg);
        }

        .section-gap {
          margin-bottom: 14px;
          background-color: var(--color-bg-card);
        }

        .section-title {
          color: var(--color-text-strong);
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

export default UserQueryTestView
