import React, { useState, useEffect } from 'react'
import Modal from '@renderer/components/Modal'
import RuleSelectContent, { RuleSelection } from '@renderer/modals/rule/RuleSelectContent'
import RuleCreationContent from '@renderer/modals/rule/RuleCreationContent'
import { useRuleStore } from '@renderer/stores/useRuleStore'

interface RuleModalProps {
  isOpen: boolean
  onClose: () => void
  columnName: string
  columnType: string
  tableName: string
}

const RuleModal: React.FC<RuleModalProps> = ({
  isOpen,
  onClose,
  columnName,
  columnType,
  tableName
}) => {
  const [mode, setMode] = useState<'select' | 'create'>('select')
  const setRule = useRuleStore((s) => s.setRule)

  const handleCreateNew = (): void => {
    setMode('create')
  }

  const handleBack = (): void => {
    setMode('select')
  }

  const handleConfirmSelect = (value: RuleSelection): void => {
    if (tableName) {
      setRule(tableName, columnName, {
        columnName,
        dataSource: value.dataSource,
        metaData: {
          ruleId: value.metaData.ruleId,
          domainId: value.metaData.domainId,
          domainName: value.metaData.domainName
        }
      })
    }
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
          <RuleCreationContent columnType={columnType} onCancel={handleBack} />
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
