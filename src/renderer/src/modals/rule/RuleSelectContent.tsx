import React, { useState, useEffect } from 'react'
import Button from '@renderer/components/Button'
import InputField from '@renderer/components/InputField'
import PageTitle from '@renderer/components/PageTitle'
import Label from '@renderer/components/Label'
import { Rule } from '@main/database/types'
import { FileType } from '@renderer/modals/file/FileUploadContent'
import { mapColumnToLogicalType } from '@renderer/utils/logicalTypeMap'
import { useProjectStore } from '@renderer/stores/projectStore'
import { ColumnDetail } from '@renderer/views/CreateDummyView'

export interface RuleCreationData {
  source: 'Faker' | 'AI'
  settingName: string
  apiToken?: string
  prompt?: string
  model?: string
  columnName?: string
  columnType?: string
}

export interface RuleSelection {
  columnName: string
  dataSource: 'FAKER' | 'AI' | 'FILE' | 'FIXED' | 'ENUM' | 'REFERENCE'
  metaData: {
    ruleId?: number
    ruleName?: string
    domainId?: number
    domainName?: string
    filePath?: string
    columnIdx?: number
    fixedValue?: string
    fileType?: FileType
    useHeaderRow?: boolean
    refTable?: string
    refColumn?: string
    previewValue?: string
    ensureUnique?: boolean
  }
}

interface RuleSelectContentProps {
  column: ColumnDetail
  columnName: string
  columnType: string
  onCancel: () => void
  onConfirm: (selection: RuleSelection) => void
  onCreateNew?: () => void
}

