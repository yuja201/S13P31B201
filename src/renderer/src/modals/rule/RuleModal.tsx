import React, { useState, useEffect } from 'react'
import Modal from '@renderer/components/Modal'
import RuleSelectContent from '@renderer/modals/rule/RuleSelectContent'
import RuleCreationContent, { RuleCreationData } from '@renderer/modals/rule/RuleCreationContent'
import { ColumnDetail } from '@renderer/views/CreateDummyView'
import EnumSelectContent from '@renderer/modals/rule/EnumSelectContent'

export type GenerationType = 'Faker.js' | 'AI' | '참조' | '파일 업로드' | '고정값' | 'ENUM'

export type RuleResult = {
  generation: GenerationType
  setting: string
}

interface RuleModalProps {
  isOpen: boolean
  onClose: () => void
  column: ColumnDetail
  onConfirm: (result: RuleResult) => void
}

const RuleModal: React.FC<RuleModalProps> = ({ isOpen, onClose, column, onConfirm }) => {
  const [mode, setMode] = useState<'select' | 'create'>('select')

  const handleCreateNew = (): void => {
    setMode('create')
  }

  const handleBack = (): void => {
    setMode('select')
  }

  const handleConfirmSelect = (result: RuleResult): void => {
    console.log(`Column '${column.name}' - Selected Rule:`, result)
    onConfirm(result)
  }

  const handleCreateSubmit = (data: RuleCreationData): void => {
    console.log(`Column '${column.name}' - New Rule Created:`, data)

    const generation =
      data.source === 'faker' ? 'Faker.js' : data.source === 'ai' ? 'AI' : data.source

    const result: RuleResult = {
      generation: generation as GenerationType,
      setting: data.settingName
    }
    onConfirm(result)
  }

  useEffect(() => {
    if (!isOpen) {
      setMode('select')
    }
  }, [isOpen])

  const hasEnumList = column.enumList && column.enumList.length > 0
  const columnType = column.type
  const columnName = column.name

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="720px">
      <div className="rule-modal">
        {mode === 'select' ? (
          hasEnumList ? (
            <EnumSelectContent
              columnName={columnName}
              enumList={column.enumList!}
              onCancel={onClose}
              onConfirm={handleConfirmSelect}
            />
          ) : (
            // ENUM 목록이 없으면 기존 RuleSelectContent 렌더링
            <RuleSelectContent
              columnType={columnType}
              columnName={columnName}
              onCancel={onClose}
              onConfirm={handleConfirmSelect}
              onCreateNew={handleCreateNew}
            />
          )
        ) : (
          // "새로 만들기" 모드
          <RuleCreationContent
            columnType={columnType}
            columnName={columnName}
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
