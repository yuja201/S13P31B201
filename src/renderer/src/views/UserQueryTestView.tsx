import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toPng } from 'html-to-image'

import InfoCard from '@renderer/components/InfoCard'
import AIRecommendation from '@renderer/components/AIRecommendation'
import SummaryCards from '@renderer/components/SummaryCards'
import ResponseTimeChart from '@renderer/components/ResponseTimeChart'
import TestHeader from '@renderer/components/TestHeader'
import UserQueryTestModal from '@renderer/modals/UserQueryTestModal'
import { useToastStore } from '@renderer/stores/toastStore'

import type {
  Test,
  UserQueryTestResultJson,
  ExplainResult,
  AIRecommendationItem
} from '@shared/types'

const successIcon = new URL('@renderer/assets/imgs/success.svg', import.meta.url).href
const warningIcon = new URL('@renderer/assets/imgs/warning.svg', import.meta.url).href
const failureIcon = new URL('@renderer/assets/imgs/failure.svg', import.meta.url).href

/* 실행 계획 타입 한국어 변환 */
const planTypeMap: Record<string, string> = {
  'Seq Scan': '전체 테이블 스캔 (Seq Scan)',
  'Index Scan': '인덱스 스캔 (Index Scan)',
  'Index Only Scan': '인덱스 온리 스캔 (Index Only Scan)',
  'Bitmap Heap Scan': '비트맵 힙 스캔 (Bitmap Heap Scan)',
  'Bitmap Index Scan': '비트맵 인덱스 스캔 (Bitmap Index Scan)',
  'Nested Loop': '중첩 루프 조인 (Nested Loop)',
  'Hash Join': '해시 조인 (Hash Join)',
  'Merge Join': '머지 조인 (Merge Join)',
  Limit: 'LIMIT 적용 (Limit)',
  Sort: '정렬 수행 (Sort)'
}

/* =========================================================
    WARNING MESSAGE TRANSLATOR (Regex 기반 + 미번역 로깅)
========================================================= */

const warningPatterns: Array<{ regex: RegExp; translation: string }> = [
  {
    regex: /full table scan/i,
    translation: '전체 테이블 스캔이 감지되었습니다. WHERE 조건에 적절한 인덱스 추가를 고려하세요.'
  },
  {
    regex: /significantly exceed|actual rows.*greater/i,
    translation:
      '실제 처리된 행 수가 예측보다 크게 높습니다. ANALYZE 실행을 고려해 통계를 최신화하세요.'
  },
  {
    regex: /cost.*extremely high|very high cost/i,
    translation: '쿼리 비용이 매우 높습니다. 인덱스 최적화 또는 조건 재구성을 고려하세요.'
  },
  {
    regex: /large number of rows were scanned|inefficient index/i,
    translation: '인덱스 스캔이 사용되었지만 스캔된 행이 많습니다. 인덱스 선택도를 확인하세요.'
  }
]

const warningToKorean = (msg: string): string => {
  for (const p of warningPatterns) {
    if (p.regex.test(msg)) return p.translation
  }

  console.warn('%c[미번역 경고 메시지 감지]', 'color: orange; font-weight: bold', msg)

  return msg
}

