import React from 'react'

export type BadgeColorType = 'yellow' | 'red'
export type InfoCardVariant = 'outer' | 'inner'

export interface InfoCardProps {
  title: string
  content?: React.ReactNode
  titleIcon?: React.ReactNode
  badge?: {
    text: string
    color: BadgeColorType
  }
  width?: number | string
  height?: number | string
  variant?: InfoCardVariant
}

const badgeColors: Record<BadgeColorType, { background: string; text: string }> = {
  yellow: {
    background: '#FFF5D7',
    text: '#F48523'
  },
  red: {
    background: '#FFDCD7',
    text: '#E02226'
  }
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  content,
  titleIcon,
  badge,
  width = 'auto',
  height = 'auto',
  variant = 'outer'
}) => {
  const badgeStyle = badge ? badgeColors[badge.color] : null

  return (
    <>
      <style>
        {`
          .info-card {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            background-color: var(--color-white);
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            padding: 20px 24px;
            box-shadow: var(--shadow);
            transition: box-shadow 0.2s ease, transform 0.2s ease;
          }

          .info-card.inner {
            box-shadow: none;
          }

          .info-card-header {
            display: flex;
            align-items: center;
            width: 100%;
            gap: 12px;
            margin-bottom: 12px;
          }

          .info-card-title-wrapper {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .info-card-left-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .info-card-title {
            font: var(--preSemiBold20);
            color: var(--color-black);
            word-break: break-word;
          }

          .info-card-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 6px 14px;
            border-radius: 999px;
            font: var(--preSemiBold12);
            white-space: nowrap;
            flex-shrink: 0;
          }

          .info-card-content {
            font: var(--preLight14);
            color: var(--color-dark-gray);
            width: 100%;
            line-height: 1.6;
            white-space: pre-line;
          }
        `}
      </style>

      <div className={`info-card ${variant}`} style={{ width, height }}>
        <div className="info-card-header">
          <div className="info-card-title-wrapper">
            {titleIcon && <div className="info-card-left-icon">{titleIcon}</div>}
            <h3 className="info-card-title">{title}</h3>
          </div>
          {badge && (
            <span
              className="info-card-badge"
              style={
                badgeStyle ? { backgroundColor: badgeStyle.background, color: badgeStyle.text } : {}
              }
            >
              {badge.text}
            </span>
          )}
        </div>

        {content && <div className="info-card-content">{content}</div>}
      </div>
    </>
  )
}

export default InfoCard
