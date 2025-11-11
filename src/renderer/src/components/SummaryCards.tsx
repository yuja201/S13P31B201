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
    color?: 'blue' | 'orange' | 'green' | 'gray'
  }
  subCard: {
    stats: SummaryStat[]
  }
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ mainCard, subCard }) => {
  // ====== 공통 스타일 ======
  const wrapperStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '0.8fr 2fr', //왼쪽 1/3, 오른쪽 2/3
    gap: '24px',
    width: '100%',
    margin: '20px 0',
    alignItems: 'stretch'
  }

  const cardBaseStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    padding: '28px 36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    minHeight: '120px'
  }

  // 아이콘 크기 30% 증가
  const iconStyle: React.CSSProperties = {
    width: 60,
    height: 60,
    flexShrink: 0
  }

  // 텍스트와 퍼센트를 세로로 배치하는 그룹
  const textGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: '12px'
  }

  const titleStyle: React.CSSProperties = {
    font: 'var(--preRegular18)',
    color: 'var(--color-dark-gray)',
    marginBottom: '4px'
  }

  const mainValueStyle: React.CSSProperties = {
    font: 'var(--preBold32)',
    color:
      mainCard.color === 'orange'
        ? 'var(--color-orange)'
        : mainCard.color === 'blue'
          ? 'var(--color-main-blue)'
          : mainCard.color === 'green'
            ? '#2ecc71'
            : 'var(--color-gray-500)'
  }

  // 오른쪽 통계 카드
  const statCardStyle: React.CSSProperties = {
    ...cardBaseStyle,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center'
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

  const statValueStyle = (color?: string): React.CSSProperties => ({
    font: 'var(--preBold32)',
    color: getColor(color)
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
