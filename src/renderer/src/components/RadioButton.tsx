import React from 'react'

interface RadioButtonProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  name: string
  size?: 'sm' | 'md' | 'lg'
}

export const RadioButton: React.FC<RadioButtonProps> = ({ label, name, size = 'md', ...props }) => {
  const classNames = ['radio', `radio--${size}`].join(' ')

  return (
    <>
      <label className={classNames}>
        <input type="radio" name={name} className="radio__input" {...props} />
        <span className="radio__circle" />
        {label && <span className="radio__label">{label}</span>}
      </label>

      <style>{`
        .radio {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-family: var(--font-family);
          user-select: none;
        }

        .radio__input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .radio__circle {
          border-radius: 50%;
          border: 2px solid var(--color-placeholder);
          background-color: var(--color-white);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: var(--shadow);
          position: relative;
          flex-shrink: 0;
        }

        .radio--sm .radio__circle {
          width: 14px;
          height: 14px;
        }
        .radio--md .radio__circle {
          width: 18px;
          height: 18px;
        }
        .radio--lg .radio__circle {
          width: 22px;
          height: 22px;
        }

        .radio--sm .radio__input:checked + .radio__circle::after {
          width: 6px;
          height: 6px;
        }
        .radio--md .radio__input:checked + .radio__circle::after {
          width: 8px;
          height: 8px;
        }
        .radio--lg .radio__input:checked + .radio__circle::after {
          width: 10px;
          height: 10px;
        }

        .radio__input:checked + .radio__circle {
          border-color: var(--color-main-blue);
        }

        .radio__input:checked + .radio__circle::after {
          content: '';
          position: absolute;
          background-color: var(--color-main-blue);
          border-radius: 50%;
        }
        
        .radio:hover .radio__circle {
          border-color: var(--color-main-blue);
        }

        .radio--sm .radio__label {
          font: var(--preRegular14);
        }
        .radio--md .radio__label {
          font: var(--preMedium16);
        }
        .radio--lg .radio__label {
          font: var(--preMedium20);
        }

        .radio__label {
          color: var(--color-black);
        }

        /* 비활성화 상태 */
        .radio__input:disabled + .radio__circle {
          background-color: var(--color-placeholder);
          border-color: var(--color-placeholder);
          cursor: not-allowed;
          opacity: 0.6;
        }

        .radio__input:disabled ~ .radio__label {
          color: var(--color-placeholder);
          cursor: not-allowed;
        }
      `}</style>
    </>
  )
}

export default RadioButton
