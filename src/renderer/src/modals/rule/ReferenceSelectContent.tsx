import React, { useState, useMemo, useEffect } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import Button from '@renderer/components/Button'
import { useProjectStore } from '@renderer/stores/projectStore'
import { ColumnDetail } from '@renderer/views/CreateDummyView'
import { RuleResult } from './RuleModal'

type ReferenceStrategy = 'RANDOM_SAMPLE' | 'FIXED_VALUE'
type SampleState = { status: 'idle' | 'loading' | 'success' | 'error'; value: string }
type ValidationState = 'idle' | 'loading' | 'valid' | 'invalid'

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

  const databaseId = selectedProject?.database?.id

  // --- FK 참조 정보 ---
  const schemaRef = useMemo(() => column.foreignKeys?.[0], [column.foreignKeys])
  const referencedTableName = schemaRef?.referenced_table || ''
  const referencedColumnName = schemaRef?.referenced_column || ''

  const [strategy, setStrategy] = useState<ReferenceStrategy>(() => {
    if (column.generation === '고정값') {
      return 'FIXED_VALUE'
    }
    return 'RANDOM_SAMPLE'
  })

  const [searchValue, setSearchValue] = useState(() => {
    if (column.generation === '고정값') {
      return column.setting || ''
    }
    return ''
  })

  const [validationState, setValidationState] = useState<ValidationState>(() => {
    if (column.generation === '고정값' && column.setting) {
      return 'valid'
    }
    return 'idle'
  })

  const [samplePreview, setSamplePreview] = useState<SampleState>(() => {
    if (column.generation === '참조' && column.previewValue) {
      return { status: 'success', value: String(column.previewValue) }
    }
    return { status: 'idle', value: '' }
  })

  // 무작위 샘플링 
  useEffect(() => {
    if (strategy === 'RANDOM_SAMPLE' && databaseId) {
      if (column.generation === '참조' && column.previewValue) {
        return
      }

      setSamplePreview({ status: 'loading', value: '' })
      window.api.schema
        .getRandomSample({
          databaseId,
          table: referencedTableName,
          column: referencedColumnName
        })
        .then((result) => {
          setSamplePreview({ status: 'success', value: String(result.sample) })
        })
        .catch((err) => {
          console.error(err)
          setSamplePreview({ status: 'error', value: '샘플 로딩 실패' })
        })
    }

  }, [strategy, referencedTableName, referencedColumnName, databaseId, column.generation, column.previewValue])

  //  고정값 검증 
  const handleValidateValue = () => {
    if (!searchValue.trim()) {
      alert('검색할 값을 입력하세요.')
      return
    }
    if (!databaseId) {
      alert('데이터베이스 연결을 찾을 수 없습니다.')
      return
    }

    setValidationState('loading')

    window.api.schema
      .validateFkValue({
        databaseId,
        table: referencedTableName,
        column: referencedColumnName,
        value: searchValue
      })
      .then((result) => {
        setValidationState(result.isValid ? 'valid' : 'invalid')
      })
      .catch((err) => {
        console.error(err)
        setValidationState('invalid') // DB 에러 발생 시 'invalid'로 처리
      })
  }

  // 검색창 값이 바뀔 때마다 검증 상태 초기화
  useEffect(() => {
    setValidationState('idle')
  }, [searchValue])

  // 저장 로직
  const handleSave = (): void => {
    if (strategy === 'RANDOM_SAMPLE') {

      if (samplePreview.status === 'error') {
        alert('샘플 로딩에 실패했지만, "무작위 샘플링" 규칙은 저장됩니다.')
      }
      onConfirm({
        generation: '참조',
        setting: `${referencedTableName}.${referencedColumnName}`,
        previewValue: samplePreview.value
      } as RuleResult)

    } else {

      if (validationState !== 'valid') {
        alert('유효한 값을 입력하고 "검증하기"를 완료해야 합니다.')
        return
      }
      onConfirm({
        generation: '고정값',
        setting: searchValue
      })
    }
  }

  // --- 에러 상태 UI ---
  if (!schemaRef || !referencedTableName) {
    return (
      <div className="ref-select">
        <PageTitle
          title={`참조 설정 - ${column.name}`}
          description="이 컬럼에 대한 유효한 외래 키 참조 정보를 찾을 수 없습니다."
          size="small"
        />
        <div className="divider" />
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

  // --- 메인 UI ---
  return (
    <div className="ref-select">
      <PageTitle
        title={`참조 설정 - ${column.name}`}
        description="참조 컬럼에서 값을 가져올 방식을 선택하세요."
        size="small"
      />
      <div className="divider" />
      <div className="ref-select__content">
        {/* ---  참조 정보 (고정) --- */}
        <div className="select-group">
          <label className="preSemiBold14">참조 테이블</label>
          <input
            type="text"
            value={referencedTableName}
            disabled
            className="custom-select"
            style={{ backgroundColor: 'var(--color-white)', cursor: 'not-allowed' }}
          />
        </div>
        <div className="select-group">
          <label className="preSemiBold14">참조 컬럼</label>
          <input
            type="text"
            value={referencedColumnName}
            disabled
            className="custom-select"
            style={{ backgroundColor: 'var(--color-white)', cursor: 'not-allowed' }}
          />
        </div>

        {/* ---  생성 방식 선택 (라디오) --- */}
        <div className="select-group">
          <label className="preSemiBold14">생성 방식</label>
          <div className="radio-group">
            {/* 옵션 1: 무작위 */}
            <label className={`radio-option ${strategy === 'RANDOM_SAMPLE' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="ref-strategy"
                value="RANDOM_SAMPLE"
                checked={strategy === 'RANDOM_SAMPLE'}
                onChange={() => setStrategy('RANDOM_SAMPLE')}
              />
              <div className="radio-label">
                <span className="preSemiBold16">무작위 샘플링 (권장)</span>
                <span className="preRegular14">{referencedTableName} 테이블의 값 중 무작위 선택</span>
              </div>
            </label>
            {/* 옵션 2: 고정값 */}
            <label className={`radio-option ${strategy === 'FIXED_VALUE' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="ref-strategy"
                value="FIXED_VALUE"
                checked={strategy === 'FIXED_VALUE'}
                onChange={() => setStrategy('FIXED_VALUE')}
              />
              <div className="radio-label">
                <span className="preSemiBold16">고정값 검색/지정</span>
                <span className="preRegular14">참조할 특정 값을 검색하여 지정</span>
              </div>
            </label>
          </div>
        </div>

        {/* ---  무작위 샘플링 선택 시: 미리보기 UI --- */}
        {strategy === 'RANDOM_SAMPLE' && (
          <div className="select-group">
            <label className="preSemiBold14">미리보기 (실제 값)</label>
            <div className="preview-box">
              {samplePreview.status === 'loading' && <span>샘플 값 로딩 중... ⏳</span>}
              {samplePreview.status === 'success' && (
                <span className="sample-value">{samplePreview.value}</span>
              )}
              {samplePreview.status === 'error' && (
                <span className="invalid">⚠️ {samplePreview.value}</span>
              )}
            </div>
          </div>
        )}

        {/* ---  고정값 선택 시: 검색 UI --- */}
        {strategy === 'FIXED_VALUE' && (
          <div className="select-group">
            <label className="preSemiBold14">참조값 검색</label>
            <div className="search-group">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="custom-select"
                placeholder="예: 10, 'abc' (정확히 일치)"
              />
              <Button
                variant="blue"
                onClick={handleValidateValue}
                disabled={validationState === 'loading' || !searchValue.trim()}
                style={{ flexShrink: 0 }}
              >
                {validationState === 'loading' ? '검증 중...' : '검증하기'}
              </Button>
            </div>
            {/* 검증 상태 메시지 */}
            <div className="validation-message">
              {validationState === 'valid' && <span className="valid"> 유효한 값입니다.</span>}
              {validationState === 'invalid' && (
                <span className="invalid">
                  ❌ '{searchValue}'는 {referencedTableName} 테이블에 없습니다.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- 하단 버튼 --- */}
      <div className="footer">
        <Button variant="gray" onClick={onCancel}>
          취소
        </Button>
        <Button
          variant="blue"
          onClick={handleSave}
          disabled={
            // 고정값 모드일 땐 'valid' 상태여야만 저장 활성화
            (strategy === 'FIXED_VALUE' && validationState !== 'valid') ||
            // 무작위 모드일 땐 '로딩 중'일 때 저장 비활성화
            (strategy === 'RANDOM_SAMPLE' && samplePreview.status === 'loading')
          }
        >
          저장
        </Button>
      </div>

      {/* --- 스타일 --- */}
      <style>{`
        .ref-select {
          display: flex;
          flex-direction: column;
          gap: 25px;
          padding: 0 14px 14px 0;
        }
        .divider {
          border: none;
          border-top: 1px solid var(--color-gray-200);
          margin-top: 12px;
        }
        .ref-select__content {
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow: visible;
        }
        .select-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .select-group label {
          font: var(--preSemiBold14);
          color: var(--color-black);
        }
        .custom-select {
          width: 100%;
          height: 42px;
          border: 1px solid var(--color-gray-200);
          border-radius: 10px;
          padding: 0 16px;
          font: var(--preRegular16);
          outline: none;
          background-color: var(--color-white);
          color: var(--color-black);
          box-sizing: border-box;
        }
        .custom-select:disabled {
          background-color: var(--color-background);
          color: var(--color-gray-500);
          cursor: not-allowed;
        }
        .custom-select:focus {
          border-color: var(--color-main-blue);
          box-shadow: 0 0 0 2px rgba(19, 70, 134, 0.2);
        }

        /* --- 라디오 버튼 스타일 --- */
        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .radio-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border: 1.5px solid var(--color-gray-200);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .radio-option:hover {
          border-color: var(--color-main-blue);
        }
        .radio-option.selected {
          border-color: var(--color-main-blue);
          background-color: var(--color-light-blue);
          box-shadow: 0 0 0 2px rgba(19, 70, 134, 0.2);
        }
        .radio-option input[type='radio'] {
          appearance: none;
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border: 1.5px solid var(--color-gray-400);
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        .radio-option input[type='radio']:checked {
          background-color: var(--color-main-blue);
          border-color: var(--color-main-blue);
          background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white"%3e%3ccircle cx="8" cy="8" r="4" /%3e%3c/svg%3e');
          background-position: center;
          background-repeat: no-repeat;
        }
        .radio-label {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .radio-label .preRegular14 {
          color: var(--color-dark-gray);
        }
        
        /* --- 샘플 미리보기 박스 --- */
        .preview-box {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 60px;
          background-color: var(--color-background);
          border-radius: 10px;
          font: var(--preRegular16);
          color: var(--color-dark-gray);
        }
        .sample-value {
          font: var(--preBold24);
          color: var(--color-main-blue);
        }

        /* --- 검색 그룹 --- */
        .search-group {
          display: flex;
          gap: 8px;
        }
        
        /* --- 검증 메시지 --- */
        .validation-message {
          height: 20px;
          font: var(--preRegular14);
          padding-left: 4px;
        }
        .validation-message .valid {
          color: #059669; /* (임시) */
        }
        .validation-message .invalid {
          color: #DC2626; /* (임시) */
        }
        
        .footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  )
}

export default ReferenceSelectContent