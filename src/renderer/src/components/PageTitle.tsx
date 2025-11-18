import React from 'react'

type PageTitleProps = {
  title: string
  description?: string
  size?: 'large' | 'small'
}

const PageTitle: React.FC<PageTitleProps> = ({ title, description, size = 'large' }) => {
  const titleClass = size === 'small' ? 'preSemiBold24' : 'preBold30'
  const descClass = size === 'small' ? 'preRegular16' : 'preLight16'

  const descriptionLines = description ? description.split('\n') : []

  const descStyle: React.CSSProperties = {
    color: 'var(--color-dark-gray)',
    lineHeight: '1.0'
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '8px',
        width: 'fit-content',
        height: 'fit-content'
      }}
    >
      <h2
        className={titleClass}
        style={{
          color: 'var(--color-black)',
          lineHeight: '1.3'
        }}
      >
        {title}
      </h2>
      {descriptionLines.length > 0 &&
        descriptionLines.map((line, index) => (
          <p key={index} className={descClass} style={descStyle}>
            {line}
          </p>
        ))}
    </div>
  )
}

export default PageTitle
