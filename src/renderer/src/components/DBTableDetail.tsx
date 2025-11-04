import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TableInfo, ColumnDetail } from '@renderer/views/CreateDummyView'
import Button from '@renderer/components/Button'
import FileModal from '@renderer/modals/file/FileModal'
import RuleModal, { RuleResult } from '@renderer/modals/rule/RuleModal'
import { useGenerationStore } from '@renderer/stores/generationStore'
import type { FileModalApplyPayload } from '@renderer/modals/file/types'

type DBTableDetailProps = {
  table: TableInfo
  onColumnUpdate: (columnName: string, generation: string, setting: string) => void
}

const TableDetail: React.FC<DBTableDetailProps> = ({ table }) => {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()

  // ✅ Zustand (새 구조)
  const tableGenerationConfig = useGenerationStore((state) => state.tables[table.name])
  const setTableRecordCount = useGenerationStore((state) => state.setTableRecordCount)
  const applyFileMapping = useGenerationStore((state) => state.applyFileMapping)
  const setColumnRule = useGenerationStore((state) => state.setColumnRule)

  // ✅ Local state
  const [rows, setRows] = useState(1000)
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false)
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<ColumnDetail | null>(null)

  // ✅ store -> rows 동기화
  useEffect(() => {
    if (
      tableGenerationConfig?.recordCnt !== undefined &&
      tableGenerationConfig.recordCnt !== rows
    ) {
      setRows(tableGenerationConfig.recordCnt)
    }
  }, [tableGenerationConfig?.recordCnt, rows])

  useEffect(() => {
    setTableRecordCount(table.name, rows)
  }, [rows, setTableRecordCount, table.name])

  // ✅ FileModal 핸들러
  const openFileUploadModal = (): void => setIsFileUploadModalOpen(true)
  const closeFileUploadModal = (): void => setIsFileUploadModalOpen(false)

  const handleFileMappingApply = useCallback(
    (payload: FileModalApplyPayload) => {
      applyFileMapping(table.name, payload)
      if (payload.recordCount !== undefined) {
        setRows(payload.recordCount)
      }
      closeFileUploadModal()
    },
    [applyFileMapping, table.name]
  )

  // ✅ RuleModal 핸들러
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
    setColumnRule(table.name, selectedColumn.name, result)
    closeRuleModal()
  }

  // ✅ 생성할 데이터 개수 변경
  const handleRowsChange = (value: number): void => {
    setRows(value)
  }

  // ✅ 컬럼 설정 표시
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
        case 'MANUAL':
          generation = '고정값'
          if (config.metaData.kind === 'manual') {
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
      }

      return { ...col, generation, setting }
    })
  }, [table.columnDetails, tableGenerationConfig?.columns])

  // ✅ 데이터 생성 버튼
  const handleGenerateData = (): void => {
    navigate(`/main/select-method/${projectId}/${table.id}`)
  }

  return (
    <>
      <div className="table-detail-container shadow">
        <div className="detail-header shadow">
          <h2 className="preBold24">{table.name}</h2>
          <span className="preRegular14">
            {table.columns} columns · {table.rows} row
          </span>
        </div>

        <div className="detail-content ">
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
              />
            </div>
            <Button variant="blue" size="sm" onClick={openFileUploadModal}>
              파일로 추가
            </Button>
          </div>

          {/* --- 컬럼 설정 테이블 --- */}
          <div className="table-scroll-wrapper">
            <table className="column-table">
              <thead>
                <tr>
                  <th>컬럼명</th>
                  <th>타입</th>
                  <th>제약조건</th>
                  <th>생성 방식</th>
                  <th>설정</th>
                </tr>
              </thead>
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
                    <td className="generation-method-cell preSemiBold14">
                      <button
                        className="select-generation-link"
                        onClick={() => handleSelectGenerationClick(col)}
                      >
                        {col.generation || '생성방식 선택'}
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

          <Button
            variant="blue"
            size="md"
            style={{ width: '100%', marginTop: '24px', padding: '12px' }}
            onClick={handleGenerateData}
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
          onConfirm={handleRuleConfirm}
        />
      )}
    </>
  )
}

export default TableDetail
