import React, { useEffect, useMemo, useState } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import Table from '@renderer/components/Table'
import type { Column, Row } from '@renderer/components/Table'
import Checkbox from '@renderer/components/Checkbox'
import Button from '@renderer/components/Button'
import Toast from '@renderer/components/Toast'
import type { FileType } from './FileUploadContent'
import type { ParseOptions, ParsedFileResult } from './types'

interface FilePreviewContentProps {
  tableName: string
  file: File
  fileType: FileType
  parseOptions: ParseOptions
  parseResult: ParsedFileResult | null
  onChangeOptions: (options: Partial<ParseOptions>) => void
  onBack: () => void
  onNext: () => void
}

const FilePreviewContent: React.FC<FilePreviewContentProps> = ({
  tableName,
  file,
  fileType,
  parseOptions,
  parseResult,
  onChangeOptions,
  onBack,
  onNext
}) => {
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const columns: Column[] = parseResult?.columns ?? []
  const rows: Row[] = parseResult?.rows ?? []
  const totalRows = parseResult?.totalRows ?? 0
  const hasError = Boolean(parseResult?.error)
  const isTruncated = Boolean(parseResult?.truncated)

  useEffect(() => {
    if (parseResult?.error) {
      setToastMessage(parseResult.error)
      setShowToast(true)
    }
  }, [parseResult?.error])

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [showToast])

  const fileExt = useMemo(() => fileType.toUpperCase(), [fileType])

  const handleHeaderToggle = (): void => {
    onChangeOptions({ useHeaderRow: !parseOptions.useHeaderRow })
  }

  const footerText = useMemo(() => {
    if (hasError) return ''
    if (totalRows <= 0) return '행 수 정보를 확인할 수 없습니다.'
    if (isTruncated) {
      return `총 ${totalRows.toLocaleString()}행 중 일부만 미리보기로 표시합니다.`
    }
    return `총 ${totalRows.toLocaleString()}행`
  }, [hasError, isTruncated, totalRows])

  return (
    <div className="file-content">
      <PageTitle
        title={`파일 미리보기 - ${tableName}`}
        description={`${fileExt} 파일의 데이터 구성을 확인하세요.`}
        size="small"
      />

      <hr className="divider" />

      <div className="section-title preSemiBold20">
        파일 정보 <span className="required">*</span>
      </div>

      <div className="file-info preRegular16">
        <p>
          <strong>파일 이름 :</strong> {file.name}
        </p>
        <p>
          <strong>Encoding :</strong> UTF-8
        </p>
        <p>
          <strong>데이터 행 수 :</strong> {totalRows > 0 ? totalRows.toLocaleString() : '미확인'}
        </p>
        <p>
          <strong>파일 크기 :</strong> {(file.size / (1024 * 1024)).toFixed(2)} MB
        </p>
      </div>

      {fileType === 'txt' && (
        <div className="inline-inputs">
          <div className="inline-input">
            <span className="input-label">행 구분자</span>
            <input
              className="plain-input"
              type="text"
              value={parseOptions.lineSeparator}
              onChange={(e) => onChangeOptions({ lineSeparator: e.target.value })}
            />
          </div>
          <div className="inline-input">
            <span className="input-label">열 구분자</span>
            <input
              className="plain-input"
              type="text"
              value={parseOptions.columnSeparator}
              onChange={(e) => onChangeOptions({ columnSeparator: e.target.value })}
            />
          </div>
        </div>
      )}

      {hasError ? (
        <p style={{ color: 'red', marginTop: '16px' }}>{parseResult?.error}</p>
      ) : (
        <Table columns={columns} rows={rows} showFooter footerText={footerText} maxHeight="360px" />
      )}

      {(fileType === 'csv' || fileType === 'txt') && (
        <div className="option-row">
          <Checkbox checked={parseOptions.useHeaderRow} onChange={handleHeaderToggle} />
          <span className="preRegular14">첫 행을 컬럼 제목으로 사용</span>
        </div>
      )}

      <div className="actions">
        <Button variant="gray" onClick={onBack}>
          이전
        </Button>
        <Button variant="orange" onClick={onNext} disabled={hasError || columns.length === 0}>
          다음
        </Button>
      </div>

      {showToast && (
        <Toast type="warning" title="파일 오류">
          {toastMessage}
        </Toast>
      )}

      <style>{`
        .file-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 640px;
          padding: 28px 32px;
        }

        .divider {
          width: 100%;
          border: none;
          border-top: 1px solid var(--color-dark-gray);
          margin: 8px 0 16px;
        }

        .section-title {
          margin-top: 16px;
          margin-bottom: 10px;
          color: var(--color-black);
        }

        .required {
          color: #ed3f27;
          margin-left: 4px;
        }

        .file-info {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          width: 100%;
          color: var(--color-dark-gray);
          margin-bottom: 12px;
          gap: 8px;
        }

        .inline-inputs {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 48px;
          width: 100%;
          margin-bottom: 12px;
        }

        .inline-input {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .input-label {
          font: var(--preRegular16);
          color: var(--color-black);
        }

        .plain-input {
          width: 140px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid #c9d8eb;
          padding: 0 10px;
          font-family: var(--font-family);
          color: var(--color-black);
          box-shadow: var(--shadow);
        }

        .option-row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          width: 100%;
          gap: 8px;
          margin-top: 10px;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          width: 100%;
          gap: 12px;
          margin-top: 24px;
        }
      `}</style>
    </div>
  )
}

export default FilePreviewContent
