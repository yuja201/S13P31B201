import React, { useEffect, useMemo, useState, useCallback } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import Checkbox from '@renderer/components/Checkbox'
import Button from '@renderer/components/Button'
import { useToastStore } from '@renderer/stores/toastStore'
import type { Row } from '@renderer/components/Table'
import type { MappingColumn, MappingSubmitPayload } from './types'

interface FileMappingContentProps {
  tableName: string
  tableColumns: { name: string; type: string }[]
  fileHeaders: string[]
  rows: Row[]
  recordCount: number
  maxRecords?: number | null
  onBack: () => void
  onComplete: (payload: MappingSubmitPayload) => void
}

const FileMappingContent: React.FC<FileMappingContentProps> = ({
  tableName,
  tableColumns,
  fileHeaders,
  rows,
  recordCount,
  maxRecords,
  onBack,
  onComplete
}) => {
  const availableRowLimit =
    typeof maxRecords === 'number' && maxRecords > 0 ? Math.floor(maxRecords) : null

  const normalizeRecordCount = useCallback(
    (value: number): number => {
      if (!Number.isFinite(value) || value <= 0) return 1
      const normalized = Math.floor(value)
      if (availableRowLimit) return Math.min(normalized, availableRowLimit)
      return normalized
    },
    [availableRowLimit]
  )

  const [mappings, setMappings] = useState<MappingColumn[]>(
    tableColumns.map((col) => ({
      name: col.name,
      type: col.type,
      mappedTo: '',
      selected: false
    }))
  )
  const [recordCountState, setRecordCountState] = useState<number>(() =>
    normalizeRecordCount(recordCount)
  )
  const [allowDuplicates, setAllowDuplicates] = useState(true)

  useEffect(() => {
    setMappings(
      tableColumns.map((col) => ({
        name: col.name,
        type: col.type,
        mappedTo: '',
        selected: false
      }))
    )
  }, [tableColumns])

  useEffect(() => {
    setRecordCountState(normalizeRecordCount(recordCount))
  }, [normalizeRecordCount, recordCount])

  useEffect(() => {
    setMappings((prev) =>
      prev.map((mapping) => ({
        ...mapping,
        mappedTo: fileHeaders.includes(mapping.mappedTo) ? mapping.mappedTo : ''
      }))
    )
  }, [fileHeaders])

  const activeMappings = useMemo(() => mappings.filter((m) => m.selected && m.mappedTo), [mappings])
  const showToast = useToastStore((s) => s.showToast)

  const handleConfirm = (): void => {
    if (!activeMappings.length) {
      showToast('매핑할 컬럼을 1개 이상 선택해주세요.', 'warning', '매핑 오류')
      return
    }

    onComplete({
      mappings,
      recordCount: normalizeRecordCount(recordCountState),
      allowDuplicates
    })
  }

  const formattedRowLimit = useMemo(() => {
    if (availableRowLimit) return availableRowLimit.toLocaleString()
    if (rows.length) return `${rows.length.toLocaleString()} (미리보기 기준)`
    return '미확인'
  }, [availableRowLimit, rows.length])

  return (
    <div className="file-content">
      <PageTitle
        title={`매핑 설정 - ${tableName}`}
        description="테이블 컬럼과 파일 컬럼을 연결합니다."
        size="small"
      />
      <hr className="divider" />

      <div className="mapping-settings">
        <div className="record-info">
          <span className="label">파일 데이터 행</span>
          <span className="value">{formattedRowLimit} 행</span>
        </div>
        <div className="record-input">
          <span className="label">생성할 행 수</span>
          <input
            className="record-field"
            type="number"
            min={1}
            value={recordCountState}
            onChange={(e) => setRecordCountState(normalizeRecordCount(Number(e.target.value)))}
          />
        </div>
        <div className="record-info">
          <Checkbox
            checked={allowDuplicates}
            onChange={() => setAllowDuplicates((prev) => !prev)}
          />
          <span className="label">중복 허용</span>
        </div>
      </div>
      {availableRowLimit && recordCountState === availableRowLimit && (
        <p className="hint preRegular12">
          파일에 포함된 행 수({availableRowLimit.toLocaleString()}행)를 초과할 수 없습니다.
        </p>
      )}

      <div className="mapping-table-wrapper">
        <table className="mapping-table">
          <thead>
            <tr>
              <th>선택</th>
              <th>DB 컬럼명</th>
              <th>타입</th>
              <th>파일 컬럼 매핑</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((mapping, index) => (
              <tr key={mapping.name}>
                <td className="select-cell">
                  <Checkbox
                    checked={mapping.selected}
                    onChange={() =>
                      setMappings((prev) =>
                        prev.map((item, idx) =>
                          idx === index ? { ...item, selected: !item.selected } : item
                        )
                      )
                    }
                  />
                </td>
                <td>{mapping.name}</td>
                <td>{mapping.type}</td>
                <td>
                  <div className="custom-select-wrapper">
                    <select
                      className="custom-select"
                      value={mapping.mappedTo}
                      onChange={(e) =>
                        setMappings((prev) =>
                          prev.map((item, idx) =>
                            idx === index ? { ...item, mappedTo: e.target.value } : item
                          )
                        )
                      }
                      disabled={!mapping.selected}
                    >
                      <option value="">선택 없음</option>
                      {fileHeaders.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="actions">
        <Button variant="gray" onClick={onBack}>
          이전
        </Button>
        <Button variant="orange" onClick={handleConfirm}>
          완료
        </Button>
      </div>

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
          margin-bottom: 12px;
          padding: 6px 0;
          gap: 16px;
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

        .hint {
          color: var(--color-dark-gray);
          margin-bottom: 8px;
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

        .mapping-table-wrapper {
          width: 100%;
          max-height: 320px;
          overflow-y: auto;
          border: 1px solid var(--color-gray-200);
          border-radius: 10px;
        }

        .mapping-table {
          width: 100%;
          border-collapse: collapse;
        }

        .mapping-table th {
          background-color: var(--color-header);
          color: var(--color-black);
          text-align: center;
          padding: 12px 16px;
          font: var(--preSemiBold14);
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .mapping-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-gray-200);
          text-align: center;
          vertical-align: middle;
          font: var(--preRegular14);
          background-color: var(--color-white);
        }

        .mapping-table tr:last-child td {
          border-bottom: none;
        }

        .mapping-table tr:hover td {
          background-color: var(--color-light-blue);
        }

        .select-cell {
          width: 72px;
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
          content: '⌄';
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 10px;
          color: var(--color-dark-gray);
        }

        .actions {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
      `}</style>
    </div>
  )
}

export default FileMappingContent
