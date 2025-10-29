import React, { useEffect, useState } from 'react'
import Modal from '@renderer/components/Modal'
import PageTitle from '@renderer/components/PageTitle'
import Table, { Column, Row } from '@renderer/components/Table'
import Checkbox from '@renderer/components/Checkbox'
import Toast from '@renderer/components/Toast'
import InputField from '@renderer/components/InputField'

interface FilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  tableName: string
  file: File
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  tableName,
  file
}) => {
  const [columns, setColumns] = useState<Column[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string>('')
  const [useHeaderAsTitle, setUseHeaderAsTitle] = useState<boolean>(true)
  const [toastMessage, setToastMessage] = useState<string>('')
  const [showToast, setShowToast] = useState<boolean>(false)

  // ✅ TXT 전용 상태
  const [lineSeparator, setLineSeparator] = useState<string>('\\n')
  const [columnSeparator, setColumnSeparator] = useState<string>('\t')

  /** Toast 표시 */
  const showToastMessage = (msg: string): void => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  /** 파일 파싱 */
  useEffect(() => {
    const parseFile = async (): Promise<void> => {
      if (!file) return
      try {
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (!['csv', 'json', 'txt'].includes(ext || '')) {
          showToastMessage('⚠️ 지원하지 않는 파일 형식입니다. (csv, json, txt만 가능)')
          setError('지원하지 않는 파일 형식입니다.')
          return
        }

        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
          showToastMessage('⚠️ 파일 크기가 너무 큽니다. (최대 5MB까지 허용)')
          setError('파일 크기 초과')
          return
        }

        const text = await file.text()
        if (!text.trim()) {
          showToastMessage('⚠️ 파일에 데이터가 없습니다.')
          setError('빈 파일')
          return
        }

        if (ext === 'csv') parseCSV(text)
        else if (ext === 'json') parseJSON(text)
        else parseTXT(text)
      } catch (err) {
        console.error('파일 읽기 실패:', err)
        showToastMessage('❌ 파일을 읽는 중 오류가 발생했습니다.')
        setError('파일 읽기 실패')
      }
    }

    parseFile()
  }, [file, useHeaderAsTitle, lineSeparator, columnSeparator])

  /** CSV 파싱 */
  const parseCSV = (text: string): void => {
    const lines = text.trim().split('\n')
    if (lines.length === 0) return

    let headers: string[]
    let dataLines: string[]

    if (useHeaderAsTitle) {
      headers = lines[0].split(',').map((h) => h.trim())
      dataLines = lines.slice(1)
    } else {
      const firstLineCount = lines[0].split(',').length
      headers = Array.from({ length: firstLineCount }, (_, i) => `col${i + 1}`)
      dataLines = lines
    }

    const dataRows = dataLines.map((line, index) => {
      const values = line.split(',').map((v) => v.trim())
      const row: Row = { id: index + 1 }
      headers.forEach((key, i) => (row[key] = values[i] || ''))
      return row
    })

    const tableCols: Column[] = headers.map((key) => ({ key, title: key, type: 'text' }))
    setColumns(tableCols)
    setRows(dataRows)
  }

  /** JSON 파싱 */
  const parseJSON = (text: string): void => {
    try {
      const data = JSON.parse(text)
      if (Array.isArray(data) && data.length > 0) {
        const keys = Object.keys(data[0])
        const tableCols: Column[] = keys.map((key) => ({ key, title: key, type: 'text' }))
        const dataRows: Row[] = data.map((item, idx) => ({ id: item.id || idx + 1, ...item }))
        setColumns(tableCols)
        setRows(dataRows)
      } else throw new Error('JSON이 배열 형식이 아닙니다.')
    } catch {
      showToastMessage('❌ JSON 파일 형식이 올바르지 않습니다.')
      setError('JSON 파싱 실패')
    }
  }

  /** TXT 파싱 */
  const parseTXT = (text: string): void => {
    const lineSep = lineSeparator === '\\n' ? '\n' : lineSeparator
    const colSep = columnSeparator === '\\t' ? '\t' : columnSeparator

    const lines = text.trim().split(lineSep)
    if (lines.length === 0) return

    let headers: string[]
    let dataLines: string[]

    if (useHeaderAsTitle) {
      headers = lines[0].split(colSep).map((h) => h.trim() || `col${h}`)
      dataLines = lines.slice(1)
    } else {
      const firstLineCount = lines[0].split(colSep).length
      headers = Array.from({ length: firstLineCount }, (_, i) => `col${i + 1}`)
      dataLines = lines
    }

    const dataRows: Row[] = dataLines.map((line, idx) => {
      const values = line.split(colSep)
      const row: Row = { id: idx + 1 }
      headers.forEach((key, i) => (row[key] = values[i] || ''))
      return row
    })

    const tableCols: Column[] = headers.map((key) => ({ key, title: key, type: 'text' }))
    setColumns(tableCols)
    setRows(dataRows)
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase()

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="preview-container">
          <PageTitle
            title={`데이터 가져오기 - ${tableName}`}
            description="파일에서 데이터 가져오기"
            size="small"
          />

          <div className="section-title preSemiBold16">파일 내용 *</div>

          <div className="file-info preRegular14">
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

          {/* ✅ TXT 구분자 입력 (Inline InputField 스타일 적용) */}
          {fileExt === 'txt' && (
            <div className="inline-inputs">
              <div className="inline-input">
                <span className="input-label preRegular14">행 구분자</span>
                <input
                  className="plain-input"
                  type="text"
                  value={lineSeparator}
                  onChange={(e) => setLineSeparator(e.target.value)}
                  placeholder="예: \\n"
                />
              </div>
              <div className="inline-input">
                <span className="input-label preRegular14">열 구분자</span>
                <input
                  className="plain-input"
                  type="text"
                  value={columnSeparator}
                  onChange={(e) => setColumnSeparator(e.target.value)}
                  placeholder="예: \\t, , |"
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
              maxHeight="340px"
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

          <div className="preview-actions">
            <button className="cancel-btn" onClick={onClose}>
              취소
            </button>
            <button className="next-btn">다음</button>
          </div>
        </div>

        <style>{`
          .preview-container {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            width: 640px;
            max-height: 80vh;
            overflow-y: auto;
            padding: 28px 32px;
          }

          .section-title {
            margin-top: 20px;
            margin-bottom: 10px;
            color: var(--color-black);
          }

          .file-info {
            display: flex;
            gap: 24px;
            margin-bottom: 12px;
            color: var(--color-dark-gray);
          }

          /* ✅ 인라인 InputField 스타일 */
          .inline-inputs {
            display: flex;
            align-items: center;
            gap: 28px;
            margin-bottom: 16px;
          }

          .inline-input {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .input-label {
            color: var(--color-black);
            font-weight: var(--fw-regular);
          }

          .plain-input {
            width: 100px;
            height: 36px;
            padding: 0 10px;
            border-radius: 10px;
            border: 1px solid #c9d8eb;
            background-color: var(--color-white);
            font-family: var(--font-family);
            color: var(--color-black);
            outline: none;
            box-shadow: var(--shadow);
          }

          .plain-input::placeholder {
            color: var(--color-placeholder);
          }

          .option-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 12px;
          }

          .preview-actions {
            margin-top: 24px;
            width: 100%;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
          }

          .cancel-btn {
            background-color: #f3f4f6;
            color: var(--color-black);
            padding: 8px 20px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font: var(--preMedium16);
          }

          .next-btn {
            background-color: var(--color-orange);
            color: white;
            padding: 8px 24px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font: var(--preMedium16);
            transition: background 0.2s ease;
          }

          .next-btn:hover {
            background-color: #e27616;
          }
        `}</style>
      </Modal>

      {showToast && (
        <Toast type="warning" title="알림">
          {toastMessage}
        </Toast>
      )}
    </>
  )
}

export default FilePreviewModal
