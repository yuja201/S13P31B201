import { useState } from 'react'
import type { ReactElement, CSSProperties } from 'react'

interface InputFieldProps {
  title: string
  placeholder: string
  description?: string
  width: number | string
  required?: boolean
  value?: string
  onChange?: (value: string) => void
}

const InputField = ({
  title,
  placeholder,
  description,
  width,
  required = false,
  value,
  onChange
}: InputFieldProps): ReactElement => {
  const [inputValue, setInputValue] = useState(value || '')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value
    setInputValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: typeof width === 'number' ? `${width}px` : width
  }

  const titleStyle: CSSProperties = {
    fontSize: '20px',
    fontFamily: 'var(--font-family)',
    fontWeight: 'var(--fw-semiBold)' as React.CSSProperties['fontWeight'],
    color: 'var(--color-black)'
  }

  const requiredStyle: CSSProperties = {
    color: '#ed3f27',
    marginLeft: '4px'
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    height: '42px',
    padding: '0 20px',
    borderRadius: '10px',
    border: '1px solid #c9d8eb',
    backgroundColor: 'var(--color-white)',
    fontSize: '16px',
    fontFamily: 'var(--font-family)',
    fontWeight: 'var(--fw-regular)' as React.CSSProperties['fontWeight'],
    color: 'var(--color-black)',
    outline: 'none',
    boxShadow: 'var(--shadow)'
  }

  const descriptionStyle: CSSProperties = {
    fontSize: '12px',
    fontFamily: 'var(--font-family)',
    fontWeight: 'var(--fw-regular)' as React.CSSProperties['fontWeight'],
    color: 'var(--color-dark-gray)'
  }

  return (
    <>
      <style>
        {`
          .input-field-input::placeholder {
            color: var(--color-placeholder);
            font-weight: var(--fw-regular);
          }
        `}
      </style>
      <div style={containerStyle}>
        <div style={titleStyle}>
          {title}
          {required && <span style={requiredStyle}>*</span>}
        </div>
        <input
          type="text"
          className="input-field-input"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleChange}
          style={inputStyle}
        />
        {description && <div style={descriptionStyle}>{description}</div>}
      </div>
    </>
  )
}

export default InputField
