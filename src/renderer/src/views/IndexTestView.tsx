import React, { useEffect, useMemo } from 'react'
import InfoCard from '@renderer/components/InfoCard'
import warningIcon from '@renderer/assets/imgs/warning.svg'
import successIcon from '@renderer/assets/imgs/success.svg'
import failureIcon from '@renderer/assets/imgs/failure.svg'
import TestHeader from '@renderer/components/TestHeader'
import SummaryCards from '@renderer/components/SummaryCards'
import LoadingSpinner from '@renderer/components/LoadingSpinner'
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
      content: string
    }> = []

    const categoryLabels: Record<string, string> = {
      unused: '미사용',
      redundant: '중복',
      low_selectivity: '저효율',
      missing_fk_index: 'FK 누락',
      column_order: '순서 문제',
      oversized: '과도한 크기',
      bloated: 'Bloat',
      inappropriate_type: '부적절한 타입',
      underindexed_table: '인덱스 부족'
    }

    for (const index of analysisResult.indexes) {
      if (index.issues.length === 0) continue

      for (const issue of index.issues) {
        const badgeColor = issue.severity === 'critical' ? ('red' as const) : ('yellow' as const)
        const categoryLabel = categoryLabels[issue.category] || issue.category

        const contentParts: string[] = []
        contentParts.push(`${issue.description}`)
        contentParts.push(`${issue.recommendation}`)
        if (index.indexSizeBytes) {
          contentParts.push(`크기: ${(index.indexSizeBytes / 1024 / 1024).toFixed(2)}MB`)
        }
        if (index.scanCount !== undefined) {
          contentParts.push(`스캔: ${index.scanCount.toLocaleString()}회`)
        }
        if (index.selectivity !== undefined) {
          contentParts.push(`선택도: ${index.selectivity.toFixed(2)}%`)
        }
        if (index.bloatRatio) {
          contentParts.push(`Bloat: ${index.bloatRatio}%`)
        }
        contentParts.push(`테이블: ${index.tableName}`)
        contentParts.push(`컬럼: ${index.columns.join(', ')}`)

        cards.push({
          id: `${index.tableName}.${index.indexName}.${issue.category}`,
          title: index.indexName,
          badge: {
            text: categoryLabel,
            color: badgeColor
          },
          content: contentParts.join('\n')
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
    return (
      <div className="error-container">
        <p className="error-text">일시적인 오류가 발생했습니다.</p>
        <button onClick={handleRerunTest} className="retry-button">
          다시 시도
        </button>
        <style>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 16px;
          }
          .error-text {
            color: var(--color-red);
            font-size: 16px;
          }
          .retry-button {
            padding: 8px 16px;
            background: var(--color-blue);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          .retry-button:hover {
            background: var(--color-blue-dark);
          }
        `}</style>
      </div>
    )
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

        <SummaryCards mainCard={summaryData.mainCard} subCard={summaryData.subCard} />

        {issueCards.length > 0 && (
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
      `}</style>
    </>
  )
}

export default IndexTestView
