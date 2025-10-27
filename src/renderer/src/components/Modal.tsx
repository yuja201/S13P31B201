import React, { ReactNode, useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  width?: string
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, width = '790px' }) => {
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
          {children}
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
