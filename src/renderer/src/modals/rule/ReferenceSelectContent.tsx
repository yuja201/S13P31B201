import React, { useState, useMemo } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import Button from '@renderer/components/Button'
import { useSchemaStore } from '@renderer/stores/schemaStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import { ColumnDetail } from '@renderer/views/CreateDummyView'
import { RuleResult } from './RuleModal'
import type { Table } from '@main/database/types'

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

  // --- (기존 로직 동일) ---
  const schemaRef = useMemo(() => column.foreignKeys?.[0], [column.foreignKeys])
  const referencedTableName = schemaRef?.referenced_table || ''

  const referencedTableInfo: Table | undefined = useMemo(() => {
    // ... (기존 로직 동일)
    const dbId = selectedProject?.database?.id
    if (!dbId || !referencedTableName) return undefined
    const allTables = schemasMap.get(dbId)?.tables || []
    return allTables.find((t) => t.name === referencedTableName)
  }, [selectedProject?.database?.id, schemasMap, referencedTableName])

  const targetColumns = useMemo(() => {
    // ... (기존 로직 동일)
    return referencedTableInfo?.columns.map((c) => c.name) || []
  }, [referencedTableInfo])

  const [selectedColumn, setSelectedColumn] = useState(schemaRef?.referenced_column || '')
  // --- [수정 1] 드롭다운 목록을 토글할 상태 추가 ---
  const [isListOpen, setIsListOpen] = useState(false)

  const handleSave = (): void => {
    // ... (기존 로직 동일)
    if (!referencedTableName || !selectedColumn) {
      alert('참조 컬럼을 선택하세요.')
      return
    }
    const settingString = `${referencedTableName}.${selectedColumn}`
    onConfirm({
      generation: '참조',
      setting: settingString
    })
  }

  // --- (에러 UI 동일) ---
  if (!schemaRef || !referencedTableInfo) {
    return <div className="ref-select">{/* ... (기존 에러 UI) ... */}</div>
  }

  return (
    <div className="ref-select">
      <PageTitle
        title={`참조 설정 - ${column.name}`}
        description="이 컬럼이 값을 가져올 외부 테이블과 컬럼을 선택하세요."
        size="small"
      />
      <div className="divider" />
      <div className="ref-select__content">
        {/* --- 참조 테이블 (기존과 동일) --- */}
        <div className="select-group">
          <label className="preSemiBold14">참조 테이블</label>
          <input
            type="text"
            value={referencedTableName}
            disabled
            className="custom-select"
            style={{ backgroundColor: 'var(--color-white)', cursor: 'not-allowed' }}
          />
        </div>

        {/* --- [수정 2] 커스텀 Select로 변경 --- */}
        <div className="select-group">
          <label className="preSemiBold14">
            참조 컬럼 <span style={{ color: '#ED3F27' }}>*</span>
          </label>

          {/* 1. 현재 선택된 값을 보여주는 버튼 */}
          <button
            type="button"
            className="custom-select"
            onClick={() => setIsListOpen(!isListOpen)}
          >
            {/* 선택된 값이 없으면 플레이스홀더 표시 */}
            <span style={{ color: selectedColumn ? 'var(--color-black)' : '#888' }}>
              {selectedColumn || '--- 컬럼 선택 ---'}
            </span>
            {/* 커스텀 화살표 (CSS로 그림) */}
            <div className="custom-select-arrow" />
          </button>

          {/* 2. 클릭하면 나타나는 옵션 목록 (div) */}
          {isListOpen && (
            <div className="custom-select-list">
              {targetColumns.map((colName) => (
                <div
                  key={colName}
                  className={`custom-select-option ${selectedColumn === colName ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedColumn(colName) // 값 변경
                    setIsListOpen(false) // 목록 닫기
                  }}
                >
                  {colName}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* --- 하단 버튼 (기존과 동일) --- */}
      <div className="footer">
        <Button variant="gray" onClick={onCancel}>
          취소
        </Button>
        <Button variant="blue" onClick={handleSave} disabled={!selectedColumn}>
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
        }

        .ref-select__content {
          display: flex;
          flex-direction: column;
          gap: 40px;
          overflow: visible;
          margin-top:20px;
        }

        .select-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
        }

        .select-group label {
          font: var(--preSemiBold14);
          color: var(--color-black);
        }

        .custom-select {
          display: flex;
          justify-content: space-between;
          align-items: center;
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
          text-align: left;
        }
        
        button.custom-select {
          cursor: pointer;
        }

        .custom-select:disabled {
          background-color: var(--color-white);
          cursor: not-allowed;
        }

        .custom-select:focus {
          border-color: var(--color-main-blue);
          box-shadow: 0 0 0 2px rgba(19, 70, 134, 0.2);
        }

        .custom-select-arrow {
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid #666;
        }

        .custom-select-list {
          position: absolute;
          top: 100%; 
          left: 0;
          right: 0;
          background-color: var(--color-white);
          border: 1px solid var(--color-gray-200);
          border-top: none; 
          border-radius: 0 0 10px 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          max-height: 210px; 
          overflow-y: auto; 
          z-index: 100;     
        }

        .custom-select-option {
          padding: 10px 16px;
          font: var(--preRegular16);
          cursor: pointer;
        }

        .custom-select-option:hover {
          background-color: var(--color-light-blue);
        }

        .custom-select-option.selected {
          background-color: var(--color-main-blue);
          color: white;
          font-weight: var(--fw-semiBold);
        }

        .footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 40px;
        }
      `}</style>
    </div>
  )
}

export default ReferenceSelectContent
