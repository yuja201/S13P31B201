import React from 'react'
import { LineChart, Line, Area, ResponsiveContainer, Tooltip, YAxis, XAxis } from 'recharts'

interface TestSummaryCardProps {
  title: string
  subtitle: string
  total: number
  currentWeek: number
  changePercent: number
  data: { name: string; value: number }[]
  positive?: boolean
  unit?: string // "번", "%", "ms" 등
  currentPrefix?: string // "이번 주", "최근 개선율" 등
  showUnitAfterTotal?: boolean
}

const TestSummaryCard: React.FC<TestSummaryCardProps> = ({
  title,
  subtitle,
  total,
  currentWeek,
  changePercent,
  data,
  positive = true,
  unit = '번',
  currentPrefix = '이번 주',
  showUnitAfterTotal = true
}) => {
  const formattedChangePercent = Math.abs(changePercent)
  const sign = positive ? '+' : '-'
  const color = positive ? '#10b981' : '#ef4444'

  const gradientId = `stats-card-gradient-${title.replace(/\s+/g, '-')}`

  return (
    <>
      <div className="stats-card">
        <div className="stats-card__header">
          <div className="stats-card__title">{title}</div>
          <div className="stats-card__subtitle">{subtitle}</div>
        </div>

        <div className="stats-card__bottom">
          <div className="stats-card__content">
            <div className="stats-card__total">
              {total}
              {showUnitAfterTotal && unit}
            </div>

            <div className="stats-card__current">
              {currentPrefix} {currentWeek}
              {unit}
            </div>

            <div
              className={`stats-card__percent ${
                positive ? 'stats-card__percent--up' : 'stats-card__percent--down'
              }`}
            >
              {sign}
              {formattedChangePercent}% 지난 주 대비
            </div>
          </div>

          <div className="stats-card__chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 0, bottom: -10, left: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1.2">
                    <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <YAxis hide={true} domain={[0, 'dataMax']} padding={{ top: 10, bottom: 10 }} />{' '}
                <Tooltip cursor={false} contentStyle={{ display: 'none' }} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="none"
                  fill={`url(#${gradientId})`}
                  fillOpacity={1}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <style>{`
        /* 전체 카드 */
        .stats-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background-color: var(--color-white);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 14px;
          box-shadow: var(--shadow);
          padding: 24px;
          width: 300px;
          height: 215px;
          box-sizing: border-box;
          gap: 24px;
        }

        .stats-card__title {
          font: var(--preSemiBold16);
          color: var(--color-black);
        }

        .stats-card__subtitle {
          font: var(--preRegular14);
          color: var(--color-dark-gray);
          margin-top: 2px;
        }

        .stats-card__bottom {
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          flex: 1;
          gap: 24px;
        }

        .stats-card__content {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          flex: 3;
        }

        .stats-card__total {
          font-weight: var(--fw-semiBold);
          font-size: 32px;
          line-height: 1.2;
          color: var(--color-black);
          margin-bottom: 2px;
        }

        .stats-card__current {
          font: var(--preRegular14);
          color: var(--color-dark-gray);
          margin-bottom: 8px;
        }

        .stats-card__percent {
          font: var(--preMedium14);
        }

        .stats-card__percent--up {
          color: #10b981;
        }

        .stats-card__percent--down {
          color: #ef4444;
        }

        .stats-card__chart {
          flex: 2;
          height: 100%;
          align-self: flex-end;
        }
      `}</style>
    </>
  )
}

export default TestSummaryCard
