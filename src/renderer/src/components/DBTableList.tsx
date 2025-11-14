import React, { useState, useMemo } from 'react'
import { TableInfo } from '@renderer/views/CreateDummyView'
import MiniSearchBox from '@renderer/components/MiniSearchBox'

type DBTableListProps = {
  tables: TableInfo[]
  focusedTableId: string
  selectedTables: Set<string>
  handleCheckboxChange: (tableId: string, checked: boolean) => void
  onTableSelect: (table: TableInfo) => void
  onDeselectAll: () => void
  validationStatus: Map<string, boolean>
}

const DBTableList: React.FC<DBTableListProps> = ({
  tables,
  focusedTableId,
  selectedTables,
  handleCheckboxChange,
  onTableSelect,
  onDeselectAll,
  validationStatus
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  // 선택된 테이블 이름과 ID 매핑
  const filteredTables = useMemo(() => {
    if (!searchQuery) {
      return tables
    }
    const lowerCaseQuery = searchQuery.toLowerCase()
    return tables.filter((table) => table.name.toLowerCase().includes(lowerCaseQuery))
  }, [tables, searchQuery])

  // 선택된 테이블 이름과 ID 매핑
  const selectedTableData = useMemo(() => {
    return Array.from(selectedTables)
      .map((tableId) => {
        const table = tables.find((t) => t.id === tableId)
        return table ? { id: table.id, name: table.name } : null
      })
      .filter((table): table is { id: string; name: string } => table !== null)
  }, [selectedTables, tables])

  // 개별 테이블 선택 해제
  const handleRemoveTable = (tableId: string, e: React.MouseEvent): void => {
    e.stopPropagation()
    handleCheckboxChange(tableId, false)
  }

  return (
    <>
      <div className="table-list-container shadow">
        {/* --- 테이블 목록 헤더 --- */}
        <div className="list-header">
          <h3 className="preSemiBold20">테이블 목록</h3>
          <div className="list-header-actions">
            <span className="preRegular14">{filteredTables.length} tables</span>
          </div>
        </div>

        {/* --- 검색창 --- */}
        <div className="search-bar">
          <MiniSearchBox placeholder="테이블 검색" onSearch={setSearchQuery} />
        </div>

        {/* --- 테이블 리스트 --- */}
        <ul className="table-list">
          {filteredTables.map((table) => {
            // 경고 상태 확인
            const isSelected = selectedTables.has(table.id)
            const isReady = validationStatus.get(table.id) ?? true
            const needsAttention = isSelected && !isReady

            return (
              <li
                key={table.id}
                className={`table-list-item ${table.id === focusedTableId ? 'active' : ''} ${
                  needsAttention ? 'needs-attention' : ''
                }`}
                onClick={() => onTableSelect(table)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    handleCheckboxChange(table.id, e.target.checked)
                    onTableSelect(table)
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="table-item-info">
                  <div className="table-name-wrapper">
                    <span className="preMedium16">{table.name}</span>
                    {needsAttention && <span className="attention-icon">⚠️</span>}
                  </div>
                  <span className="preRegular12">
                    {table.columns} columns · {table.rows} row
                  </span>
                </div>
              </li>
            )
          })}
        </ul>

        {/* --- 개선된 하단 영역 --- */}
        <div className="list-footer">
          {selectedTables.size > 0 ? (
            <div className="selected-info-wrapper">
              <div className="selected-header">
                <div className="selected-count-badge">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M11.667 3.5L5.25 9.917 2.333 7"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="preMedium14">{selectedTables.size}개 선택됨</span>
                </div>
                <button className="clear-button preRegular12" onClick={onDeselectAll}>
                  전체 해제
                </button>
              </div>
              <div className="selected-names-container">
                {selectedTableData.map((table) => (
                  <span
                    key={table.id}
                    className="table-tag preRegular12"
                    onClick={(e) => handleRemoveTable(table.id, e)}
                  >
                    <span className="table-tag-name">{table.name}</span>
                    <svg
                      className="table-tag-close"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-selection preRegular14">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 1v14M1 8h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span>테이블을 선택해주세요</span>
            </div>
          )}
        </div>
      </div>

      {/* --- TableList 전용 스타일 --- */}
      <style>{`
        .table-list-container{
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 280px;
          flex-shrink: 0;
          background-color: var(--color-white);
          border-radius: 10px;
          padding: 20px 20px 16px 20px;
          margin-right: 24px;
          height: 760px;
        }
        .list-header {
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          gap: 4px;
          flex-shrink: 0;
        }
        .list-header-actions {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .list-header span {
          color: var(--color-dark-gray);
          padding: 4px;
        }
        .search-bar {
          width: 100%;
          display: flex;
          align-items: center;
          border-radius: 6px;
          margin-bottom: 16px;
          flex-shrink: 0;
        }
        .table-list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-grow: 1;
          overflow-y: auto;
          list-style: none;
          padding: 10px 4px 0 0;
        }
        .table-list-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px;
          border-radius: 10px;
          cursor: pointer;
          background-color: var(--color-background);
          border: 1.5px solid transparent;
          transition: background 0.3s ease, border-color 0.1s ease;
          flex-shrink: 0;
        }

        .table-list-item:hover {
          background-color: var(--color-light-blue);
          border-color: var(--color-main-blue);
        }

        .table-list-item.active {
          background-color: var(--color-light-blue);
          border-color: var(--color-main-blue);
        }
        .table-list-item input[type='checkbox'] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        .table-item-info {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          min-width: 0;
          gap: 2px;
        }
        .table-item-info .preRegular12 {
          color: var(--color-dark-gray);
        }

        .list-footer {
          width: 100%;
          height: 120px;
          display: flex;
          flex-direction: column;
          margin-top: 12px;
          padding-top: 16px;
          border-top: 1.5px solid var(--color-gray-200);
          flex-shrink: 0;
          justify-content: center;
        }

        .selected-info-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          height: 100%;
        }

        .selected-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          flex-shrink: 0;
        }

        .selected-count-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background-color: var(--color-main-blue);
          border-radius: 20px;
          color: white;
          flex-shrink: 0;
        }

        .selected-count-badge svg {
          flex-shrink: 0;
        }

        .clear-button {
          background: transparent;
          border: none;
          color: var(--color-dark-gray);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .clear-button:hover {
          background-color: var(--color-gray-200);
          color: var(--color-black);
        }

        .selected-names-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          min-height: 0px;
          overflow-y: auto;
          padding: 2px;
          flex: 1; 
        }

        .table-tag {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          background-color: var(--color-light-blue);
          color: var(--color-main-blue);
          border-radius: 6px;
          font-weight: 500;
          white-space: nowrap;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
          height:24px;
        }

        .table-tag:hover {
          background-color: #bfdbfe;
          padding-right: 8px;
        }

        .table-tag-name {
          transition: margin-right 0.2s ease;
        }

        .table-tag:hover .table-tag-name {
          margin-right: 4px;
        }

        .table-tag-close {
          opacity: 0;
          width: 0;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .table-tag:hover .table-tag-close {
          opacity: 1;
          width: 14px;
        }

        .empty-selection {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          color: var(--color-placeholder);
        }

        .empty-selection svg {
          opacity: 0.5;
        }

        .table-list::-webkit-scrollbar,
        .selected-names-container::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .table-list::-webkit-scrollbar-track,
        .selected-names-container::-webkit-scrollbar-track {
          background-color: transparent;
          border-radius: 20px;
        }

        .table-list::-webkit-scrollbar-thumb,
        .selected-names-container::-webkit-scrollbar-thumb {
          background-color: var(--color-gray-200);
          border-radius: 12px;
          border: 2px solid transparent;
          background-clip: content-box;
        }

        .table-list::-webkit-scrollbar-thumb:hover,
        .selected-names-container::-webkit-scrollbar-thumb:hover {
          background-color: var(--color-placeholder);
        }

        .table-name-wrapper {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .table-list-item.needs-attention .preMedium16 {
          color: #B45309;
        }
        .attention-icon {
          font-size: 12px;
        }
      `}</style>
    </>
  )
}

export default DBTableList
