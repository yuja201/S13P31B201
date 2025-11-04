// @renderer/modals/rule/ReferenceSelectContent.tsx

import React, { useState, useMemo } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import Button from '@renderer/components/Button'
import { useSchemaStore } from '@renderer/stores/schemaStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import { ColumnDetail } from '@renderer/views/CreateDummyView'
import { RuleResult } from '@renderer/modals/rule/RuleModal'
// ❗️ Table 타입을 스토어에서 가져와야 합니다. (경로 확인 필요)
import type { Table } from '@main/database/types'

interface ReferenceSelectContentProps {
  column: ColumnDetail
  onCancel: () => void
  onConfirm: (result: RuleResult) => void
}

const ReferenceSelectContent: React.FC<ReferenceSelectContentProps> = ({
  column,
  onCancel,
  onConfirm
}) => {
  const { selectedProject } = useProjectStore()
  const { getSchema } = useSchemaStore()

  const schemaRef = useMemo(() => column.foreignKeys?.[0], [column.foreignKeys])

  const referencedTableName = schemaRef?.referenced_table || ''

  const referencedTableInfo: Table | undefined = useMemo(() => {
    const dbId = selectedProject?.database?.id
    if (!dbId || !referencedTableName) return undefined

    const allTables = getSchema(dbId)?.tables || []
    return allTables.find((t) => t.name === referencedTableName)
  }, [selectedProject, getSchema, referencedTableName])

  const targetColumns = useMemo(() => {
    return referencedTableInfo?.columns.map((c) => c.name) || []
  }, [referencedTableInfo])

  const [selectedColumn, setSelectedColumn] = useState(schemaRef?.referenced_column || '')

  const handleSave = (): void => {
    if (!referencedTableName || !selectedColumn) {
      alert('참조 컬럼을 선택하세요.')
      return
    }

    const settingString = `${referencedTableName}.${selectedColumn}`
    onConfirm({
      generation: '참조',
      setting: settingString
    })
  }

  if (!schemaRef || !referencedTableInfo) {
    return (
      <div className="ref-select" style={{ padding: '20px' }}>
        <PageTitle
          title={`참조 설정 - ${column.name}`}
          description="이 컬럼에 대한 유효한 외래 키 참조 정보를 찾을 수 없습니다."
          size="small"
        />
        <hr className="divider" />
        <p style={{ margin: '20px 0', color: 'red' }}>
          스키마에서 {column.name} 컬럼의 FK 제약 조건을 찾지 못했습니다.
        </p>
        <div className="footer">
          <Button variant="gray" onClick={onCancel}>
            닫기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="ref-select">
      <PageTitle
        title={`참조 설정 - ${column.name}`}
        description="이 컬럼이 값을 가져올 외부 테이블과 컬럼을 선택하세요."
        size="small"
      />
      <hr className="divider" />

      {/* --- 1. 참조 테이블 (고정된 텍스트) --- */}
      <div className="select-group">
        <label className="preSemiBold14">참조 테이블 (고정됨)</label>
        <input
          type="text"
          value={referencedTableName}
          disabled
          className="custom-select"
          style={{ backgroundColor: '#f4f4f4', cursor: 'not-allowed' }}
        />
      </div>

      {/* --- 2. 참조 컬럼 (선택 가능) --- */}
      <div className="select-group">
        <label className="preSemiBold14">참조 컬럼</label>
        <select
          value={selectedColumn}
          onChange={(e) => setSelectedColumn(e.target.value)}
          className="custom-select"
        >
          <option value="" disabled>
            --- 컬럼 선택 ---
          </option>
          {targetColumns.map((colName) => (
            <option key={colName} value={colName}>
              {colName}
            </option>
          ))}
        </select>
      </div>

      <div className="footer">
        <Button variant="gray" onClick={onCancel}>
          취소
        </Button>
        <Button variant="blue" onClick={handleSave} disabled={!selectedColumn}>
          저장
        </Button>
      </div>
    </div>
  )
}

export default ReferenceSelectContent
