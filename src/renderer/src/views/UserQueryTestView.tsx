import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { toPng } from 'html-to-image'

import InfoCard from '@renderer/components/InfoCard'
import AIRecommendation from '@renderer/components/AIRecommendation'
import SummaryCards from '@renderer/components/SummaryCards'
import ResponseTimeChart from '@renderer/components/ResponseTimeChart'
import TestHeader from '@renderer/components/TestHeader'
import UserQueryTestModal from '@renderer/modals/UserQueryTestModal'
import { useNavigate } from 'react-router-dom'
import { useToastStore } from '@renderer/stores/toastStore'

import type { Test, UserQueryTestResultJson, ExplainResult } from '@shared/types'

interface AIRecommendationItem {
  id: number
  icon: string
  title: string
  content: string
}

const successIcon = new URL('@renderer/assets/imgs/success.svg', import.meta.url).href
const warningIcon = new URL('@renderer/assets/imgs/warning.svg', import.meta.url).href
const failureIcon = new URL('@renderer/assets/imgs/failure.svg', import.meta.url).href

const UserQueryTestView: React.FC = () => {
  const { testId } = useParams()
  const [test, setTest] = useState<Test | null>(null)
  const navigate = useNavigate()
  const [isRerunModalOpen, setRerunModalOpen] = useState(false)
  const showToast = useToastStore((s) => s.showToast)
  const [aiList, setAiList] = useState<AIRecommendationItem[]>([])

  // 메인 컨텐츠 캡처를 위한 ref
  const resultContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!testId) return
    window.api.tests.getById(Number(testId)).then((data: Test | undefined) => {
      if (data) setTest(data)
    })
  }, [testId])

  if (!test) return <div className="view-container">Loading...</div>

  const result: UserQueryTestResultJson = JSON.parse(test.result)
  const stats = result.stats
  const explain: ExplainResult = result.explain
  const warnings = result.warnings
  const query = result.query

  /** -----------------------------------------------------
   *  SummaryCards 응답속도 자동 평가 로직
   *  기준:
   *  - 0 ~ 100ms: 빠름 (green)
   *  - 100 ~ 300ms: 주의 (orange)
   *  - 300ms 이상: 느림 (red)
   * ----------------------------------------------------- */
  let perfIcon = successIcon
  let perfColor: 'green' | 'orange' | 'red' = 'green'

  if (stats.avg >= 100 && stats.avg < 300) {
    perfIcon = warningIcon
    perfColor = 'orange'
  } else if (stats.avg >= 300) {
    perfIcon = failureIcon
    perfColor = 'red'
  }

  const handleRerunTest = (): void => {
    setRerunModalOpen(true)
  }

  const handleAIGenerate = async (modelId: number): Promise<void> => {
    try {
      const res = await window.api.userQueryTest.AIGenerate({
        projectId: test.project_id,
        query,
        modelId
      })

      setAiList([
        {
          id: 1,
          icon: '🤖',
          title: 'AI 추천 결과',
          content: res.ai
        }
      ])
    } catch (error) {
      console.error(error)
      showToast('AI 추천 생성 중 오류가 발생했습니다.', 'error', 'AI 오류')
    }
  }

  /** -----------------------------------------------------
   *  다운로드 기능
   * ----------------------------------------------------- */
  const handleDownload = async (): Promise<void> => {
    if (!resultContainerRef.current) return

    try {
      const originalDataUrl = await toPng(resultContainerRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#f7f8fa'
      })

      const img = new Image()
      img.src = originalDataUrl

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = () => reject(new Error('이미지 생성 실패'))
      })

      const padding = 40

      const canvas = document.createElement('canvas')
      canvas.width = img.width + padding * 2
      canvas.height = img.height + padding * 2

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('테스트 결과 이미지를 생성할 수 없습니다.')
      }

      ctx.fillStyle = '#f7f8fa'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, padding, padding)

      const link = document.createElement('a')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      link.download = `user_query_test_${timestamp}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      window.api.logger.error('쿼리 테스트 결과 이미지 다운로드 실패:', error)
    }
  }

  return (
    <>
      <UserQueryTestModal
        isOpen={isRerunModalOpen}
        projectId={String(test.project_id)}
        initialQuery={query}
        initialCount={result.runCount}
        initialTimeout={result.timeout ?? 30}
        onClose={() => setRerunModalOpen(false)}
        onStart={(newQuery, cnt, timeout) => {
          window.api.userQueryTest
            .run({
              projectId: Number(test.project_id),
              query: newQuery,
              runCount: cnt,
              timeout
            })
            .then((res) => {
              const testId = res.testId
              navigate(`/main/test/${test.project_id}/user-query/${testId}`)
              setRerunModalOpen(false)
            })
            .catch((error) => {
              window.api.logger.error('쿼리 테스트 재실행 실패:', error)

              showToast('쿼리 재실행 중 오류가 발생했습니다.', 'error', '재실행 실패')
            })
        }}
      />

      <div className="view-container">
        {/* 페이지 제목*/}
        <TestHeader
          title="사용자 쿼리 테스트"
          subtitle="테스트 결과를 확인해 보세요."
          onDownload={handleDownload}
          onRerunTest={handleRerunTest}
        />

        {/*여기부터 캡처 영역 */}
        <div className="capture" ref={resultContainerRef}>
          <pre className="sql-code preRegular20">{query}</pre>

          {/* 테스트 통계 */}
          <div className="section-gap">
            <h2 className="section-title preSemiBold20">테스트 통계</h2>

            <SummaryCards
              mainCard={{
                icon: perfIcon,
                title: '성능 점수',
                value: `${stats.avg}ms`,
                color: perfColor
              }}
              subCard={{
                stats: [
                  { label: '총 실행 횟수', value: result.runCount },
                  { label: '최소 응답시간', value: stats.min, color: 'green' },
                  { label: '최대 응답시간', value: stats.max, color: 'red' }
                ]
              }}
            />
          </div>

          {/* 응답시간 분포 */}
          <div className="section-gap">
            <h2 className="section-title preSemiBold20">응답시간 분포</h2>
            <ResponseTimeChart responseTimes={result.responseTimes} />
          </div>

          {/* 실행 계획 분석 */}
          <div className="section-gap">
            <h2 className="section-title preSemiBold20">쿼리 실행 계획 분석</h2>
            <div className="section-grid">
              <InfoCard
                title={explain.planType}
                content={`Estimated Rows: ${explain.estimatedRows}`}
                titleIcon={<img src={warningIcon} alt="warning" width={24} height={24} />}
              />

              {'actualRows' in explain && (
                <InfoCard
                  title="Actual Rows"
                  content={String(explain.actualRows)}
                  titleIcon={<img src={successIcon} alt="success" width={24} height={24} />}
                />
              )}

              {'cost' in explain && typeof explain.cost !== 'number' && (
                <InfoCard
                  title="Total Cost"
                  content={String(explain.cost.total)}
                  titleIcon={<img src={successIcon} alt="success" width={24} height={24} />}
                />
              )}
            </div>
          </div>

          {/* 경고 표시 */}
          {warnings.length > 0 && (
            <div className="section-gap">
              <h2 className="section-title preSemiBold20">경고</h2>
              {warnings.map((w, i) => (
                <InfoCard
                  key={i}
                  title="Warning"
                  content={w}
                  titleIcon={<img src={warningIcon} alt="warning" width={24} height={24} />}
                />
              ))}
            </div>
          )}

          {/* AI 추천 */}
          <div className="section-gap">
            <h2 className="section-title preSemiBold20">AI 개선 추천</h2>
            <AIRecommendation list={aiList} onGenerate={handleAIGenerate} />
          </div>
        </div>
        {/* 캡처 영역 끝 */}
      </div>

      {/* 스타일 */}
      <style>{`
        .view-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          overflow-y: auto;
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

        /* SQL Code Box */
        .sql-code {
          margin: 0 0 15px 0;
          padding: 16px;
          background-color: white;
          border-radius: 6px;
          color: #334155;
          line-height: 1.6;
          white-space: pre-wrap;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </>
  )
}

export default UserQueryTestView
