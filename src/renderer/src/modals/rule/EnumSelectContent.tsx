import { formatCheckConstraint } from '@renderer/utils/formatConstraint'
import React, { useState } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import Button from '@renderer/components/Button'
import { RuleSelection } from './RuleSelectContent'
import { ColumnDetail } from '@renderer/views/CreateDummyView'

interface EnumSelectContentProps {
  column: ColumnDetail
  columnName: string
  enumList: string[]
  onCancel: () => void
  onConfirm: (result: RuleSelection) => void
}

const EnumSelectContent: React.FC<EnumSelectContentProps> = ({
  column,
  columnName,
  enumList,
  onCancel,
  onConfirm
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(enumList[0] || '')

  const handleConfirm = (): void => {
    onConfirm({
      columnName,
      dataSource: 'FIXED',
      metaData: {
        fixedValue: selectedValue
      }
    })
  }

  return (
    <div className="enum-select">
      <PageTitle
        title={`생성 규칙 선택 - ${columnName}`}
        description={`이 컬럼은 ENUM 타입입니다. 목록에서 고정값을 선택하세요.`}
        size="small"
      />
      {column.checkConstraint && (
        <div className="check-constraint-notice">
          ※ 참고: 이 컬럼에는 <span>{formatCheckConstraint(column.checkConstraint)}</span> CHECK 제약이 있습니다.
        </div>
      )}
      <div className="divider" />

      <div className="enum-list">
        {enumList.map((enumValue) => (
          <div
            key={enumValue}
            className={`enum-option preRegular16 ${selectedValue === enumValue ? 'selected' : ''}`}
            onClick={() => setSelectedValue(enumValue)}
          >
            {enumValue}
          </div>
        ))}
      </div>

      <div className="enum-footer">
        <Button variant="gray" onClick={onCancel}>
          취소
        </Button>
        <Button variant="orange" onClick={handleConfirm}>
          확인
        </Button>
      </div>

      <style>{`
        .enum-select {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 0 14px 14px 0;
        }
        .check-constraint-notice {
           background-color: var(--color-light-yellow);
           border: 1px solid var(--color-orange);
           border-radius: 8px;
           padding: 10px 12px;
           font: var(--preRegular14);
           color: var(--color-dark-gray);
        }

         .check-constraint-notice span {
             font-weight: var(--fw-semiBold);
             color: var(--color-black);
        }

        .divider {
          border: none;
          border-top: 1px solid var(--color-gray-200); 
          margin-top: 12px;
        }

        .enum-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); 
          gap: 12px;
          max-height: 300px;
          overflow-y: auto;
          padding: 10px;
          background-color: var(--color-background);
          border-radius: 8px;
        }

        .enum-option {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          padding: 12px 16px;
          border-radius: 8px; 
          transition: all 0.2s ease;
          background-color: var(--color-white);
          border: 1.5px solid var(--color-gray-200); 
          color: var(--color-dark-gray);
          text-align: center;
        }

        .enum-option:hover {
          background-color: var(--color-white);
          border-color: var(--color-main-blue); 
          color: var(--color-main-blue);
        }

        .enum-option.selected {
          background-color: var(--color-light-blue);
          border-color: var(--color-main-blue);
          color: var(--color-main-blue);
          font-weight: var(--fw-semiBold);
        }

        .enum-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  )
}

export default EnumSelectContent
