export interface QueryStats {
  avg: number
  min: number
  max: number
  p50: number
  p95: number
  p99: number
}

function percentile(sorted: number[], p: number): number {
  const index = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.min(index, sorted.length - 1)]
}

export function calculateLatencyStats(times: number[]): QueryStats {
  if (times.length === 0) {
    return { avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 }
  }

  const sorted = [...times].sort((a, b) => a - b)

  return {
    avg: Number((sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(2)),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99)
  }
}
