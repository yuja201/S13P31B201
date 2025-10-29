import React, { useState } from 'react'
import { ArrowRight } from 'react-feather'
import Checkbox from '@renderer/components/Checkbox'

type ColumnType = 'text' | 'checkbox' | 'dropdown' | 'icon'

interface Column {
  key: string
  title: string
  type: ColumnType
  options?: string[]
}

interface Row {
  id: number | string
  [key: string]: unknown
}

interface TableProps {
  columns: Column[]
  rows: Row[]
  showFooter?: boolean
  footerText?: string
  onSelectRow?: (selectedIds: (number | string)[]) => void
  maxHeight?: string
}

const Table: React.FC<TableProps> = ({
  columns,
  rows,
  showFooter = false,
  footerText = '',
  onSelectRow,
  maxHeight = '424px'
}): React.ReactElement => {
  const [selectedRows, setSelectedRows] = useState<(number | string)[]>([])

  const handleSelectAll = (): void => {
    if (selectedRows.length === rows.length) {
      setSelectedRows([])
      onSelectRow?.([])
    } else {
      const allIds = rows.map((r) => r.id)
      setSelectedRows(allIds)
      onSelectRow?.(allIds)
    }
  }

  const handleSelect = (id: number | string): void => {
    const updated = selectedRows.includes(id)
      ? selectedRows.filter((r) => r !== id)
      : [...selectedRows, id]
    setSelectedRows(updated)
    onSelectRow?.(updated)
  }

  return (
    <>
      <style>
        {`
        .table-container {
          border: 1px solid var(--color-gray-200);
          border-radius: 8px;
          background-color: var(--color-white);
          box-shadow: var(--shadow);
          width: 100%;
          max-height: 442px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .table-wrapper {
          overflow-y: auto;
          overflow-x: auto;
        }

        .table-wrapper.no-scroll {
          overflow: hidden;
          max-height: none;
        }

        .custom-table {
          width: 100%;
          border-collapse: separate; 
          border-spacing: 0;
          font-family: var(--font-family);
          border: none;
        }

        .custom-table th {
          font: var(--preSemiBold14);
          color: var(--color-black);
          text-align: center;
          padding: 16px 18px;
          background-color: var(--color-header);
          position: sticky;
          top: 0;
          z-index: 1;
          border-bottom: 1px solid var(--color-gray-200);
        }

        .custom-table td {
          font: var(--preRegular14);
          color: var(--color-black);
          text-align: left;
          padding: 12px 18px;
          border-bottom: 1px solid var(--color-background);
          vertical-align: middle;
          background-color: var(--color-white);
          transition: background-color 0.15s ease;
        }

        .custom-table th,
        .custom-table td {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .custom-table tr:hover td {
          background-color: var(--color-light-blue);
        }

        .custom-table tr:last-child td {
          border-bottom: none;
        }

        /* 체크박스 / 아이콘 */
        .checkbox-cell {
          text-align: center;
          width: 48px;
        }
        .icon-cell {
          text-align: center;
          width: 48px;
          color: var(--color-dark-gray);
          cursor: pointer;
        }

        /* footer */
        .table-footer {
          text-align: center;
          padding: 20px 0;
          border-top: 1px solid var(--color-gray-200);
        }

        /* 드롭다운 */
        .dropdown-cell {
          overflow: visible;
          white-space: normal;
        }

        .custom-select-wrapper {
          position: relative;
          display: inline-block;
          min-width: 120px;
          width: 100%;
        }

        .custom-select {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-color: var(--color-white);
          border: 1px solid var(--color-gray-200);
          border-radius: 8px;
          padding: 6px 36px 6px 12px;
          font: var(--preRegular14);
          color: var(--color-black);
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }

        .custom-select:focus {
          border-color: var(--color-main-blue);
          box-shadow: 0 0 0 3px rgba(19, 70, 134, 0.15);
        }

        .custom-select-wrapper::after {
          content: '▼';
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 10px;
          color: var(--color-dark-gray);
          pointer-events: none;
        }

        .custom-select option {
          font-family: var(--font-family);
          font-size: 14px;
          background-color: var(--color-white);
          color: var(--color-black);
        }
      `}
      </style>

      <div className="table-container" style={{ maxHeight }}>
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                {columns.map((col) => {
                  if (col.type === 'checkbox') {
                    return (
                      <th key={col.key} className="checkbox-cell">
                        <Checkbox
                          checked={selectedRows.length > 0 && selectedRows.length === rows.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                    )
                  }
                  return <th key={col.key}>{col.title}</th>
                })}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map((col) => {
                    switch (col.type) {
                      case 'checkbox':
                        return (
                          <td key={col.key} className="checkbox-cell">
                            <Checkbox
                              checked={selectedRows.includes(row.id)}
                              onChange={() => handleSelect(row.id)}
                            />
                          </td>
                        )
                      case 'dropdown':
                        return (
                          <td key={col.key} className="dropdown-cell">
                            <div className="custom-select-wrapper">
                              <select
                                defaultValue={String(row[col.key] ?? '')}
                                className="custom-select"
                              >
                                {col.options?.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                        )
                      case 'icon':
                        return (
                          <td key={col.key} className="icon-cell">
                            <ArrowRight size={16} />
                          </td>
                        )
                      default:
                        return <td key={col.key}>{String(row[col.key] ?? '')}</td>
                    }
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showFooter && <div className="table-footer preRegular14">{footerText}</div>}
      </div>
    </>
  )
}

export default Table
export type { Column, Row }
