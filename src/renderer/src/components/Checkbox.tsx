import React from 'react'
import { FaCheck } from 'react-icons/fa'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, size = 'md', ...props }) => {
  const classNames = ['checkbox', `checkbox--${size}`].join(' ')

  return (
    <>
      <label className={classNames}>
        <input type="checkbox" className="checkbox__input" {...props} />
        <span className="checkbox__box">
          <FaCheck className="checkbox__icon" />
        </span>
        {label && <span className="checkbox__label">{label}</span>}
      </label>

      <style>{`
        .checkbox {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-family: var(--font-family);
          user-select: none;
        }

        .checkbox__input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .checkbox__box {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          border: 2px solid var(--color-placeholder);
          background-color: var(--color-white);
          transition: all 0.2s ease;
          box-shadow: var(--shadow);
          flex-shrink: 0;
        }

        .checkbox--sm .checkbox__box {
          width: 14px;
          height: 14px;
        }
        .checkbox--md .checkbox__box {
          width: 18px;
          height: 18px;
        }
        .checkbox--lg .checkbox__box {
          width: 22px;
          height: 22px;
        }

        .checkbox--sm .checkbox__icon {
          font-size: 8px;
        }
        .checkbox--md .checkbox__icon {
          font-size: 10px;
        }
        .checkbox--lg .checkbox__icon {
          font-size: 12px;
        }

        /* 체크된 상태 */
        .checkbox__input:checked + .checkbox__box {
          background-color: var(--color-main-blue);
          border-color: var(--color-main-blue);
        }

        .checkbox__input:checked + .checkbox__box .checkbox__icon {
          color: var(--color-white);
          opacity: 1;
          transform: scale(1);
        }

        .checkbox__box .checkbox__icon {
          color: var(--color-white);
          opacity: 0;
          transform: scale(0.5);
          transition: all 0.2s ease;
        }

        .checkbox:hover .checkbox__box {
          border-color: var(--color-main-blue);
        }

        .checkbox--sm .checkbox__label {
          font: var(--preRegular14);
        }
        .checkbox--md .checkbox__label {
          font: var(--preMedium16);
        }
        .checkbox--lg .checkbox__label {
          font: var(--preMedium20);
        }

        .checkbox__label {
          color: var(--color-dark-gray);
        }

        /* disabled 상태 */
        .checkbox__input:disabled + .checkbox__box {
          cursor: not-allowed;
        }

        .checkbox__input:disabled ~ .checkbox__label {
          cursor: not-allowed;
        }
      `}</style>
    </>
  )
}

export default Checkbox
