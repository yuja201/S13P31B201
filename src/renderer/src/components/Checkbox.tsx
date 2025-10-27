import React from 'react'
import checkIcon from '../assets/icons/check.png'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, ...props }) => {
  return (
    <>
      <label className="checkbox">
        <input type="checkbox" className="checkbox__input" {...props} />
        <span className="checkbox__box" />
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
          width: 18px;
          height: 18px;
          border-radius: 3px;
          border: 2px solid var(--color-placeholder);
          background-color: var(--color-white);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: var(--shadow);
        }

        /* 체크된 상태 */
        .checkbox__input:checked + .checkbox__box {
          background-color: var(--color-main-blue);
          border-color: var(--color-main-blue);
        }

        .checkbox__input:checked + .checkbox__box::after {
          content: '';
          width: 12px;
          height: 10px;
          background-image: url(${checkIcon}); 
          background-position: center;
          background-size: contain;
          background-repeat: no-repeat;
        }

        .checkbox:hover .checkbox__box {
          border-color: var(--color-main-blue);
        }

        .checkbox__label {
          font: var(--preMedium20);
          color: var(--color-dark-gray);
        }

        /* 비활성화 상태 */
        .checkbox__input:disabled + .checkbox__box {
          background-color: var(--color-placeholder);
          border-color: var(--color-placeholder);
          cursor: not-allowed;
          opacity: 0.6;
        }

        .checkbox__input:disabled ~ .checkbox__label {
          color: var(--color-placeholder);
          cursor: not-allowed;
        }
      `}</style>
    </>
  )
}
