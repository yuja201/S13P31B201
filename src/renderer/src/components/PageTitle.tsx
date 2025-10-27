type PageTitleProps = {
  title: string
  description?: string
}

export default function PageTitle({ title, description }: PageTitleProps): JSX.Element {
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
        className="preSemiBold32"
        style={{
          color: 'var(--color-black)',
          lineHeight: '1.3'
        }}
      >
        {title}
      </h2>

      {description && (
        <p
          className="preMedium20"
          style={{
            color: 'var(--color-dark-gray)',
            lineHeight: '1.5',
            whiteSpace: 'pre-line'
          }}
        >
          {description}
        </p>
      )}
    </div>
  )
}
