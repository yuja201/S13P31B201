import React from 'react'
import Button from '@renderer/components/Button'
import successIcon from '@renderer/assets/imgs/success.svg'
import errorIcon from '@renderer/assets/imgs/failure.svg'
import warningIcon from '@renderer/assets/imgs/warning.svg'

type ConfirmType = 'success' | 'error' | 'warning'

interface ConfirmDialogProps {
  type?: ConfirmType
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  type = 'warning',
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel
}) => {
  const getIcon = (): string => {
    switch (type) {
      case 'success':
        return successIcon
      case 'error':
        return errorIcon
      case 'warning':
        return warningIcon
      default:
        return warningIcon
    }
  }

  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className={`confirm-card ${type}`} onClick={(e) => e.stopPropagation()}>
        <button className="confirm-close" onClick={onCancel}>
          ✕
        </button>

        <div className="confirm-header">
          <img src={getIcon()} alt={type} className="confirm-icon" />
          <div className="confirm-title preBold18">{title}</div>
        </div>

        <div className="confirm-body">
          <p className="confirm-message preRegular14">{message}</p>
        </div>

        <div className="confirm-footer">
          <Button variant="gray" size="sm" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant="orange" size="sm" onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>

        <style>{`
          .confirm-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.35);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
          }

          .confirm-card {
            position: relative;
            width: 360px;
            border-radius: 10px;
            padding: 20px;
            box-shadow: var(--shadow);
            display: flex;
            flex-direction: column;
            animation: fadeIn 0.2s ease-out;
          }

          .confirm-card.success {
            border: 1px solid #10b981;
            background: #ecfdf5;
          }

          .confirm-card.error {
            border: 1px solid #ef4444;
            background: #fef2f2;
          }

          .confirm-card.warning {
            border: 1px solid #f59e0b;
            background: #fff7ed;
          }

          .confirm-close {
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

          .confirm-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 5px;
            margin-bottom: 12px;
          }

          .confirm-icon {
            width: 28px;
            height: 28px;
            flex-shrink: 0;
          }

          .confirm-title {
            color: var(--color-black);
          }

          .confirm-body {
            display: flex;
            flex-direction: column;
            margin-left: 38px;
            margin-bottom: 16px;
          }

          .confirm-message {
            color: var(--color-dark-gray);
            line-height: 1.5;
          }

          .confirm-footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-6px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  )
}

export default ConfirmDialog
