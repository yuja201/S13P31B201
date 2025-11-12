import React, { useMemo } from 'react'

interface ResponseTimeChartProps {
  responseTimes: number[]
}

const ResponseTimeChart: React.FC<ResponseTimeChartProps> = ({ responseTimes }) => {
  // ===== 통계 및 분포 계산 =====
  const stats = useMemo(() => {
    if (!responseTimes.length) {
      return {
        average: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        max: 0,
        min: 0,
        distribution: [] as number[],
        bucketCount: 0,
        bucketSize: 0,
        p50Index: 0
      }
    }

    const sorted = [...responseTimes].sort((a, b) => a - b)
    const n = sorted.length
    const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / n)

    const percentile = (p: number): number => {
      const index = Math.ceil((p / 100) * n) - 1
      return sorted[Math.min(index, n - 1)]
    }

    const p50 = percentile(50)
    const p95 = percentile(95)
    const p99 = percentile(99)
    const max = sorted[n - 1]
    const min = sorted[0]

    // 분포 계산
    const bucketCount = 11
    const range = max - min || 1
    const bucketSize = range / (bucketCount - 1)
    const buckets = Array(bucketCount).fill(0)

    sorted.forEach((v) => {
      const idx = Math.min(Math.floor((v - min) / bucketSize), bucketCount - 1)
      buckets[idx] += 1
    })

    const maxCount = Math.max(...buckets)
    const normalized =
      maxCount > 0
        ? buckets.map((c) => Math.round((c / maxCount) * 100))
        : Array(bucketCount).fill(0)

    const p50Index = Math.min(Math.floor((p50 - min) / bucketSize), bucketCount - 1)

    return {
      average: avg,
      p50,
      p95,
      p99,
      max,
      min,
      distribution: normalized,
      bucketCount,
      bucketSize,
      p50Index
    }
  }, [responseTimes])

  const { average, p50, p95, p99, max, distribution, bucketCount, p50Index } = stats

  // ===== 스타일 =====
  const containerStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    padding: '28px 36px',
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  }

  const labelRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    marginBottom: '16px'
  }

  const labelItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  }

  const labelValueStyle: React.CSSProperties = {
    font: 'var(--preBold24)',
    color: 'var(--color-black)'
  }

  const highlightValueStyle: React.CSSProperties = {
    ...labelValueStyle,
    color: 'var(--color-main-blue)'
  }

  const labelKeyStyle: React.CSSProperties = {
    font: 'var(--preRegular14)',
    color: 'var(--color-dark-gray)',
    marginTop: '4px'
  }

  const barContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '160px',
    width: '100%',
    marginTop: '12px',
    position: 'relative'
  }

  // 안전한 높이 계산
  const getScaledHeight = (value: number, maxValue: number): number => {
    if (maxValue <= 0 || value <= 0) return 0
    const minHeight = 15
    return minHeight + (value / maxValue) * (160 - minHeight)
  }

  const maxHeight = Math.max(...distribution, 0)
  const safeMaxHeight = maxHeight > 0 ? maxHeight : 1
  const scaledHeights = distribution.map((v) => (v === 0 ? 0 : getScaledHeight(v, safeMaxHeight)))

  const getBarColor = (index: number): string =>
    index === p50Index ? 'var(--color-main-blue)' : 'rgba(0, 50, 120, 0.15)'

  const barStyle = (height: number, index: number): React.CSSProperties => ({
    width: `calc(100% / ${bucketCount + 2})`,
    height: `${height}px`,
    backgroundColor: getBarColor(index),
    borderRadius: '6px',
    transition: 'height 0.3s ease'
  })

  const legendStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '16px'
  }

  const legendItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    font: 'var(--preRegular14)',
    color: 'var(--color-dark-gray)'
  }

  const colorBoxStyle = (color: string): React.CSSProperties => ({
    width: 12,
    height: 12,
    borderRadius: 4,
    backgroundColor: color
  })

  // ===== 렌더링 =====
  return (
    <div style={containerStyle} role="region" aria-label="응답 시간 통계 차트">
      {/* 통계 값 */}
      <div style={labelRowStyle} role="list" aria-label="응답 시간 통계">
        <div style={labelItemStyle} role="listitem">
          <span style={labelValueStyle}>{average}ms</span>
          <span style={labelKeyStyle}>평균</span>
        </div>
        <div style={labelItemStyle} role="listitem">
          <span style={highlightValueStyle}>{p50}ms</span>
          <span style={labelKeyStyle}>P50 (중앙값)</span>
        </div>
        <div style={labelItemStyle} role="listitem">
          <span style={labelValueStyle}>{p95}ms</span>
          <span style={labelKeyStyle}>P95</span>
        </div>
        <div style={labelItemStyle} role="listitem">
          <span style={labelValueStyle}>{p99}ms</span>
          <span style={labelKeyStyle}>P99</span>
        </div>
        <div style={labelItemStyle} role="listitem">
          <span style={labelValueStyle}>{max}ms</span>
          <span style={labelKeyStyle}>최대</span>
        </div>
      </div>

      {/* 막대 그래프 */}
      <div
        style={barContainerStyle}
        role="img"
        aria-label={`응답 시간 분포 히스토그램. 총 ${bucketCount}개 구간으로 나뉘며, 중앙값(P50)은 ${p50}ms입니다.`}
      >
        {scaledHeights.map((h, i) => (
          <div key={i} style={barStyle(h, i)} role="presentation" aria-hidden="true" />
        ))}
      </div>

      {/* 색상 범례 */}
      <div style={legendStyle} role="list" aria-label="그래프 범례">
        <div style={legendItemStyle} role="listitem">
          <div style={colorBoxStyle('rgba(0, 50, 120, 0.15)')} aria-hidden="true" />
          <span>응답 구간별 비율</span>
        </div>
        <div style={legendItemStyle} role="listitem">
          <div style={colorBoxStyle('var(--color-main-blue)')} aria-hidden="true" />
          <span>P50 구간 (중앙값)</span>
        </div>
      </div>
    </div>
  )
}

export default ResponseTimeChart
