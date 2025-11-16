import React, { useMemo } from 'react'

interface ResponseTimeChartProps {
  responseTimes?: number[]
}

const ResponseTimeChart: React.FC<ResponseTimeChartProps> = ({ responseTimes }) => {
  const safeResponseTimes = Array.isArray(responseTimes) ? responseTimes : []

  // ===== 통계 계산 =====
  const stats = useMemo(() => {
    if (!safeResponseTimes.length) {
      return {
        average: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        max: 0,
        min: 0,
        distribution: [] as number[],
        originalBuckets: [] as number[],
        bucketCount: 11,
        bucketSize: 0,
        p50Index: 0
      }
    }

    const sorted = [...safeResponseTimes].sort((a, b) => a - b)
    const n = sorted.length
    const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / n)

    const percentile = (p: number) => {
      const idx = Math.ceil((p / 100) * n) - 1
      return sorted[Math.min(idx, n - 1)]
    }

    const p50 = percentile(50)
    const p95 = percentile(95)
    const p99 = percentile(99)
    const max = sorted[n - 1]
    const min = sorted[0]

    const bucketCount = 11
    const range = max - min || 1
    const bucketSize = range / (bucketCount - 1)

    const buckets = Array(bucketCount).fill(0)
    sorted.forEach((v) => {
      const idx = Math.min(Math.floor((v - min) / bucketSize), bucketCount - 1)
      buckets[idx] += 1
    })

    const total = safeResponseTimes.length
    const normalized =
      total > 0 ? buckets.map((c) => Math.round((c / total) * 100)) : Array(bucketCount).fill(0)

    const p50Index = Math.min(Math.floor((p50 - min) / bucketSize), bucketCount - 1)

    return {
      average: avg,
      p50,
      p95,
      p99,
      max,
      min,
      distribution: normalized,
      originalBuckets: buckets,
      bucketCount,
      bucketSize,
      p50Index
    }
  }, [safeResponseTimes])

  const {
    average,
    p50,
    p95,
    p99,
    max,
    min,
    distribution,
    originalBuckets,
    bucketCount,
    bucketSize,
    p50Index
  } = stats

  // ===== 막대 높이 계산 =====
  const getScaledHeight = (value: number, maxValue: number): number => {
    if (maxValue <= 0 || value <= 0) return 0
    const minHeight = 18
    return minHeight + (value / maxValue) * (160 - minHeight)
  }

  const maxHeight = Math.max(...distribution, 0)
  const scaledHeights = distribution.map((v) => getScaledHeight(v, maxHeight || 1))

  // ===== 렌더링 =====
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: '28px 36px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}
    >
      {/* ===== 상단 통계 ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ font: 'var(--preBold24)' }}>{average}ms</div>
          <div style={{ font: 'var(--preRegular14)', color: 'var(--color-dark-gray)' }}>평균</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ font: 'var(--preBold24)', color: 'var(--color-main-blue)' }}>{p50}ms</div>
          <div style={{ font: 'var(--preRegular14)', color: 'var(--color-dark-gray)' }}>P50</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ font: 'var(--preBold24)' }}>{p95}ms</div>
          <div style={{ font: 'var(--preRegular14)', color: 'var(--color-dark-gray)' }}>P95</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ font: 'var(--preBold24)' }}>{p99}ms</div>
          <div style={{ font: 'var(--preRegular14)', color: 'var(--color-dark-gray)' }}>P99</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ font: 'var(--preBold24)' }}>{max}ms</div>
          <div style={{ font: 'var(--preRegular14)', color: 'var(--color-dark-gray)' }}>최대</div>
        </div>
      </div>

      {/* ===== 그래프 영역 ===== */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          paddingBottom: 16,
          borderBottom: '1px solid #eee'
        }}
      >
        {/* ===== Y축 ===== */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            textAlign: 'right',
            marginRight: 12,
            font: 'var(--preRegular12)',
            color: 'var(--color-dark-gray)'
          }}
        >
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>

        {/* ===== 막대 전체 ===== */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          {scaledHeights.map((height, i) => {
            const start = Math.round(min + bucketSize * i)
            const end = Math.round(min + bucketSize * (i + 1))

            return (
              <div
                key={i}
                style={{
                  width: `calc(100% / ${bucketCount})`,
                  height: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                {/* ===== 위 레이블 ===== */}
                <div
                  style={{
                    textAlign: 'center',
                    font: 'var(--preRegular12)',
                    lineHeight: '14px',
                    color: 'var(--color-dark-gray)',
                    marginBottom: 4
                  }}
                >
                  <div>{originalBuckets[i]}개</div>
                  <div>({distribution[i]}%)</div>
                </div>

                {/* ===== 중간 유동 공간 ===== */}
                <div style={{ flexGrow: 1 }} />

                {/* ===== 막대 ===== */}
                <div
                  style={{
                    width: '60%',
                    height: height,
                    backgroundColor:
                      i === p50Index ? 'var(--color-main-blue)' : 'rgba(0,50,120,0.15)',
                    borderRadius: 6,
                    marginBottom: 8
                  }}
                />

                {/* ===== 아래 구간 ===== */}
                <div
                  style={{
                    font: 'var(--preRegular12)',
                    color: 'var(--color-dark-gray)'
                  }}
                >
                  {start}~{end}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ===== 범례 ===== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 16,
          gap: 16,
          font: 'var(--preRegular14)',
          color: 'var(--color-dark-gray)'
        }}
      >
        <div>
          <span style={{ color: 'rgba(0,50,120,0.6)' }}>■</span> 응답 구간별 비율 (%)
        </div>
        <div>
          <span style={{ color: 'var(--color-main-blue)' }}>■</span> P50 구간
        </div>
        <div>전체 {safeResponseTimes.length}개</div>
      </div>
    </div>
  )
}

export default ResponseTimeChart
