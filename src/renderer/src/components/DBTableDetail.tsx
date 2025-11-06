import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { TableInfo, ColumnDetail } from '@renderer/views/CreateDummyView'
import Button from '@renderer/components/Button'
import FileModal from '@renderer/modals/file/FileModal'
import RuleModal, { RuleResult } from '@renderer/modals/rule/RuleModal'
import { useGenerationStore } from '@renderer/stores/generationStore'
import type { FileModalApplyPayload } from '@renderer/modals/file/types'

type DBTableDetailProps = {
  table: TableInfo
  onColumnUpdate: (columnName: string, generation: string, setting: string) => void
  onGenerateData: () => void
  isAllReady: boolean
  hasMissing?: boolean
  warningMessage?: string
}

const TableDetail: React.FC<DBTableDetailProps> = ({
  table,
  onColumnUpdate,
  onGenerateData,
  isAllReady,
  hasMissing,
  warningMessage
}) => {
  const tableGenerationConfig = useGenerationStore((state) => state.tables[table.name])
  const applyFileMapping = useGenerationStore((state) => state.applyFileMapping)

  const getTableRecordCount = useGenerationStore((s) => s.getTableRecordCount)
  const setTableRecordCount = useGenerationStore((s) => s.setTableRecordCount)
  const [rows, setRows] = useState<number>(() => getTableRecordCount(table.name))

  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false)
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<ColumnDetail | null>(null)

  useEffect(() => {
    setRows(getTableRecordCount(table.name))
  }, [table.name])

  useEffect(() => {
    if (!tableGenerationConfig) return
    setTableRecordCount(table.name, rows)
  }, [rows])

  // ----------------------------
  // File Upload Modal
  const openFileUploadModal = (): void => {
    setIsFileUploadModalOpen(true)
  }

  const closeFileUploadModal = (): void => {
    setIsFileUploadModalOpen(false)
  }

  const handleFileMappingApply = useCallback(
    (payload: FileModalApplyPayload): void => {
      applyFileMapping(table.name, payload)
      if (payload.recordCount !== undefined) {
        setRows(payload.recordCount)
      }
      closeFileUploadModal()
    },
    [applyFileMapping, table.name]
  )

  // ----------------------------
  // Rule Modal
  const handleSelectGenerationClick = (column: ColumnDetail): void => {
    setSelectedColumn(column)
    setIsRuleModalOpen(true)
  }

  const closeRuleModal = (): void => {
    setIsRuleModalOpen(false)
    setSelectedColumn(null)
  }

  const handleRuleConfirm = (result: RuleResult): void => {
    if (!selectedColumn) return

    onColumnUpdate(selectedColumn.name, result.generation, result.setting)
    closeRuleModal()
  }

  // ----------------------------
  // Input handlers

  const handleRowsChange = (value: number): void => {
    const MAX_ROWS = 50_000_000
    const normalized = Number.isFinite(value) ? Math.trunc(value) : 1
    const safeValue = Math.min(Math.max(1, normalized), MAX_ROWS)
    setRows(safeValue)
    setTableRecordCount(table.name, safeValue)
  }

  const displayColumnDetails = useMemo(() => {
    const columnConfigs = tableGenerationConfig?.columns ?? {}

    return table.columnDetails.map((col) => {
      const config = columnConfigs[col.name]
      if (!config) {
        return col
      }

      let generation = '',
        setting = ''

      switch (config.dataSource) {
        case 'FILE':
          generation = '파일 업로드'
          if (config.metaData.kind === 'file') {
            setting = config.metaData.fileColumn
          } else {
            setting = '파일 매핑'
          }
          break
        case 'FIXED':
          generation = '고정값'
          if (config.metaData.kind === 'fixed') {
            setting = config.metaData.fixedValue
          } else {
            setting = '고정값'
          }
          break
        case 'FAKER':
          generation = 'Faker.js'
          if (config.metaData.kind === 'faker') {
            setting = `Rule #${config.metaData.ruleId}`
          }
          break
        case 'AI':
          generation = 'AI'
          if (config.metaData.kind === 'ai') {
            setting = `Rule #${config.metaData.ruleId}`
          }
          break
        // TODO: 'REFERENCE' 케이스 추가
      }

      return { ...col, generation, setting }
    })
  }, [table.columnDetails, tableGenerationConfig?.columns])

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
                onChange={(e) => handleRowsChange(Number(e.target.value))}
                placeholder="e.g., 1,000"
                className="preMedium16 shadow"
                step="100"
                min={1}
                max={50000000}
              />
            </div>
            <Button
              variant="blue"
              size="sm"
              style={{ whiteSpace: 'nowrap' }}
              onClick={openFileUploadModal}
            >
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
                {displayColumnDetails.map((col) => (
                  <tr
                    key={col.name}
                    className={
                      col.generation && col.generation !== '-' ? 'has-generation-method' : ''
                    }
                  >
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
                    {/* --- 생성 방식 셀 --- */}
                    <td className="generation-method-cell preSemiBold14">
                      <button
                        className="select-generation-link"
                        onClick={() => handleSelectGenerationClick(col)}
                      >
                        {col.generation && col.generation !== '-'
                          ? col.generation
                          : '생성방식 선택'}
                      </button>
                    </td>

                    <td>
                      <Button
                        variant="gray"
                        size="sm"
                        style={{
                          whiteSpace: 'nowrap',
                          backgroundColor: 'var(--color-sky-blue)',
                          color: 'var(--color-main-blue)',
                          borderRadius: '10px',
                          padding: '4px 12px'
                        }}
                      >
                        {col.setting || '-'} 🖊️
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* 데이터 생성 버튼 위 경고문 */}
          {hasMissing && warningMessage && (
            <div className="validation-warning">{warningMessage}</div>
          )}

          <Button
            variant="blue"
            size="md"
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
            onClick={onGenerateData}
            disabled={!isAllReady}
          >
            데이터 생성
          </Button>
        </div>
      </div>
      <FileModal
        isOpen={isFileUploadModalOpen}
        onClose={closeFileUploadModal}
        tableName={table.name}
        tableColumns={table.columnDetails.map((col) => ({
          name: col.name,
          type: col.type
        }))}
        recordCount={rows}
        onApply={handleFileMappingApply}
      />
      {isRuleModalOpen && selectedColumn && (
        <RuleModal
          tableName={table.name}
          isOpen={isRuleModalOpen}
          onClose={closeRuleModal}
          column={selectedColumn}
          onConfirm={handleRuleConfirm} // [!] 핸들러 전달
        />
      )}

      {/* --- 스타일 그대로 유지 --- */}
      <style>{`
        .table-detail-container{
          flex-grow: 1;
          background-color: var(--color-white);
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          width:780px;
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
          background-color: #FAFAFA;
          text-align: center;
          padding: 16px 8px;
          font: var(--preMedium14);
        }
        .column-table td {
          padding: 16px;
          text-align: center;
          vertical-align: middle;
          border-bottom: 1px solid var(--color-gray-200);
          background-color: var(--color-white); 
          transition: background-color 0.2s ease;
        }
        .column-table tr.has-generation-method td {
          background-color: var(--color-light-blue); 
        }

        .generation-method-cell {
          color: var(--color-main-blue); 
          min-width: 116px; 
        }
        .select-generation-link {
          background: none; 
          border: none; 
          padding: 0; 
          text-decoration: underline; 
          cursor: pointer; 
          font: preRegular14; 
        }
        .select-generation-link:hover {
           color: var(--color-main-blue);
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
        .validation-warning {
          background-color: var(--color-light-yellow);
          color: var(--color-black);
          border: 1px solid var(--color-orange);
          border-radius: 8px;
          padding: 10px 12px;
          text-align: center;
          font: var(--preMedium14);
          margin-top: 16px;
          margin-bottom: 20px;
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
