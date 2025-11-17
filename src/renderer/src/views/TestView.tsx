import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageTitle from '@renderer/components/PageTitle'
import TestSummaryCard from '@renderer/components/TestSummaryCard'
import TestCard from '@renderer/components/TestCard'
import UserQueryTestModal from '@renderer/modals/UserQueryTestModal'
import type { DashboardData } from '@shared/types'

const TestView: React.FC = () => {
  const [isQueryModalOpen, setQueryModalOpen] = useState(false)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)

  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()

  // 숫자 포맷
  const formatNumber = (value: number | null | undefined): number => {
    if (value === null || value === undefined || isNaN(value)) return 0
    return Number(value.toFixed(1))
  }

  // 최근 7일 날짜 배열
  const getLast7Days = (): string[] => {
    const arr: string[] = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      arr.push(d.toISOString().split('T')[0])
    }
    return arr
  }

  // 주간 그래프 정규화 (여유 공간 추가)
  const normalizeDaily = (
    days: string[],
    map: Record<string, number>
  ): { name: string; value: number }[] => {
    const rawData = days.map((day) => ({
      name: day,
      value: formatNumber(map[day] ?? 0)
    }))

    const values = rawData.map((d) => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)

    // 모든 값이 같으면 중간값 반환
    if (max === min) {
      return rawData.map((d) => ({ ...d, value: 50 }))
    }

    // 0~100 범위로 정규화하되, 상하 10%씩 여유 공간 확보
    return rawData.map((d) => ({
      ...d,
      value: 10 + ((d.value - min) / (max - min)) * 80
    }))
  }

  // 0~100 스케일 정규화 (여유 공간 추가)
  const normalizeGraph = (
    data: { name: string; value: number }[]
  ): { name: string; value: number }[] => {
    const values = data.map((d) => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)

    // 모든 값이 같으면 중간값 반환
    if (max === min) {
      return data.map((d) => ({ ...d, value: 50 }))
    }

    // 0~100 범위로 정규화하되, 상하 10%씩 여유 공간 확보
    return data.map((d) => ({
      ...d,
      value: 10 + ((d.value - min) / (max - min)) * 80
    }))
  }

  // 대시보드 데이터 로드
  const loadDashboardData = useCallback(async () => {
    const data = await window.api.test.getDashboardData(Number(projectId))
    setDashboard(data)
  }, [])

  useEffect(() => {
    void loadDashboardData()
  }, [loadDashboardData])

  if (dashboard === null) return <div>Loading...</div>

  const days = getLast7Days()

  // 총 테스트 그래프
  const totalMap: Record<string, number> = {}
  dashboard.weeklyTotalStats.forEach((d) => {
    totalMap[d.date] = Number(d.count)
  })
  const weeklyTotalGraph = normalizeDaily(days, totalMap)

  // 응답시간 그래프
  const queryMap: Record<string, number> = {}
  dashboard.weeklyQueryStats.forEach((d) => {
    queryMap[d.date] = d.avg_response_time ?? 0
  })
  const weeklyQueryGraphRaw = normalizeDaily(days, queryMap)
  const weeklyQueryGraph = normalizeGraph(weeklyQueryGraphRaw)

  // 인덱스 사용율 그래프
  const indexMap: Record<string, number> = {}
  dashboard.weeklyIndexStats.forEach((d) => {
    indexMap[d.date] = d.avg_index_ratio ?? 0
  })
  const weeklyIndexGraphRaw = normalizeDaily(days, indexMap)
  const weeklyIndexGraph = normalizeGraph(weeklyIndexGraphRaw)

  const totalTests = dashboard.querySummary.count + dashboard.indexSummary.count

  return (
    <div className="test-main-container">
      {/* 사용자 쿼리 테스트 모달 */}
      <UserQueryTestModal
        isOpen={isQueryModalOpen}
        projectId={projectId ?? ''}
        onClose={() => setQueryModalOpen(false)}
        onStart={async (query, cnt, timeout) => {
          const res = await window.api.userQueryTest.run({
            projectId: Number(projectId),
            query,
            runCount: cnt,
            timeout
          })
          return res.testId
        }}
        onNavigate={(newTestId) => {
          setQueryModalOpen(false)
          void loadDashboardData()
          navigate(`/main/test/${projectId}/user-query/${newTestId}`)
        }}
      />

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

        <div className="aligned-grid stats-card-grid">
          <TestSummaryCard
            title="총 테스트 횟수"
            subtitle="사용자 쿼리. 인덱스 테스트"
            total={totalTests}
            currentWeek={dashboard.thisWeek}
            changePercent={formatNumber(dashboard.growthRate)}
            data={weeklyTotalGraph}
            positive={dashboard.growthRate >= 0}
            unit="번"
            currentPrefix="이번 주"
            showUnitAfterTotal
          />

          <TestSummaryCard
            title="인덱스 사용율"
            subtitle="인덱스 테스트"
            total={formatNumber(dashboard.indexSummary.avg_value)}
            currentWeek={formatNumber(indexMap[days.at(-1)!] ?? 0)}
            changePercent={formatNumber(dashboard.indexChangeRate)}
            data={weeklyIndexGraph}
            positive
            unit="%"
            currentPrefix="최근 사용율"
            showUnitAfterTotal
          />

          <TestSummaryCard
            title="평균 응답 시간"
            subtitle="사용자 쿼리 테스트"
            total={formatNumber(dashboard.querySummary.avg_value)}
            currentWeek={formatNumber(queryMap[days.at(-1)!] ?? 0)}
            changePercent={formatNumber(dashboard.queryChangeRate)}
            data={weeklyQueryGraph}
            positive
            unit="ms"
            currentPrefix="최근 응답"
            showUnitAfterTotal
          />
        </div>
      </section>

      {/* 하단 TestCard */}
      <section className="test-card-section">
        <div className="aligned-grid test-card-grid">
          <TestCard
            title="인덱스 테스트"
            description="데이터베이스 인덱스 분석 및 최적화 방안을 제안"
            metrics={[
              { label: '테스트 수', value: dashboard.indexSummary.count },
              {
                label: '평균 사용율',
                value: `${formatNumber(dashboard.indexSummary.avg_value)} %`
              }
            ]}
            onStart={() => navigate(`/main/test/${projectId}/index`)}
          />

          <TestCard
            title="사용자 쿼리 테스트"
            description="사용자 쿼리 성능 분석 및 최적화 방안을 제안"
            metrics={[
              { label: '테스트 수', value: dashboard.querySummary.count },
              {
                label: '평균 응답',
                value: `${formatNumber(dashboard.querySummary.avg_value)} ms`
              }
            ]}
            onStart={() => setQueryModalOpen(true)}
          />
        </div>
      </section>

      <style>{`
        /* 공통 컨테이너 */
        .test-main-container {
          display: flex;
          flex-direction: column;
          gap: 48px;
          width: 100%;
          height: 100%;
          padding-bottom: 48px;
          padding-right: 5px;
          overflow-y: auto;
          box-sizing: border-box;
        }

        .section-title {
          margin-bottom: 24px;
          color: var(--color-black);
        }

        /* 공통 정렬 래퍼 */
        .aligned-grid {
          display: grid;
          justify-content: space-between;
          width: 100%;
          max-width: 1040px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        /* 상단 Summary 카드 */
        .stats-card-grid {
          grid-template-columns: repeat(3, 325px);
          gap: 24px;
        }

        /* 하단 TestCard */
        .test-card-grid {
          grid-template-columns: repeat(2, 480px);
          gap: 32px;
        }

        /* 반응형 대응 */
        @media (max-width: 1080px) {
          .stats-card-grid {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            justify-content: center;
          }
          .test-card-grid {
            grid-template-columns: repeat(auto-fit, minmax(440px, 1fr));
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default TestView
