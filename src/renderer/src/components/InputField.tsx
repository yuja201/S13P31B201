import { useState, useEffect } from 'react'
import type { ReactElement } from 'react'

interface InputFieldProps {
  title: string
  placeholder: string
  description?: string
  descriptionClassName?: string
  width?: number | string
  required?: boolean
  titleBold?: boolean
  value?: string
  onChange?: (value: string) => void
  size?: 'md' | 'sm'
  password?: boolean
  className?: string
  maxLength?: number
}

const InputField = ({
  title,
  placeholder,
  description,
  descriptionClassName,
  width,
  required = false,
  titleBold = false,
  value,
  onChange,
  size = 'md',
  password = false,
  className = '',
  maxLength
}: InputFieldProps): ReactElement => {
  const [inputValue, setInputValue] = useState(value || '')

  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value
    setInputValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  const widthValue = typeof width === 'number' ? `${width}px` : width
  const fontWeight = titleBold ? 'var(--fw-semiBold)' : 'var(--fw-regular)'

  const titleFontSize = size === 'sm' ? '14px' : '16px'
  const inputHeight = size === 'sm' ? '36px' : '42px'
  const inputFontSize = size === 'sm' ? '14px' : '16px'

  return (
    <>
      <style>
        {`
          .input-field-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .input-field-title {
            font-family: var(--font-family);
            color: var(--color-black);
          }

          .input-field-required {
            color: #ed3f27;
            margin-left: 4px;
          }

          .input-field-input {
            width: 100%;
            padding: 0 16px;
            border-radius: 10px;
            border: 1px solid #c9d8eb;
            background-color: var(--color-white);
            font-family: var(--font-family);
            font-weight: var(--fw-regular);
            color: var(--color-black);
            outline: none;
            box-shadow: var(--shadow);
          }

          .input-field-input::placeholder {
            color: var(--color-placeholder);
            font-weight: var(--fw-regular);
          }

          .input-footer {
            display: flex;
            justify-content: space-between; 
            align-items: center;
            margin-top: 4px; 
          }

          .input-field-description {
            font: var(--preMedium12);
            color: var(--color-dark-gray);
          }
          .char-count {
            font-size: 12px;
            color: var(--color-dark-gray);
            text-align: right;
            margin-left: auto;
          }
          .input-error-message {
            color: red;
          }
          .input-success-message {
            color: green;
          }
        `}
      </style>
      <div className="input-field-container" style={{ width: widthValue }}>
        <div className="input-field-title" style={{ fontWeight, fontSize: titleFontSize }}>
          {title}
          {required && <span className="input-field-required">*</span>}
        </div>
        <input
          type={password ? 'password' : 'text'}
          className={`input-field-input ${className}`}
          placeholder={placeholder}
          value={inputValue}
          maxLength={maxLength}
          onChange={handleChange}
          style={{
            height: inputHeight,
            fontSize: inputFontSize
          }}
        />
        {(description || maxLength) && (
          <div className="input-footer">
            {description && (
              <div className={`input-field-description ${descriptionClassName || ''}`}>
                {description}
              </div>
            )}
            {maxLength && (
              <div className="char-count">
                {inputValue.length}/{maxLength}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default InputField
