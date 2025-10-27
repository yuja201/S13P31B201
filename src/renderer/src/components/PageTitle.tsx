import React from 'react'

type PageTitleProps = {
  title: string
  description?: string
  size?: 'large' | 'small'
}

const PageTitle: React.FC<PageTitleProps> = ({ title, description, size = 'large' }) => {
  const titleClass = size === 'small' ? 'preSemiBold24' : 'preBold32'
  const descClass = size === 'small' ? 'preRegular16' : 'preLight20'

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
      {description && (
        <p
          className={descClass}
          style={{
            color: 'var(--color-dark-gray)',
            lineHeight: '1.3',
            whiteSpace: 'pre-line'
          }}
        >
          {description.replace(/\\n/g, '\n')}
        </p>
      )}
    </div>
  )
}

export default PageTitle
