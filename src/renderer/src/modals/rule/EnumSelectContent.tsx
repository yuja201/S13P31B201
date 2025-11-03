import React, { useState } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import Button from '@renderer/components/Button'

interface EnumSelectContentProps {
  columnType?: string
  columnName: string
  enumList: string[]
  onCancel: () => void
  onConfirm: (value: string) => void // (generation/setting 대신 일단 '고정값'만 전달)
}

const EnumSelectContent: React.FC<EnumSelectContentProps> = ({
  columnName,
  enumList,
  onCancel,
  onConfirm
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(enumList[0] || '')

  const handleConfirm = (): void => {
    onConfirm(selectedValue)
  }

  return (
    <div className="enum-select">
      <PageTitle
        title={`생성 규칙 선택 - ${columnName}`}
        description={`이 컬럼은 ENUM 타입입니다. 목록에서 고정값을 선택하세요.`}
        size="small"
      />
      <hr className="divider" />

      <div className="enum-list">
        {enumList.map((enumValue) => (
          <label key={enumValue} className="enum-option preRegular16">
            <input
              type="radio"
              name={`enum-group-${columnName}`}
              value={enumValue}
              checked={selectedValue === enumValue}
              onChange={() => setSelectedValue(enumValue)}
            />
            {enumValue}
          </label>
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
        .divider {
          border: none;
          border-top: 1px solid rgba(0, 0, 0, 0.15);
          margin-top: 12px;
        }
        .enum-list {
          display: flex;
          flex-direction: column;
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
          gap: 10px;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }
        .enum-option:hover {
          background-color: rgba(0, 0, 0, 0.05);
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