const UserQueryTestView: React.FC = () => {
  const { testId } = useParams()
  const navigate = useNavigate()
  const [test, setTest] = useState<Test | null>(null)
  const [isRerunModalOpen, setRerunModalOpen] = useState(false)
  const showToast = useToastStore((s) => s.showToast)
  const [aiList, setAiList] = useState<AIRecommendationItem[]>([])
  const [aiRequested, setAiRequested] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const resultContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!testId) return

    window.api.tests.getById(Number(testId)).then((data?: Test | null) => {
      if (data) {
        try {
          setTest(data)
          const parsed: UserQueryTestResultJson = JSON.parse(data.result)
          setAiList(parsed.ai ?? [])
        } catch (error) {
          console.error('테스트 결과 파싱 실패:', error)
          setTest(data)
          setAiList([])
        }
      }
    })
  }, [testId])

  if (!test) return <div className="view-container">Loading...</div>

  const result: UserQueryTestResultJson = JSON.parse(test.result)
  const stats = result.stats
  const explain: ExplainResult = result.explain
  const warnings = result.warnings
  const query = result.query

  /* 성능 점수 UI */
  let perfIcon = successIcon
  let perfColor: 'green' | 'orange' | 'red' = 'green'

  if (stats.avg >= 100 && stats.avg < 300) {
    perfIcon = warningIcon
    perfColor = 'orange'
  } else if (stats.avg >= 300) {
    perfIcon = failureIcon
    perfColor = 'red'
  }

  /* AI 추천 생성 요청 */
  const handleAIGenerate = async (modelId: number): Promise<void> => {
    try {
      setAiRequested(true)
      setAiLoading(true)

      const res = await window.api.userQueryTest.AIGenerate({
        testId: test.id,
        projectId: test.project_id,
        query,
        modelId
      })

      setAiList(res.ai)
    } catch (error) {
      console.error(error)
      showToast('AI 추천 생성 중 오류가 발생했습니다.', 'error', 'AI 오류')
    } finally {
      setAiLoading(false)
    }
  }

  /* 캡처 다운로드 */
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
      if (!ctx) throw new Error('이미지 생성 실패')

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
      {/* 재실행 Modal */}
      <UserQueryTestModal
        isOpen={isRerunModalOpen}
        projectId={String(test.project_id)}
        initialQuery={query}
        initialCount={result.runCount}
        initialTimeout={result.timeout ?? 30}
        onClose={() => setRerunModalOpen(false)}
        onStart={async (newQuery, cnt, timeout) => {
          const res = await window.api.userQueryTest.run({
            projectId: Number(test.project_id),
            query: newQuery,
            runCount: cnt,
            timeout
          })
          return res.testId
        }}
        onNavigate={(newTestId) => {
          setRerunModalOpen(false)
          navigate(`/main/test/${test.project_id}/user-query/${newTestId}`)
        }}
      />

      <div className="view-container">
        <TestHeader
          title="사용자 쿼리 테스트"
          subtitle="테스트 결과를 확인해 보세요."
          onDownload={handleDownload}
          onRerunTest={() => setRerunModalOpen(true)}
        />

        {/* 캡처 영역 */}
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
                title={planTypeMap[explain.planType] ?? `실행 계획 (${explain.planType})`}
                content={`예측 행 수: ${explain.estimatedRows.toLocaleString()}`}
                titleIcon={<img src={warningIcon} alt="warning" width={24} height={24} />}
              />

              {'actualRows' in explain && (
                <InfoCard
                  title="실제 처리된 행 수"
                  content={explain.actualRows.toLocaleString()}
                  titleIcon={<img src={successIcon} alt="success" width={24} height={24} />}
                />
              )}

              {'cost' in explain && typeof explain.cost !== 'number' && (
                <InfoCard
                  title="총 비용 (쿼리 비용)"
                  content={String(explain.cost.total)}
                  titleIcon={<img src={successIcon} alt="success" width={24} height={24} />}
                />
              )}
            </div>
          </div>

          {/* 한국어 경고 메시지 */}
          {warnings.length > 0 && (
            <div className="section-gap">
              <h2 className="section-title preSemiBold20">경고</h2>
              {warnings.map((w, i) => (
                <InfoCard
                  key={i}
                  title="경고"
                  content={warningToKorean(w)}
                  titleIcon={<img src={warningIcon} alt="warning" width={24} height={24} />}
                />
              ))}
            </div>
          )}

          {/* AI 추천 */}
          <div className="section-gap">
            <h2 className="section-title preSemiBold20">AI 개선 추천</h2>
            <AIRecommendation
              list={aiList}
              loading={aiLoading}
              requested={aiRequested}
              onGenerate={handleAIGenerate}
            />
          </div>
        </div>
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
          margin-bottom: 16px;
          color: var(--color-text-strong);
        }
        .section-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
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
