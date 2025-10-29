import React, { useState, useEffect, useCallback } from 'react'
import PageTitle from '@renderer/components/PageTitle'
import Table, { Column, Row } from '@renderer/components/Table'
import Checkbox from '@renderer/components/Checkbox'
import Button from '@renderer/components/Button'
import Toast from '@renderer/components/Toast'

interface FilePreviewContentProps {
  tableName: string
  file: File
  columns: Column[]
  rows: Row[]
  onBack: () => void
  onNext: () => void
}

const FilePreviewContent: React.FC<FilePreviewContentProps> = ({
  tableName,
  file,
  onBack,
  onNext
}) => {
  const [columns, setColumns] = useState<Column[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string>('')
  const [useHeaderAsTitle, setUseHeaderAsTitle] = useState(true)
  const [lineSeparator, setLineSeparator] = useState('\\n')
  const [columnSeparator, setColumnSeparator] = useState('\\t')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const fileExt = file.name.split('.').pop()?.toLowerCase()

  /** Toast 표시 */
  const showError = useCallback((msg: string): void => {
    setToastMessage(msg)
    setShowToast(true)
  }, [])

  /** CSV 파싱 */
  const parseCSV = useCallback(
    (text: string): void => {
      const lines = text.trim().split('\n')
      if (!lines.length) return

      let headers: string[]
      let dataLines: string[]

      if (useHeaderAsTitle) {
        headers = lines[0].split(',').map((h) => h.trim())
        dataLines = lines.slice(1)
      } else {
        const count = lines[0].split(',').length
        headers = Array.from({ length: count }, (_, i) => `col${i + 1}`)
        dataLines = lines
      }

      const parsedRows = dataLines.map((line, idx) => {
        const values = line.split(',')
        const row: Row = { id: idx + 1 }
        headers.forEach((h, i) => (row[h] = values[i] ?? ''))
        return row
      })

      setColumns(headers.map((h) => ({ key: h, title: h, type: 'text' })))
      setRows(parsedRows)
      setError('')
    },
    [useHeaderAsTitle]
  )

  /** JSON 파싱 */
  const parseJSON = useCallback(
    (text: string): void => {
      try {
        const data = JSON.parse(text)
        if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== 'object') {
          throw new Error()
        }
        const keys = Object.keys(data[0])
        const parsedRows: Row[] = data.map((item, idx) => ({ id: idx + 1, ...item }))
        setColumns(keys.map((k) => ({ key: k, title: k, type: 'text' })))
        setRows(parsedRows)
        setError('')
      } catch {
        showError('유효하지 않은 JSON 형식입니다.')
        setColumns([])
        setRows([])
      }
    },
    [showError]
  )

  /** TXT 파싱 */
  const parseTXT = useCallback(
    (text: string): void => {
      const lineSep = lineSeparator === '\\n' ? '\n' : lineSeparator
      const colSep = columnSeparator === '\\t' ? '\t' : columnSeparator
      const lines = text.trim().split(lineSep)

      if (!lines.length) return

      let headers: string[]
      let dataLines: string[]

      if (useHeaderAsTitle) {
        headers = lines[0].split(colSep).map((h) => (h.trim() ? h.trim() : ''))
        headers = headers.map((h, i) => (h ? h : `col${i + 1}`))
        dataLines = lines.slice(1)
      } else {
        const firstCount = lines[0].split(colSep).length
        headers = Array.from({ length: firstCount }, (_, i) => `col${i + 1}`)
        dataLines = lines
      }

      const parsedRows: Row[] = dataLines.map((line, idx) => {
        const values = line.split(colSep)
        const row: Row = { id: idx + 1 }
        headers.forEach((h, i) => (row[h] = values[i] ?? ''))
        return row
      })

      setColumns(headers.map((h) => ({ key: h, title: h, type: 'text' })))
      setRows(parsedRows)
      setError('')
    },
    [lineSeparator, columnSeparator, useHeaderAsTitle]
  )

  useEffect(() => {
    const parseFile = async (): Promise<void> => {
      try {
        const text = await file.text()
        if (!text.trim()) {
          showError('파일이 비어 있습니다.')
          setColumns([])
          setRows([])
          return
        }

        if (fileExt === 'csv') parseCSV(text)
        else if (fileExt === 'json') parseJSON(text)
        else if (fileExt === 'txt') parseTXT(text)
        else {
          showError('지원하지 않는 파일 형식입니다.')
          setColumns([])
          setRows([])
        }
      } catch (e) {
        console.error('파일 파싱 오류:', e)
        showError('파일을 읽는 중 오류가 발생했습니다.')
      }
    }

    parseFile()
  }, [file, fileExt, parseCSV, parseJSON, parseTXT, showError])

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [showToast])

  return (
    <div className="file-content">
      <PageTitle
        title={`데이터 미리보기 - ${tableName}`}
        description={`${fileExt?.toUpperCase()} 파일의 내용을 확인합니다.`}
        size="small"
      />

      <hr className="divider" />

      {/* 섹션 제목 */}
      <div className="section-title preSemiBold20">
        파일 내용 <span className="required">*</span>
      </div>

      {/* 파일 정보 */}
      <div className="file-info preRegular16">
        <p>
          <strong>파일 이름 :</strong> {file.name}
        </p>
        <p>
          <strong>encoding 방식 :</strong> UTF-8
        </p>
        <p>
          <strong>레코드 수 :</strong> {rows.length.toLocaleString()}건
        </p>
      </div>

      {fileExt === 'txt' && (
        <div className="inline-inputs">
          <div className="inline-input">
            <span className="input-label">행 구분자</span>
            <input
              className="plain-input"
              type="text"
              value={lineSeparator}
              onChange={(e) => setLineSeparator(e.target.value)}
            />
          </div>
          <div className="inline-input">
            <span className="input-label">열 구분자</span>
            <input
              className="plain-input"
              type="text"
              value={columnSeparator}
              onChange={(e) => setColumnSeparator(e.target.value)}
            />
          </div>
        </div>
      )}

      {error ? (
        <p style={{ color: 'red', marginTop: '16px' }}>{error}</p>
      ) : (
        <Table
          columns={columns}
          rows={rows.slice(0, 5)}
          showFooter
          footerText={rows.length > 5 ? `외 ${rows.length - 5}개의 행` : `총 ${rows.length}건`}
          maxHeight="360px"
        />
      )}

      {(fileExt === 'csv' || fileExt === 'txt') && (
        <div className="option-row">
          <Checkbox
            checked={useHeaderAsTitle}
            onChange={() => setUseHeaderAsTitle((prev) => !prev)}
          />
          <span className="preRegular14">첫 행을 컬럼 제목으로 사용</span>
        </div>
      )}

      <div className="actions">
        <Button variant="gray" onClick={onBack}>
          이전
        </Button>
        <Button variant="orange" onClick={onNext}>
          다음
        </Button>
      </div>

      {showToast && (
        <Toast type="warning" title="알림">
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

                .file-info {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                width: 100%;
                color: var(--color-dark-gray);
                margin-bottom: 12px;
                }

                .section-title {
                margin-top: 16px;
                margin-bottom: 10px;
                color: var(--color-black);
                }

                .required {
                color: #ED3F27;
                margin-left: 4px;
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
