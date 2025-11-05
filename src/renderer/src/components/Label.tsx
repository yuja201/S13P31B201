import type { ReactElement, CSSProperties } from 'react'

interface LabelProps {
  text: string
}

const Label = ({ text }: LabelProps): ReactElement => {
  const labelStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '22px',
    padding: '4px 16px',
    borderRadius: '15px',
    backgroundColor: 'var(--color-white)',
    color: 'var(--color-main-blue)',
    border: '1px solid var(--color-main-blue)',
    fontSize: '12px',
    fontFamily: 'var(--font-family)',
    fontWeight: 'var(--fw-regular)' as React.CSSProperties['fontWeight'],
    whiteSpace: 'nowrap'
  }

  return <div style={labelStyle}>{text}</div>
}

export default Label
