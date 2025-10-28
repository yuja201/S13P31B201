import React, { useEffect } from 'react'

type ButtonVariant = 'orange' | 'yellow' | 'blue' | 'gray'
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
  useEffect(() => {}, [])

  const classNames = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    disabled ? 'button--disabled' : ''
  ].join(' ')

  return (
    <>
      <button className={classNames} disabled={disabled || isLoading} {...props}>
        {isLoading && <span className="button__spinner" />}
        {children}
      </button>
      <style>{`
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: fit-content;
        height: auto;
        padding: 8px 24px;
        border-radius: 8px;
        font-family: var(--font-family);
        font: var(--preMedium20);
        cursor: pointer;
        transition: all 0.25s ease-in-out;
        border: none;
        box-shadow: var(--shadow);
      }

      /* ORANGE */
      .button--orange {
        background-color: var(--color-orange);
        color: var(--color-white);
      }
      .button--orange:hover {
        background-color: #e67517;
        box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.15);
      }

      /* YELLOW */
      .button--yellow {
        background-color: var(--color-yellow);
        color: var(--color-white);
      }
      .button--yellow:hover {
        background-color: #e0a519;
        box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.15);
      }

      /* BLUE */
      .button--blue {
        background-color: var(--color-main-blue);
        color: var(--color-white);
      }
      .button--blue:hover {
        background-color: #0f3a6e;
        box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.15);
      }

      /* GRAY */
      .button--gray {
        background-color: rgba(250, 250, 250, 1);
        color: var(--color-dark-gray);
      }
      .button--gray:hover {
        background-color: rgba(230, 230, 230, 1);
        box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.15);
      }

      /* disabled */
      .button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        box-shadow: none;
      }

      .button--sm {
        font: var(--preRegular14);
        padding: 6px 16px;
      }

      .button--md {
        font: var(--preMedium16);
        padding: 8px 24px;
      }

      .button--lg {
        font: var(--preMedium20);
        padding: 10px 28px;
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
    `}</style>
    </>
  )
}
