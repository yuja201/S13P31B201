import React from 'react'
import { FaSearch } from 'react-icons/fa'

import { TableInfo } from '@renderer/views/CreateDummyView'

type DBTableListProps = {
  tables: TableInfo[]
  focusedTableId: string
  onTableSelect: (table: TableInfo) => void
}

const DBTableList: React.FC<DBTableListProps> = ({ tables, focusedTableId, onTableSelect }) => {
  return (
    <>
      {/* --- 테이블 목록 헤더 --- */}
      <div className="list-header">
        <h3 className="preSemiBold18">테이블 목록</h3>
        <span className="preRegular14">{tables.length} table</span>
      </div>

      <div className="search-bar">
        <FaSearch color="var(--color-placeholder)" />
        <input type="text" placeholder="테이블 검색" className="preRegular14" />
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
              defaultChecked={table.id === 'users' || table.id === 'categories'}
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
        <span>2개</span>
      </div>

      {/* --- TableList 전용 스타일 --- */}
      <style>{`
        .list-header {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 16px;
        }
        .list-header span {
          color: var(--color-dark-gray);
        }
        .search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: var(--color-background);
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 16px;
        }
        .search-bar input {
          border: none;
          background: transparent;
          width: 100%;
          outline: none;
        }
        .table-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .table-list-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .table-list-item:hover {
          background-color: var(--color-background);
        }
        /* [!] 활성화된 아이템 스타일 */
        .table-list-item.active {
          background-color: var(--color-light-blue);
          border: 1px solid var(--color-main-blue);
        }
        .table-list-item input[type='checkbox'] {
          width: 16px;
          height: 16px;
        }
        .table-item-info {
          display: flex;
          flex-direction: column;
        }
        .table-item-info .preRegular12 {
          color: var(--color-dark-gray);
        }
        .list-footer {
          display: flex;
          justify-content: space-between;
          color: var(--color-dark-gray);
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--color-gray-200);
        }
      `}</style>
    </>
  )
}

export default DBTableList
