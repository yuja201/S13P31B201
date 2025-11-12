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
      <div className="modal-overlay">
        <div className="modal-container" style={{ width }} onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
          <div className="modal-inner">
            <div className="modal-content">{children}</div>
          </div>
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
          border-radius: 20px;
          position: relative;
          box-shadow: 0 6px 28px rgba(0, 0, 0, 0.15);
          animation: fadeIn 0.2s ease-out;
          max-height: 85vh;
          overflow: hidden;
          padding: 50px 40px;
        }

        .modal-inner {
          max-height: 85vh;
          overflow: visible;
        }

        .modal-content {
          overflow: auto;
          max-height: calc(85vh - 100px);
          border-radius: inherit;
          scrollbar-gutter: stable both-edges;
          box-sizing: border-box;
        }

        .modal-content::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        .modal-content::-webkit-scrollbar-thumb {
          background-color: rgba(100, 100, 100, 0.35);
          border-radius: 10px;
          border: 3px solid transparent;
          background-clip: content-box;
        }

        .modal-content::-webkit-scrollbar-thumb:hover {
          background-color: rgba(100, 100, 100, 0.5);
        }

        .modal-content::-webkit-scrollbar-track {
          background: transparent;
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
          z-index: 2;
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
