import React, { useEffect, useMemo } from 'react'
import InfoCard from '@renderer/components/InfoCard'
import warningIcon from '@renderer/assets/imgs/warning.svg'
import successIcon from '@renderer/assets/imgs/success.svg'
import failureIcon from '@renderer/assets/imgs/failure.svg'
import yujaWorking from '@renderer/assets/imgs/yuja_working.png'
import yuja from '@renderer/assets/imgs/yuja.png'
import TestHeader from '@renderer/components/TestHeader'
import SummaryCards from '@renderer/components/SummaryCards'
import LoadingSpinner from '@renderer/components/LoadingSpinner'
import ErrorView from '@renderer/views/ErrorView'
import { useIndexTest } from '@renderer/hooks/useIndexTest'
import { useProjectStore } from '@renderer/stores/projectStore'

const IndexTestView: React.FC = () => {
  const { selectedProject } = useProjectStore()
  const { isAnalyzing, analysisResult, error, analyzeIndexes, clearResult } = useIndexTest()

  const databaseId = selectedProject?.database?.id

  // 컴포넌트 마운트 시 분석 실행
  useEffect(() => {
    if (databaseId) {
      analyzeIndexes(databaseId)
    }
    return () => clearResult()
  }, [databaseId, analyzeIndexes, clearResult])

  // 분석 완료 시 자동 저장
  useEffect(() => {
    const saveTestResult = async (): Promise<void> => {
      if (!analysisResult || !selectedProject) return

      const totalIndexes = analysisResult.totalIndexes
      if (totalIndexes === 0) return
      let criticalIndexesCount = 0
      let recommendedIndexesCount = 0

      for (const index of analysisResult.indexes) {
        if (index.issues.length === 0) continue
        const hasCriticalIssue = index.issues.some((issue) => issue.severity === 'critical')
        if (hasCriticalIssue) {
          criticalIndexesCount++
        } else {
          recommendedIndexesCount++
        }
      }

      const indexesWithIssuesCount = criticalIndexesCount + recommendedIndexesCount
      const healthyIndexes = totalIndexes - indexesWithIssuesCount
      const healthRatio = totalIndexes > 0 ? (healthyIndexes / totalIndexes) * 100 : 0

      const testData = {
        project_id: selectedProject.id,
        type: 'INDEX' as const,
        summary: `정상: ${healthyIndexes}개, 심각: ${criticalIndexesCount}개, 권장: ${recommendedIndexesCount}개`,
        result: JSON.stringify(analysisResult),
        index_ratio: healthRatio,
        response_time: null
      }

      try {
        await window.api.test.create(testData)
      } catch (error) {
        window.api.logger.error('인덱스 분석 결과 저장 실패:', error)
      }
    }

    if (analysisResult && !isAnalyzing) {
      saveTestResult()
    }
  }, [analysisResult, isAnalyzing, selectedProject])

  // 요약 정보 계산
  const summaryData = useMemo(() => {
    if (!analysisResult) return null

    const totalIndexes = analysisResult.totalIndexes

    // 인덱스별 심각/권장 분류
    let criticalIndexesCount = 0
    let recommendedIndexesCount = 0

    for (const index of analysisResult.indexes) {
      if (index.issues.length === 0) continue

      // 심각한 이슈가 있으면 심각 인덱스
      const hasCriticalIssue = index.issues.some((issue) => issue.severity === 'critical')
      if (hasCriticalIssue) {
        criticalIndexesCount++
      } else {
        // 권장 이슈만 있으면 권장 인덱스
        recommendedIndexesCount++
      }
    }

    const indexesWithIssuesCount = criticalIndexesCount + recommendedIndexesCount
    const healthyIndexes = totalIndexes - indexesWithIssuesCount
    const healthRatio = totalIndexes > 0 ? (healthyIndexes / totalIndexes) * 100 : 0

    let icon: string
    let color: 'blue' | 'orange' | 'green' | 'gray'

    if (healthRatio >= 80) {
      icon = successIcon
      color = 'green'
    } else if (healthRatio >= 30) {
      icon = warningIcon
      color = 'orange'
    } else {
      icon = failureIcon
      color = 'gray'
    }

    return {
      mainCard: {
        icon,
        title: '정상 인덱스 비율',
        value: `${healthRatio.toFixed(1)}%`,
        color
      },
      subCard: {
        stats: [
          { label: '정상', value: healthyIndexes, color: 'green' as const },
          {
            label: '심각',
            value: criticalIndexesCount,
            color: 'red' as const
          },
          {
            label: '권장',
            value: recommendedIndexesCount,
            color: 'orange' as const
          }
        ]
      }
    }
  }, [analysisResult])

  const issueCards = useMemo(() => {
    if (!analysisResult) return []

    const cards: Array<{
      id: string
      title: string
      badge: { text: string; color: 'red' | 'yellow' }
      content: React.ReactNode
    }> = []

    const categoryLabels: Record<string, string> = {
      unused: '미사용',
      redundant: '중복',
      low_selectivity: '저효율',
      missing_fk_index: 'FK 누락',
      column_order: '순서 문제',
      oversized: '과도한 크기',
      inappropriate_type: '부적절한 타입',
      underindexed_table: '인덱스 부족'
    }

    for (const index of analysisResult.indexes) {
      if (index.issues.length === 0) continue

      for (const issue of index.issues) {
        const badgeColor = issue.severity === 'critical' ? ('red' as const) : ('yellow' as const)
        const categoryLabel = categoryLabels[issue.category] || issue.category
        const issueIndex = index.issues.indexOf(issue)

        const content = (
          <div className="issue-content">
            <div className="issue-section">
              <p className="issue-description">{issue.description}</p>
              <p className="issue-recommendation">{issue.recommendation}</p>
            </div>

            <div className="issue-section">
              <div className="issue-detail">
                <span className="detail-label">테이블</span>
                <span className="detail-value">{index.tableName}</span>
              </div>
              <div className="issue-detail">
                <span className="detail-label">컬럼</span>
                <span className="detail-value">{index.columns.join(', ')}</span>
              </div>
            </div>

            {(index.indexSizeBytes ||
              index.scanCount !== undefined ||
              index.selectivity !== undefined) && (
              <div className="issue-section no-border">
                {index.indexSizeBytes && (
                  <div className="issue-detail">
                    <span className="detail-label">크기</span>
                    <span className="detail-value">
                      {(index.indexSizeBytes / 1024 / 1024).toFixed(2)}MB
                    </span>
                  </div>
                )}
                {index.scanCount !== undefined && (
                  <div className="issue-detail">
                    <span className="detail-label">스캔</span>
                    <span className="detail-value">{index.scanCount.toLocaleString()}회</span>
                  </div>
                )}
                {index.selectivity !== undefined && (
                  <div className="issue-detail">
                    <span className="detail-label">선택도</span>
                    <span className="detail-value">{index.selectivity.toFixed(2)}%</span>
                  </div>
                )}
              </div>
            )}

            {(issue.impact || issue.relatedIndexName) && (
              <div className="issue-section no-border">
                {issue.impact && (
                  <div className="issue-detail">
                    <span className="detail-label">영향</span>
                    <span className="detail-value impact">{issue.impact}</span>
                  </div>
                )}
                {issue.relatedIndexName && (
                  <div className="issue-detail">
                    <span className="detail-label">관련 인덱스</span>
                    <span className="detail-value">{issue.relatedIndexName}</span>
                  </div>
                )}
              </div>
            )}

            {issue.suggestedSQL && (
              <div className="issue-section no-border">
                <div className="issue-detail">
                  <span className="detail-label">권장 SQL</span>
                </div>
                <pre className="sql-code">{issue.suggestedSQL}</pre>
              </div>
            )}
          </div>
        )

        cards.push({
          id: `${index.tableName}.${index.indexName}.${issue.category}.${issueIndex}`,
          title: index.indexName,
          badge: {
            text: categoryLabel,
            color: badgeColor
          },
          content
        })
      }
    }

    return cards
  }, [analysisResult])

  const handleRerunTest = (): void => {
    if (databaseId) {
      analyzeIndexes(databaseId)
    }
  }

  const handleDownload = (): void => {
    // TODO: 다운로드 기능 구현
  }

  if (isAnalyzing) {
    return (
      <div className="loading-container">
        <LoadingSpinner size={48} />
        <p className="loading-text">인덱스를 분석하는 중입니다...</p>
        <style>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 16px;
          }
          .loading-text {
            color: var(--color-gray-600);
            font-size: 16px;
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return <ErrorView />
  }

  if (!analysisResult || !summaryData) {
    return (
      <div className="empty-container">
        <p className="empty-text">분석 결과가 없습니다.</p>
        <style>{`
          .empty-container {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
          }
          .empty-text {
            color: var(--color-gray-600);
            font-size: 16px;
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <div className="view-container">
        <TestHeader
          title="인덱스 분석 결과"
          subtitle={`${analysisResult.databaseName} (${analysisResult.dbmsType === 'mysql' ? 'MySQL' : 'PostgreSQL'})`}
          onRerunTest={handleRerunTest}
          onDownload={handleDownload}
        />

        {analysisResult.totalIndexes === 0 ? (
          <div className="info-container">
            <img src={yujaWorking} alt="유자 작업중" className="yuja-image" />
            <p className="info-text">인덱스가 없습니다.</p>
            <p className="info-subtext">빠른 데이터베이스 검색을 위해 인덱스를 추가해보세요.</p>
          </div>
        ) : (
          <>
            <SummaryCards mainCard={summaryData.mainCard} subCard={summaryData.subCard} />

            {issueCards.length > 0 ? (
              <div className="index-section-gap">
                <h2 className="section-title preSemiBold20">
                  인덱스 이슈 목록 ({issueCards.length}개)
                </h2>
                <div className="section-grid">
                  {issueCards.map((card) => (
                    <InfoCard
                      key={card.id}
                      title={card.title}
                      badge={card.badge}
                      content={card.content}
                      width="100%"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="info-container">
                <img src={yuja} alt="유자" className="yuja-image" />
                <p className="info-text">완벽해요.</p>
                <p className="info-subtext">모든 인덱스의 상태가 양호해요.</p>
              </div>
            )}
          </>
        )}
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

        .section-title {
          color: var(--color-black);
          margin-bottom: 16px;
        }

        .section-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .info-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          padding: 60px 20px;
          text-align: center;
        }

        .yuja-image {
          width: 200px;
          height: 200px;
          margin-bottom: 20px;
          object-fit: contain;
        }

        .info-text {
          font-size: 20px;
          font-weight: 600;
          color: var(--color-gray-700);
          margin-bottom: 12px;
        }

        .info-subtext {
          font-size: 16px;
          color: var(--color-gray-500);
          line-height: 1.5;
        }

        /* Issue Card Content Styles */
        .issue-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .issue-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .issue-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .issue-section.no-border {
          border-bottom: none;
          padding-bottom: 8px;
        }

        .issue-description {
          font-size: 15px;
          font-weight: 500;
          color: var(--color-gray-800);
          line-height: 1.5;
          margin: 0;
        }

        .issue-recommendation {
          font-size: 14px;
          color: var(--color-gray-600);
          line-height: 1.6;
          margin: 0;
        }

        .section-subtitle {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-gray-700);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .issue-detail {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .detail-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-gray-600);
          min-width: 80px;
        }

        .detail-value {
          font-size: 13px;
          color: var(--color-gray-800);
          flex: 1;
        }

        /* SQL Code */
        .sql-code {
          margin: 0;
          padding: 12px;
          background-color: #f8fafc;
          border-radius: 6px;
          font-size: 13px;
          color: #334155;
          line-height: 1.6;
          overflow-x: auto;
          white-space: pre;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </>
  )
}

export default IndexTestView
