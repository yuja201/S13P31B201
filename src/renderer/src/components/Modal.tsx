import React, { ReactNode, useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  width?: string
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = '790px'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!isOpen) return null

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" style={{ width }} onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>

          {title && <h1 className="modal-title">{title}</h1>}
          {subtitle && <p className="modal-subtitle">{subtitle}</p>}

          <div className="modal-content">{children}</div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
        }

        .modal-container {
          background: var(--color-background);
          color: var(--color-text);
          border-radius: 12px;
          padding: 28px 30px;
          position: relative;
          box-shadow: 0 6px 28px rgba(0, 0, 0, 0.15);
          animation: fadeIn 0.2s ease-out;
          max-height: 85vh;
          overflow-y: auto;
        }

        .modal-close {
          position: absolute;
          right: 20px;
          top: 16px;
          background: none;
          border: none;
          color: var(--ev-c-gray-1);
          font-size: 18px;
          cursor: pointer;
          transition: color 0.2s;
        }
        .modal-close:hover {
          color: var(--ev-c-black);
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 6px;
          color: var(--ev-c-black);
        }
        .modal-subtitle {
          font-size: 14px;
          color: var(--ev-c-gray-1);
          margin-bottom: 20px;
        }

        .modal-content {
          font-size: 14px;
          color: var(--ev-c-black);
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
    </>
  )
}

export default Modal
