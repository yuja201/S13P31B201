import React, { useState } from 'react'
import { TableInfo } from '@renderer/views/CreateDummyView'
import { Button } from '@renderer/components/Button' // [!] 1. Button 컴포넌트 import (경로 확인)

type DBTableDetailProps = {
  table: TableInfo
}

const TableDetail: React.FC<DBTableDetailProps> = ({ table }) => {
  const [rows, setRows] = useState(1000)

  return (
    <>
      {/* --- 상세 헤더 --- */}
      <div className="detail-header">
        <h2 className="preBold24">{table.name}</h2>
        <span className="preRegular14">
          {table.columns} columns · {table.rows} row
        </span>
      </div>

      {/* --- 생성 옵션 --- */}
      <div className="options-row">
        <div className="input-group">
          <label className="preSemiBold16">생성할 데이터 개수</label>
          <input
            type="number"
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
            placeholder="e.g., 1,000"
            className="preRegular16"
          />
        </div>
        <Button variant="blue" size="md">
          파일로 추가
        </Button>
      </div>

      {/* --- 컬럼 설정 테이블 --- */}
      <table className="column-table">
        {/* 테이블 헤더 */}
        <thead className="preRegular14">
          <tr>
            <th>컬럼명</th>
            <th>타입</th>
            <th>제약조건</th>
            <th>생성 방식</th>
            <th>설정</th>
          </tr>
        </thead>
        {/* 테이블 바디 (컬럼 목록) */}
        <tbody className="preRegular14">
          {table.columnDetails.map((col) => (
            <tr key={col.name}>
              <td className="preMedium14">{col.name}</td>
              <td>{col.type}</td>
              <td>
                <div className="constraint-badges">
                  {col.constraints.map((c) => (
                    <span key={c} className={`badge badge-${c.toLowerCase()}`}>
                      {c}
                    </span>
                  ))}
                </div>
              </td>
              <td>{col.generation}</td>
              <td>
                {/* [!] 3. <button>을 <Button> 컴포넌트로 교체 */}
                <Button variant="gray" size="sm">
                  {col.setting} 🖊️
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Button variant="blue" size="lg" style={{ width: '100%', marginTop: '32px' }}>
        데이터 생성
      </Button>

      <style>{`
        /* [!] 5. 기존 버튼(.add-file-btn, .generate-btn, .setting-btn) CSS 제거 */
        .detail-header {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }
        .detail-header span {
          color: var(--color-dark-gray);
        }
        .options-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 24px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-group input {
          width: 300px;
          padding: 8px 12px;
          border: 1px solid var(--color-gray-200);
          border-radius: 6px;
        }

        /* 컬럼 테이블 */
        .column-table {
          width: 100%;
          margin-top: 24px;
          border-collapse: collapse;
          border-top: 1px solid var(--color-gray-200);
        }
        .column-table th, .column-table td {
          padding: 16px 8px;
          text-align: left;
          vertical-align: middle;
          border-bottom: 1px solid var(--color-gray-200);
        }
        .column-table th {
          color: var(--color-dark-gray);
        }

        /* 뱃지 스타일 (유지) */
        .constraint-badges {
          display: flex;
          gap: 4px;
        }
        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .badge-pk { background-color: #FFFBEB; color: #B45309; }
        .badge-fk { background-color: #EFF6FF; color: #1D4ED8; }
        .badge-not { background-color: #FEF2F2; color: #B91C1C; }
        .badge-unique { background-color: #F0FDF4; color: #15803D; }
        .badge-enum { background-color: #F5F3FF; color: #5B21B6; }
      `}</style>
    </>
  )
}

export default TableDetail
