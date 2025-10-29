import React, { useState, useEffect } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import Table, { Column, Row } from '@renderer/components/Table'
import Checkbox from '@renderer/components/Checkbox'
import Button from '@renderer/components/Button'
import Toast from '@renderer/components/Toast'

interface FileMappingContentProps {
  tableName: string
  columns: Column[]
  rows: Row[]
  tableColumns?: { name: string; type: string }[]
  onBack: () => void
  onComplete: (mappings: MappingColumn[]) => void
}

export interface MappingColumn {
  name: string
  type: string
  mappedTo: string
  selected: boolean
}

const FileMappingContent: React.FC<FileMappingContentProps> = ({
  tableName,
  columns,
  rows,
  tableColumns = [
    { name: 'id', type: 'INT' },
    { name: 'username', type: 'VARCHAR(100)' },
    { name: 'email', type: 'VARCHAR(200)' },
    { name: 'created_at', type: 'DATETIME' },
    { name: 'updated_at', type: 'DATETIME' }
  ],
  onBack,
  onComplete
}) => {
  const [mappings, setMappings] = useState<MappingColumn[]>(
    tableColumns.map((col) => ({
      name: col.name,
      type: col.type,
      mappedTo: '',
      selected: true
    }))
  )

  const [recordCount, setRecordCount] = useState(rows.length)
  const [allowDuplicates, setAllowDuplicates] = useState(true)
  const [showToast, setShowToast] = useState(false)

  const fileHeaders = columns.map((c) => c.key)

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [showToast])

  const handleConfirm = (): void => {
    if (!mappings.some((m) => m.selected && m.mappedTo)) {
      setShowToast(true)
      return
    }
    console.log('최종 매핑 결과:', mappings)
    onComplete(mappings)
  }

  const tableCols: Column[] = [
    { key: 'select', title: '✔', type: 'checkbox' },
    { key: 'name', title: 'DB 컬럼명', type: 'text' },
    { key: 'type', title: '타입', type: 'text' },
    {
      key: 'mappedTo',
      title: '파일 컬럼 매핑',
      type: 'dropdown',
      options: fileHeaders
    }
  ]

  const handleDropdownChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    rowIndex: number
  ): void => {
    const newValue = e.target.value
    setMappings((prev) =>
      prev.map((m, idx) => (idx === rowIndex ? { ...m, mappedTo: newValue } : m))
    )
  }

  const tableRows: Row[] = mappings.map((m, i) => ({
    id: i + 1,
    select: (
      <Checkbox
        checked={m.selected}
        onChange={() =>
          setMappings((prev) =>
            prev.map((x, idx) => (idx === i ? { ...x, selected: !x.selected } : x))
          )
        }
      />
    ),
    name: m.name,
    type: m.type,
    mappedTo: (
      <div className="custom-select-wrapper">
        <select
          className="custom-select"
          value={m.mappedTo || ''}
          onChange={(e) => handleDropdownChange(e, i)}
          disabled={!m.selected}
        >
          <option value="">선택 없음</option>
          {fileHeaders.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    )
  }))

  return (
    <div className="file-content">
      <PageTitle
        title={`매핑 설정 - ${tableName}`}
        description="DB 컬럼과 파일 컬럼을 매핑합니다."
        size="small"
      />
      <hr className="divider" />

      <div className="mapping-settings">
        <div className="record-info">
          <span className="label">레코드 수 :</span>
          <span className="value">{rows.length.toLocaleString()}</span>
        </div>

        <div className="record-input">
          <span className="label">가져올 레코드 수 :</span>
          <input
            type="number"
            className="record-field"
            value={recordCount}
            onChange={(e) => setRecordCount(Number(e.target.value))}
          />
        </div>

        <Checkbox
          label="값 반복 삽입"
          checked={allowDuplicates}
          onChange={() => setAllowDuplicates((p) => !p)}
        />
      </div>

      {/* Table.tsx 직접 사용 */}
      <Table columns={tableCols} rows={tableRows} maxHeight="350px" />

      <div className="actions">
        <Button variant="gray" onClick={onBack}>
          이전
        </Button>
        <Button variant="orange" onClick={handleConfirm}>
          완료
        </Button>
      </div>

      {showToast && (
        <div className="toast-wrapper">
          <Toast type="warning" title="매핑 오류" duration={2500}>
            매핑할 컬럼을 선택해주세요.
          </Toast>
        </div>
      )}

      <style>{`
        .file-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 640px;
          padding: 28px 32px;
        }

        .divider {
          width: 100%;
          border: none;
          border-top: 1px solid var(--color-dark-gray);
          margin: 8px 0 16px;
        }

        .mapping-settings {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          margin-bottom: 20px;
          padding: 6px 0;
        }

        .record-info,
        .record-input {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .label {
          font: var(--preRegular14);
          color: var(--color-dark-gray);
        }

        .value {
          font: var(--preSemiBold14);
          color: var(--color-black);
        }

        .record-field {
          width: 120px;
          height: 34px;
          border: 1px solid #c9d8eb;
          border-radius: 8px;
          padding: 0 10px;
          font: var(--preRegular14);
          color: var(--color-black);
          text-align: right;
          box-shadow: var(--shadow);
        }

        .record-field:focus {
          border-color: var(--color-main-blue);
          outline: none;
          box-shadow: 0 0 0 3px rgba(19, 70, 134, 0.15);
        }

        .actions {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .toast-wrapper {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 9999;
        }

        .custom-select-wrapper {
          position: relative;
          display: inline-block;
          width: 100%;
        }

        .custom-select {
          width: 100%;
          appearance: none;
          border: 1px solid var(--color-gray-200);
          border-radius: 8px;
          padding: 6px 36px 6px 12px;
          font: var(--preRegular14);
          color: var(--color-black);
          cursor: pointer;
          background-color: var(--color-white);
          transition: background-color 0.2s;
        }

        .custom-select:disabled {
          background-color: #f3f4f6;
          color: var(--color-dark-gray);
          cursor: not-allowed;
        }

        .custom-select-wrapper::after {
          content: '▼';
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 10px;
          color: var(--color-dark-gray);
        }
      `}</style>
    </div>
  )
}

export default FileMappingContent
