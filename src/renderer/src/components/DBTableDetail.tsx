import React, { useState } from 'react'
import { TableInfo } from '@renderer/views/CreateDummyView'
import Button from '@renderer/components/Button'

type DBTableDetailProps = {
  table: TableInfo
}

const TableDetail: React.FC<DBTableDetailProps> = ({ table }) => {
  const [rows, setRows] = useState(1000)

  return (
    <>
      <div className="table-detail-container shadow">
        {/* --- 상세 헤더 --- */}
        <div className="detail-header shadow">
          <h2 className="preBold24">{table.name}</h2>
          <span className="preRegular14">
            {table.columns} columns · {table.rows} row
          </span>
        </div>
        {/* --- 콘텐츠 영역  --- */}
        <div className="detail-content ">
          {/* --- 생성 옵션 --- */}
          <div className="options-row">
            <div className="input-group">
              <label className="preSemiBold16">생성할 데이터 개수</label>
              <input
                type="number"
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                placeholder="e.g., 1,000"
                className="preMedium16 shadow"
                step="100"
              />
            </div>
            <Button variant="blue" size="sm" style={{ whiteSpace: 'nowrap' }}>
              파일로 추가
            </Button>
          </div>

          {/* --- 컬럼 설정 테이블 --- */}
          <div className="table-scroll-wrapper">
            <table className="column-table">
              {/* 테이블 헤더 */}
              <thead>
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
                    <td className="generation-method-cell">{col.generation}</td>
                    <td>
                      <Button
                        variant="gray"
                        size="sm"
                        style={{
                          whiteSpace: 'nowrap',
                          backgroundColor: 'var(--color-light-blue)',
                          color: 'var(--color-main-blue)',
                          borderRadius: '10px',
                          padding: '4px 12px'
                        }}
                      >
                        {col.setting} 🖊️
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            variant="blue"
            size="md"
            style={{ width: '100%', marginTop: '24px', padding: '12px' }}
          >
            데이터 생성
          </Button>
        </div>
      </div>
      <style>{`
        .table-detail-container{
          flex-grow: 1;
          background-color: var(--color-white);
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          width:760px;
          height: 760px;
        }
        .detail-header {
          display: flex;
          align-items: baseline;
          gap:16px;
          border-top-left-radius: 10px;
          border-top-right-radius: 10px;
          padding: 20px 24px ;
          flex-shrink: 0;
        }
        .detail-header span {
          color: var(--color-dark-gray);
        }
        .detail-content{
          display: flex;
          flex-direction: column;
          padding: 32px;
          flex-grow: 1;
          min-height: 0;
        }
        .options-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: nowrap;
          flex-shrink: 0; 
          margin-bottom: 16px; 
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-group input {
          width: 200px;
          padding: 8px 12px;
          border: 1px solid var(--color-gray-200);
          border-radius: 6px;
        }
        .table-scroll-wrapper {
          flex-grow: 1; 
          overflow-y: auto; 
          min-height: 0; 
        }
        .column-table {
          width: 100%;
          border-collapse: collapse;
          border-top: 1px solid var(--color-gray-200);
        }

        .column-table th {
          color: var(--color-dark-gray);
          background-color: #FAFAFA;
          text-align: center;
          padding: 16px 8px;
-        }
        .column-table td {
          padding: 16px;
          text-align: center;
          vertical-align: middle;
          border-bottom: 1px solid var(--color-gray-200);
        }

        .generation-method-cell {
          color: var(--color-main-blue); 
          font: var(--preBold14); 
        }
    
        .constraint-badges {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .badge {
          padding: 4px 8px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 600;

        }
        .badge-pk { background-color: #FFFBEB; color: #B45309; }
        .badge-fk { background-color: #EFF6FF; color: #1D4ED8; }
        .badge-not { background-color: #FEF2F2; color: #B91C1C; }
        .badge-unique { background-color: #F0FDF4; color: #15803D; }
        .badge-enum { background-color: #F5F3FF; color: #5B21B6; }
        .badge-check { background-color: #FEFBF1; color: #D97706; } 
        .badge-auto { background-color: #F0FDFA; color: #0F766E; } 
        .badge-default { background-color: #F3F4F6; color: #4B5563; }
        .badge-domain { background-color: #FFF7ED; color: #EA580C; } 
        
      `}</style>
    </>
  )
}

export default TableDetail
