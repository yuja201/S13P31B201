import React, { useState } from 'react'
import { TableInfo } from '@renderer/views/CreateDummyView'
import MiniSearchBox from '@renderer/components/MiniSearchBox'

type DBTableListProps = {
  tables: TableInfo[]
  focusedTableId: string
  onTableSelect: (table: TableInfo) => void
}

const DBTableList: React.FC<DBTableListProps> = ({ tables, focusedTableId, onTableSelect }) => {
  const [selectedTableIds, setSelectedTableIds] = useState<Set<string>>(
    new Set(tables.filter((t) => t.id === 'users' || t.id === 'categories').map((t) => t.id))
  )

  const handleCheckboxChange = (tableId: string, isChecked: boolean): void => {
    setSelectedTableIds((prevSelectedIds) => {
      const newSelectedIds = new Set(prevSelectedIds)
      if (isChecked) {
        newSelectedIds.add(tableId)
      } else {
        newSelectedIds.delete(tableId)
      }
      return newSelectedIds
    })
  }

  return (
    <>
      <div className="table-list-wrapper"></div>
      <div className="table-list-container">
        {/* --- 테이블 목록 헤더 --- */}
        <div className="list-header">
          <h3 className="preSemiBold20">테이블 목록</h3>
          <span className="preRegular14">{tables.length} table</span>
        </div>
        {/* --- 검색창 --- */}
        <div className="search-bar">
          <MiniSearchBox placeholder="테이블 검색" />
        </div>

        {/* --- 테이블 리스트 --- */}
        <ul className="table-list">
          {tables.map((table) => (
            <li
              key={table.id}
              // 현재 포커스된 테이블인지 확인하고 'active' 클래스 부여
              className={`table-list-item ${table.id === focusedTableId ? 'active' : ''}`}
              onClick={() => onTableSelect(table)} // 클릭 시 부모의 상태 변경 함수 호출
            >
              <input
                type="checkbox"
                checked={selectedTableIds.has(table.id)}
                onChange={(e) => handleCheckboxChange(table.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="table-item-info">
                <span className="preMedium16">{table.name}</span>
                <span className="preRegular12">
                  {table.columns} columns · {table.rows} row
                </span>
              </div>
            </li>
          ))}
        </ul>

        {/* --- 하단 선택 개수 --- */}
        <div className="list-footer preRegular14">
          <span>선택된 테이블</span>
          <span>{selectedTableIds.size}개</span>
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
          padding: 20px;
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
        }
        .table-item-info {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          min-width: 0;
        }
        .table-item-info .preRegular12 {
          color: var(--color-dark-gray);
        }
        .list-footer {
          width: 100%;
          display: flex;
          justify-content: space-between;
          color: var(--color-dark-gray);
          margin-top: 8px;
          padding-top: 16px;
          border-top: 1px solid var(--color-gray-200);
          flex-shrink: 0;
        }

          /* 스크롤바 전체 영역 */
        .table-list::-webkit-scrollbar {
          width: 10px; 
        }

        /* 스크롤바 트랙 (배경) */
        .table-list::-webkit-scrollbar-track {
          background-color: transparent; 
          border-radius: 20px;
        }

        /* 스크롤바 핸들 (움직이는 막대) */
        .table-list::-webkit-scrollbar-thumb {
          background-color: var(--color-gray-200); 
          border-radius: 12px; 
          border: 2px solid transparent; 
          background-clip: content-box; 
        }

        /* 핸들에 마우스 올렸을 때 */
        .table-list::-webkit-scrollbar-thumb:hover {
          background-color: var(--color-placeholder); 
        }
      `}</style>
    </>
  )
}

export default DBTableList
