import React, { useEffect } from 'react'

type ButtonVariant = 'orange' | 'yellow' | 'main' | 'gray'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'orange',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  useEffect(() => {
    if (document.getElementById('button-component-style')) return

    const style = document.createElement('style')
    style.id = 'button-component-style'
    style.innerHTML = `
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: fit-content;
        height: auto;
        padding: 8px 24px;
        border-radius: 8px;
        font-family: var(--font-family-base);
        font-weight: var(--font-semiBold);
        font-size: var(--text-subtitle);
        cursor: pointer;
        transition: all 0.25s ease-in-out;
        border: none;
        box-shadow: var(--shadow-default);
      }

      /* 🟧 ORANGE */
      .button--orange {
        background-color: var(--color-orange);
        color: var(--color-white);
      }
      .button--orange:hover {
        background-color: #e67517;
        box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.15);
      }

      /* 🟨 YELLOW */
      .button--yellow {
        background-color: var(--color-yellow);
        color: var(--color-white);
      }
      .button--yellow:hover {
        background-color: #e0a519;
        box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.15);
      }

      /* 🔵 MAIN */
      .button--main {
        background-color: var(--color-main);
        color: var(--color-white);
      }
      .button--main:hover {
        background-color: #0f3a6e;
        box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.15);
      }

      /* ⚫ GRAY */
      .button--gray {
        background-color: var(--color-selected);
        color: var(--color-gray-700);
      }
      .button--gray:hover {
        background-color: var(--color-gray-300);
        box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.15);
      }

      /* disabled */
      .button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        box-shadow: none;
      }

      /* spinner */
      .button__spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.5);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-right: 8px;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
  }, [])

  const classNames = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    disabled ? 'button--disabled' : ''
  ].join(' ')

  return (
    <button className={classNames} disabled={disabled || isLoading} {...props}>
      {isLoading && <span className="button__spinner" />}
      {children}
    </button>
  )
}
