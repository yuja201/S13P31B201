import React, { useState, useEffect } from 'react'
import Modal from '@renderer/components/Modal'
import RuleSelectContent, { RuleSelection } from '@renderer/modals/rule/RuleSelectContent'
import { useGenerationStore } from '@renderer/stores/generationStore'
import RuleCreationContent, { RuleCreationData } from '@renderer/modals/rule/RuleCreationContent'
import { ColumnDetail } from '@renderer/views/CreateDummyView'
import EnumSelectContent from '@renderer/modals/rule/EnumSelectContent'
import ReferenceSelectContent from '@renderer/modals/rule/ReferenceSelectContent'
import { ColumnConfig } from '@renderer/stores/generationStore'

export type GenerationType = 'Faker.js' | 'AI' | '참조' | '파일 업로드' | '고정값' | 'ENUM'

export type RuleResult = {
  generation: GenerationType
  setting: string
}

interface RuleModalProps {
  isOpen: boolean
  onClose: () => void
  column: ColumnDetail
  tableName: string
  onConfirm: (result: RuleResult) => void
  initialConfig?: ColumnConfig
}

const RuleModal: React.FC<RuleModalProps> = ({ isOpen, onClose, column, tableName, onConfirm, initialConfig }) => {
  const [mode, setMode] = useState<'select' | 'create'>('select')
  const setRule = useGenerationStore((s) => s.setColumnRule)

  const handleCreateNew = (): void => {
    setMode('create')
  }

  const handleBack = (): void => {
    setMode('select')
  }

  const generationLabelMap: Record<RuleSelection['dataSource'], GenerationType> = {
    FAKER: 'Faker.js',
    AI: 'AI',
    FILE: '파일 업로드',
    FIXED: '고정값',
    ENUM: 'ENUM',
    REFERENCE: '참조'
  }

  const handleConfirmSelect = (value: RuleSelection): void => {
    if (tableName) {
      setRule(tableName, column.name, value)
    }

    onConfirm({
      generation: generationLabelMap[value.dataSource],
      setting: value.metaData.domainName ?? value.metaData.fixedValue ?? ''
    })

    onClose()
  }

  const handleRuleCreated = (data: RuleCreationData): void => {
    if (!column) return

    const ruleSelection: RuleSelection = {
      columnName: column.name,
      dataSource: data.source,
      metaData: {
        ruleId: data.result,
        ruleName: data.settingName,
        domainId: data.domainId,
        domainName: data.domainName,
        ensureUnique: data.ensureUnique
      }
    }
    handleConfirmSelect(ruleSelection)
  }

  useEffect(() => {
    if (!isOpen) {
      setMode('select')
    }
  }, [isOpen])

  const hasEnumList = column.enumList && column.enumList.length > 0
  const isForeignKey = column.isForeignKey && column.foreignKeys && column.foreignKeys.length > 0
  const columnType = column.type
  const columnName = column.name

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="720px">
      <div className="rule-modal">
        {mode === 'select' ? (
          isForeignKey ? (
            <ReferenceSelectContent
              column={column}
              onCancel={onClose}
              onConfirm={handleConfirmSelect}
              initialConfig={initialConfig}
            />
          ) : hasEnumList ? (
            <EnumSelectContent
              column={column}
              columnName={columnName}
              enumList={column.enumList!}
              onCancel={onClose}
              onConfirm={handleConfirmSelect}
            />
          ) : (
            <RuleSelectContent
              column={column}
              columnType={columnType}
              columnName={columnName}
              onCancel={onClose}
              onConfirm={handleConfirmSelect}
              onCreateNew={handleCreateNew}
            />
          )
        ) : (
          <RuleCreationContent
            columnType={columnType}
            columnName={columnName}
            onCancel={handleBack}
            column={column}
            onSubmit={handleRuleCreated}
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
