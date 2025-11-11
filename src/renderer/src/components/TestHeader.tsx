import React from 'react'
import Button from '@renderer/components/Button'

interface TestHeaderProps {
  title: string
  subtitle?: string
  onRerunTest: () => void
  onDownload: () => void
  bottomSlot?: React.ReactNode
  className?: string
}

const TestHeader: React.FC<TestHeaderProps> = ({
  title,
  subtitle,
  onRerunTest,
  onDownload,
  bottomSlot,
  className
}) => {
  const headerStyle: React.CSSProperties = {
    width: '100%',
    marginBottom: '24px'
  }

  const topStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: '20px',
    flexWrap: 'wrap'
  }

  const titlesStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '4px',
    minWidth: 0
  }

  const titleStyle: React.CSSProperties = {
    color: 'var(--color-black)',
    lineHeight: '1.2',
    margin: 0
  }

  const subtitleStyle: React.CSSProperties = {
    color: 'var(--color-dark-gray)',
    lineHeight: '1.3',
    margin: 0
  }

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    flexShrink: 0,
    alignItems: 'center'
  }

  const bottomStyle: React.CSSProperties = {
    marginTop: '12px'
  }

  const dividerStyle: React.CSSProperties = {
    marginTop: '20px',
    border: 'none',
    borderTop: '1px solid var(--color-gray-200)'
  }

  return (
    <header className={`test-header ${className ?? ''}`} style={headerStyle}>
      <div style={topStyle}>
        {/* 제목 + 부제목 */}
        <div style={titlesStyle}>
          <h1 className="preBold32" style={titleStyle}>
            {title}
          </h1>
          {subtitle && (
            <p className="preLight20" style={subtitleStyle}>
              {subtitle}
            </p>
          )}
        </div>

        {/* 버튼 그룹 */}
        <div style={actionsStyle}>
          <Button variant="blue" onClick={onRerunTest} size="lg">
            테스트 다시하기
          </Button>
          <Button variant="orange" onClick={onDownload} size="lg">
            결과 다운로드
          </Button>
        </div>
      </div>

      {bottomSlot && <div style={bottomStyle}>{bottomSlot}</div>}
      <hr style={dividerStyle} />
    </header>
  )
}

export default TestHeader
