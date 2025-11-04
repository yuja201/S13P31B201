// @renderer/modals/rule/ReferenceSelectContent.tsx

import React, { useState, useMemo } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import Button from '@renderer/components/Button'
import { useSchemaStore } from '@renderer/stores/schemaStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import { ColumnDetail } from '@renderer/views/CreateDummyView'
import { RuleResult } from './RuleModal'
import type { Table } from '@main/database/types'

type ReferenceStrategy = 'RANDOM_SAMPLE' | 'FIXED_VALUE'

interface ReferenceSelectContentProps {
  column: ColumnDetail
  onCancel: () => void
  onConfirm: (result: RuleResult) => void
}

const ReferenceSelectContent: React.FC<ReferenceSelectContentProps> = ({
  column,
  onCancel,
  onConfirm
}) => {
  const { selectedProject } = useProjectStore()
  const schemasMap = useSchemaStore((state) => state.schemas)

  // --- (기존 FK 정보 로직은 동일) ---
  const schemaRef = useMemo(() => column.foreignKeys?.[0], [column.foreignKeys])
  const referencedTableName = schemaRef?.referenced_table || ''
  const referencedColumnName = schemaRef?.referenced_column || ''

  const [strategy, setStrategy] = useState<ReferenceStrategy>('RANDOM_SAMPLE')
  const [fixedValue, setFixedValue] = useState('')

  const handleSave = (): void => {
    // "무작위 샘플링" 선택 시 (기존 '참조' 로직)
    if (strategy === 'RANDOM_SAMPLE') {
      const settingString = `${referencedTableName}.${referencedColumnName}`
      onConfirm({
        generation: '참조',
        setting: settingString
      })
    }
    // "고정값 지정" 선택 시 ('고정값' 로직)
    else {
      if (!fixedValue.trim()) {
        alert('사용할 고정값을 입력하세요.')
        return
      }
      onConfirm({
        generation: '고정값',
        setting: fixedValue
      })
    }
  }

  if (!schemaRef || !referencedTableName) {
    return (
      <div className="ref-select">
        {/* ... (기존 에러 UI) ... */}
      </div>
    )
  }

  return (
    <div className="ref-select">
      <PageTitle
        title={`참조 설정 - ${column.name}`}
        description="참조 컬럼에서 값을 가져올 방식을 선택하세요."
        size="small"
      />
      <div className="divider" />
      <div className="ref-select__content">
        <div className="select-group">
          <label className="preSemiBold14">참조 테이블</label>
          <input
            type="text"
            value={referencedTableName}
            disabled
            className="custom-select"
          />
        </div>
        <div className="select-group">
          <label className="preSemiBold14">참조 컬럼</label>
          <input
            type="text"
            value={referencedColumnName}
            disabled
            className="custom-select"
          />
        </div>

        {/* ---  생성 방식 선택 UI (라디오 버튼) --- */}
        <div className="select-group">
          <label className="preSemiBold14">
            생성 방식 <span style={{ color: '#ED3F27' }}>*</span>
          </label>
          <div className="radio-group">
            {/* 옵션 1: 무작위 샘플링 */}
            <label
              className={`radio-option ${strategy === 'RANDOM_SAMPLE' ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="ref-strategy"
                value="RANDOM_SAMPLE"
                checked={strategy === 'RANDOM_SAMPLE'}
                onChange={() => setStrategy('RANDOM_SAMPLE')}
              />
              <div className="radio-label">
                <span className="preSemiBold16">무작위 샘플링 (권장)</span>
                <span className="preRegular14">
                  {referencedTableName} 테이블의 값 중 무작위로 선택
                </span>
              </div>
            </label>
            {/* 옵션 2: 고정값 지정 */}
            <label
              className={`radio-option ${strategy === 'FIXED_VALUE' ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="ref-strategy"
                value="FIXED_VALUE"
                checked={strategy === 'FIXED_VALUE'}
                onChange={() => setStrategy('FIXED_VALUE')}
              />
              <div className="radio-label">
                <span className="preSemiBold16">고정값 지정</span>
                <span className="preRegular14">
                  참조할 특정 ID를 직접 입력
                </span>
              </div>
            </label>
          </div>
        </div>

        {strategy === 'FIXED_VALUE' && (
          <div className="select-group">
            <label className="preSemiBold14">
              고정값 <span style={{ color: '#ED3F27' }}>*</span>
            </label>
            <input
              type="text"
              value={fixedValue}
              onChange={(e) => setFixedValue(e.target.value)}
              className="custom-select"
              placeholder="예: 10 (숫자), 'abc' (문자)"
            />
          </div>
        )}
      </div>
      {/* --- 하단 버튼 --- */}
      <div className="footer">
        <Button variant="gray" onClick={onCancel}>
          취소
        </Button>
        <Button variant="blue" onClick={handleSave}>
          저장
        </Button>
      </div>

      <style>{`
        .ref-select {
          display: flex;
          flex-direction: column;
          gap: 25px;
          padding: 0 14px 14px 0;
        }
        .divider {
          border: none;
          border-top: 1px solid var(--color-gray-200);
          margin-top: 12px;
        }
        .ref-select__content {
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow: visible;
        }
        .select-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .select-group label {
          font: var(--preSemiBold14);
          color: var(--color-black);
        }
        .custom-select {
          width: 100%;
          height: 42px;
          border: 1px solid var(--color-gray-200);
          border-radius: 10px;
          padding: 0 16px;
          font: var(--preRegular16);
          outline: none;
          background-color: var(--color-white);
          color: var(--color-black);
          box-sizing: border-box;
        }
        .custom-select:disabled {
          background-color: var(--color-background);
          cursor: not-allowed;
        }
        .custom-select:focus {
          border-color: var(--color-main-blue);
          box-shadow: 0 0 0 2px rgba(19, 70, 134, 0.2);
        }

        /* --- 라디오 버튼 스타일 --- */
        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .radio-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border: 1.5px solid var(--color-gray-200);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .radio-option:hover {
          border-color: var(--color-main-blue);
        }
        .radio-option.selected {
          border-color: var(--color-main-blue);
          background-color: var(--color-light-blue);
          box-shadow: 0 0 0 2px rgba(19, 70, 134, 0.2);
        }
        .radio-option input[type='radio'] {
          /* 기본 라디오 버튼 숨기기 */
          appearance: none;
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border: 1.5px solid var(--color-gray-400);
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        .radio-option input[type='radio']:checked {
          background-color: var(--color-main-blue);
          border-color: var(--color-main-blue);
          background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white"%3e%3ccircle cx="8" cy="8" r="4" /%3e%3c/svg%3e');
          background-position: center;
          background-repeat: no-repeat;
        }
        .radio-label {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .radio-label .preRegular14 {
          color: var(--color-dark-gray);
        }
        
        .footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  )
}

export default ReferenceSelectContent