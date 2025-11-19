import React, { useState, useEffect, useCallback } from 'react'
import Button from '@renderer/components/Button'
import successIcon from '@renderer/assets/imgs/success.svg'
import errorIcon from '@renderer/assets/imgs/failure.svg'
import warningIcon from '@renderer/assets/imgs/warning.svg'

type ToastType = 'success' | 'error' | 'warning'

interface ToastProps {
  type?: ToastType
  title?: string
  children?: React.ReactNode
  duration?: number
  onClose?: () => void
}

const Toast: React.FC<ToastProps> = ({
  type = 'success',
  title,
  children,
  duration = 0,
  onClose
}) => {
  const [visible, setVisible] = useState(true)

  const getIcon = (): string => {
    switch (type) {
      case 'success':
        return successIcon
      case 'error':
        return errorIcon
      case 'warning':
        return warningIcon
      default:
        return successIcon
    }
  }

  const closeToast = useCallback((): void => {
    setVisible(false)
    onClose?.()
  }, [onClose])

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(closeToast, duration)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [duration, closeToast])

  if (!visible) return null

  return (
    <div className="toast-backdrop" onClick={closeToast}>
      <div className={`toast-card ${type}`} onClick={(e) => e.stopPropagation()}>
        <button className="toast-close" onClick={closeToast}>
          ✕
        </button>

        <div className="toast-header">
          <img src={getIcon()} alt={type} className="toast-icon" />
          {title && <div className="toast-title">{title}</div>}
        </div>

        <div className="toast-body">{children}</div>

        <div className="toast-footer">
          <Button variant="gray" size="sm" onClick={closeToast}>
            확인
          </Button>
        </div>

        <style>{`
      .toast-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.35);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }

      .toast-card {
        position: relative;
        width: 300px;
        border-radius: 10px;
        padding: 20px 20px;
        color: var(--color-black);
        box-shadow: var(--shadow);
        display: flex;
        flex-direction: column;
        animation: fadeIn 0.2s ease-out;
      }

      .toast-close {
        position: absolute;
        top: 10px;
        right: 12px;
        background: none;
        border: none;
        color: var(--color-dark-gray);
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
      }

      .toast-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 5px;
      }

      .toast-icon {
        width: 28px;
        height: 28px;
        flex-shrink: 0;
      }

      .toast-title {
        font: var(--preBold18);
        color: var(--color-black);
        text-align: left;
      }

      .toast-body {
        display: flex;
        flex-direction: column;
        margin-left: 38px;
        white-space: pre-line;
      }

      .toast-footer {
        display: flex;
        justify-content: flex-end;
        margin-top: 6px;
      }

      .toast-card.success {
        border: 1px solid #10b981;
        background: #ecfdf5;
      }
      .toast-card.error {
        border: 1px solid #ef4444;
        background: #fef2f2;
      }
      .toast-card.warning {
        border: 1px solid #f59e0b;
        background: #fff7ed;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-6px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
      </div>
    </div>
  )
}

export default Toast
