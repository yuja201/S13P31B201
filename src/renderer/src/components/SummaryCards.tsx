import React from 'react'
import warningIcon from '@renderer/assets/imgs/warning.svg'

interface SummaryStat {
  label: string
  value: string | number
  color?: 'green' | 'red' | 'orange' | 'gray'
}

interface SummaryCardsProps {
  mainCard: {
    icon?: string
    title: string
    value: string | number
    color?: 'green' | 'red' | 'orange' | 'gray'
  }
  subCard: {
    stats: SummaryStat[]
  }
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ mainCard, subCard }) => {
  // ====== 공통 스타일 ======

  const getColor = (color?: string): string => {
    switch (color) {
      case 'green':
        return '#27ae60'
      case 'red':
        return '#e74c3c'
      case 'orange':
        return 'var(--color-orange)'
      default:
        return 'var(--color-black)'
    }
  }
  const wrapperStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '0.8fr 2fr',
    gap: '24px',
    width: '100%',
    margin: '20px 0',
    alignItems: 'stretch'
  }

  const cardBaseStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    padding: '28px 50px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    boxSizing: 'border-box',
    minHeight: '120px'
  }

  const iconStyle: React.CSSProperties = {
    width: 60,
    height: 60,
    flexShrink: 0,
    marginTop: '4px'
  }

  const textGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: '14px'
  }

  const titleStyle: React.CSSProperties = {
    font: 'var(--preRegular16)',
    color: 'var(--color-dark-gray)'
  }

  const mainValueStyle: React.CSSProperties = {
    font: 'var(--preBold32)',
    color: getColor(mainCard.color),
    lineHeight: '1.0'
  }

  // 오른쪽 통계 카드
  const statCardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    padding: '28px 36px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    minHeight: '120px'
  }

  const statItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  }

  const statLabelStyle: React.CSSProperties = {
    font: 'var(--preRegular16)',
    color: 'var(--color-dark-gray)',
    marginBottom: '4px'
  }

  const statValueStyle = (color?: string): React.CSSProperties => ({
    font: 'var(--preBold32)',
    color: getColor(color),
    lineHeight: '1.0'
  })

  // ====== 렌더링 ======
  return (
    <div style={wrapperStyle}>
      {/* 왼쪽: 정상 인덱스 비율 카드 */}
      <div style={cardBaseStyle}>
        <img src={mainCard.icon ?? warningIcon} alt="icon" style={iconStyle} />
        <div style={textGroupStyle}>
          <p style={titleStyle}>{mainCard.title}</p>
          <span style={mainValueStyle}>{mainCard.value}</span>
        </div>
      </div>

      {/* 오른쪽: 상세 통계 카드 */}
      <div style={statCardStyle}>
        {subCard.stats.map((s, i) => (
          <div key={i} style={statItemStyle}>
            <p style={statLabelStyle}>{s.label}</p>
            <p style={statValueStyle(s.color)}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SummaryCards
