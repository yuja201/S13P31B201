import React, { useState, useEffect } from 'react'
import Modal from '@renderer/components/Modal'
import RuleSelectContent from '@renderer/modals/rule/RuleSelectContent'
import RuleCreationContent, { RuleCreationData } from '@renderer/modals/rule/RuleCreationContent'

interface RuleModalProps {
  isOpen: boolean
  onClose: () => void
  columnName: string
  columnType: string
}

const RuleModal: React.FC<RuleModalProps> = ({ isOpen, onClose, columnName, columnType }) => {
  const [mode, setMode] = useState<'select' | 'create'>('select')

  const handleCreateNew = (): void => {
    setMode('create')
  }

  const handleBack = (): void => {
    setMode('select')
  }

  const handleConfirmSelect = (value: string): void => {
    console.log('선택된 규칙:', value)
    onClose()
  }

  const handleCreateSubmit = (data: RuleCreationData): void => {
    console.log('새 규칙 생성 완료:', data)
    onClose()
  }

  useEffect(() => {
    if (!isOpen) {
      setMode('select')
    }
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="720px">
      <div className="rule-modal">
        {mode === 'select' ? (
          <RuleSelectContent
            columnName={columnName}
            columnType={columnType}
            onCancel={onClose}
            onConfirm={handleConfirmSelect}
            onCreateNew={handleCreateNew}
          />
        ) : (
          <RuleCreationContent
            columnType={columnType}
            onCancel={handleBack}
            onSubmit={handleCreateSubmit}
          />
        )}
      </div>

      <style>{`
        .rule-modal {
          width: 100%;
          height: 100%;
          transition: all 0.25s ease-in-out;
          animation: fadeIn 0.25s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Modal>
  )
}

export default RuleModal