const RuleSelectContent: React.FC<RuleSelectContentProps> = ({
  column,
  columnName,
  columnType,
  onCancel,
  onConfirm,
  onCreateNew
}) => {
  const [fixedValue, setFixedValue] = useState('')
  const [rules, setRules] = useState<Rule[]>([])
  const { selectedProject } = useProjectStore()
  const dbms = selectedProject?.dbms?.name ?? 'mysql'

  const handleSelectRule = (rule: Rule): void => {
    // 선택한 rule을 부모로 전달
    onConfirm({
      columnName,
      dataSource: rule.data_source as 'FAKER' | 'AI' | 'FILE' | 'FIXED',
      metaData: {
        ruleId: rule.id,
        ruleName: rule.name,
        domainId: rule.domain_id,
        domainName: rule.domain_name
      }
    })
  }

  useEffect(() => {
    const fetchRules = async (): Promise<void> => {
      try {
        const logicalType = mapColumnToLogicalType(dbms, columnType)
        const data = await window.api.rule.getByLogicalType(logicalType)
        setRules(data)
      } catch (err) {
        console.error('규칙 불러오기 실패:', err)
      }
    }
    if (columnType) fetchRules()
  }, [columnType, dbms])

  const handleConfirmFixed = (): void => {
    const trimmedValue = fixedValue.trim()

    // NOT NULL 검증
    if (!trimmedValue) {
      if (column.constraints.includes('NOT NULL')) {
        alert(`'${column.name}' 컬럼은 NOT NULL 제약이 있습니다. 값을 입력해주세요.`)
        return
      }
      onConfirm({ columnName, dataSource: 'FIXED', metaData: { fixedValue: '' } })
      return
    }
    if (column.constraints.includes('NOT NULL') && trimmedValue.toUpperCase() === 'NULL') {
      alert(`'${column.name}' 컬럼은 NOT NULL 제약이 있습니다. 'NULL' 값을 입력할 수 없습니다.`)
      return
    }

    // CHECK 제약 조건 검증 (간단한 숫자 비교만 처리)
    if (column.checkConstraint) {
      const num = Number(trimmedValue)
      if (!Number.isNaN(num)) {
        const checkMatch = column.checkConstraint.match(/(>|>=|<|<=)\s*(\d+)/)
        if (checkMatch) {
          const [, operator, valueStr] = checkMatch
          const checkValue = Number(valueStr)
          let isValid = true
          if (operator === '>' && !(num > checkValue)) isValid = false
          if (operator === '>=' && !(num >= checkValue)) isValid = false
          if (operator === '<' && !(num < checkValue)) isValid = false
          if (operator === '<=' && !(num <= checkValue)) isValid = false

          if (!isValid) {
            alert(
              `입력한 값 '${num}'이(가) CHECK 제약 조건 '${column.checkConstraint}'을(를) 위반합니다.`
            )
            return
          }
        }
      }
    }

    // Fixed value를 부모로 전달
    onConfirm({
      columnName,
      dataSource: 'FIXED',
      metaData: { fixedValue }
    })
  }
  return (
    <div className="rule-select">
      {/* 상단 타입 표시 */}
      <div className="rule-select__type">{columnType.toUpperCase()}</div>

      {/* 제목 */}
      <div className="rule-select__header">
        <PageTitle
          title={`생성 규칙 선택 - ${columnName}`}
          description="고정값을 입력하거나 생성한 규칙을 적용해보세요."
          size="small"
        />
        {column.checkConstraint && (
          <div className="check-constraint-notice">
            ※ 참고: 이 컬럼에는 <span>{column.checkConstraint}</span> 제약 조건이 있습니다.
          </div>
        )}
        <br />
        <hr className="rule-select__divider" />
      </div>

      {/* 고정값 입력 */}
      <div className="rule-select__section">
        <InputField
          title="고정값 입력"
          placeholder="예: 홍길동, 20, 0.0, TRUE"
          width="100%"
          titleBold
          size="md"
          value={fixedValue}
          onChange={setFixedValue}
        />
      </div>

      {/* 이전 설정 */}
      <div className="rule-select__section">
        <div className="rule-select__section-header">
          <span className="rule-select__section-title">이전 설정</span>
          <Button variant="blue" onClick={onCreateNew}>
            + 새로 만들기
          </Button>
        </div>

        <div className="rule-select__rules">
          {rules.length === 0 ? (
            <span className="rule-select__rule-desc">저장된 규칙이 없습니다.</span>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="rule-select__rule"
                onClick={() => handleSelectRule(rule)}
              >
                <div className="rule-select__rule-top">
                  <span className="rule-select__rule-title">{rule.name}</span>
                  <Label text={rule.data_source === 'FAKER' ? 'Faker.js' : 'AI'} />
                </div>
                <span className="rule-select__rule-desc">{rule.domain_name ?? '—'}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="rule-select__footer">
        <Button variant="gray" onClick={onCancel}>
          취소
        </Button>
        <Button variant="orange" onClick={handleConfirmFixed}>
          확인
        </Button>
      </div>

      <style>{`
        .rule-select {
          display: flex;
          flex-direction: column;
          gap: 25px;
          padding: 0 14px 14px 0;
        }

        .rule-select__type {
          font-family: var(--font-family);
          font-size: 20px;
          font-weight: var(--fw-regular);
          color: var(--color-black);
        }

        .rule-select__header {
          margin-bottom: 4px;
        }

        .check-constraint-notice {
           background-color: var(--color-light-yellow);
           border: 1px solid var(--color-orange);
           border-radius: 8px;
           padding: 10px 12px;
           font: var(--preRegular14);
           color: var(--color-dark-gray);
           margin-top: 16px;
        }
        .check-constraint-notice span {
          font-weight: var(--fw-semiBold);
          color: var(--color-black);
        }

        .rule-select__divider {
          border: none;
          border-top: 1px solid rgba(0, 0, 0, 0.15);
          margin-top: 12px;
        }

        .rule-select__section {
          display: flex;
          flex-direction: column;
          margin-top: 10px;
          gap: 15px;
        }

        .rule-select__section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .rule-select__section-title {
          font-family: var(--font-family);
          font-weight: var(--fw-semiBold);
          font-size: 16px;
          color: var(--color-black);
        }

        .rule-select__rules {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .rule-select__rule {
          background-color: var(--color-white);
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 10px;
          padding: 22px 20px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          transition: all 0.2s ease-in-out;
        }

        .rule-select__rule:hover {
          background-color: rgba(230, 240, 255, 0.5);
        }

        .rule-select__rule-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .rule-select__rule-title {
          font-family: var(--font-family);
          font-weight: var(--fw-medium);
          font-size: 16px;
          color: var(--color-black);
        }

        .rule-select__rule-desc {
          font-family: var(--font-family);
          font-weight: var(--fw-regular);
          font-size: 14px;
          color: var(--color-dark-gray);
          line-height: 1.5;
          white-space: pre-line;
        }

        .rule-select__footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  )
}

export default RuleSelectContent
