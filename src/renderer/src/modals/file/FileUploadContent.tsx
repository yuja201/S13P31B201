import React, { useState, useCallback } from 'react'
import { CgSoftwareDownload } from 'react-icons/cg'
import PageTitle from '@renderer/components/PageTitle'
import Toast from '@renderer/components/Toast'
import type { Column, Row } from '@renderer/components/Table'

interface FileUploadContentProps {
  tableName: string
  onNext: (file: File, columns: Column[], rows: Row[]) => void
  onError: (msg: string) => void
}

const FileUploadContent: React.FC<FileUploadContentProps> = ({ tableName, onNext }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  /** ✅ Toast 자동 닫기 */
  const showError = useCallback((msg: string): void => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }, [])

  /** ✅ CSV 파싱 */
  const parseCSV = (text: string): [Column[], Row[]] => {
    const lines = text.trim().split('\n')
    if (!lines.length) return [[], []]
    const headers = lines[0].split(',').map((h) => h.trim())
    const rows: Row[] = lines.slice(1).map((line, idx) => {
      const values = line.split(',')
      const row: Row = { id: idx + 1 }
      headers.forEach((h, i) => (row[h] = values[i] ?? ''))
      return row
    })
    const cols: Column[] = headers.map((h) => ({ key: h, title: h, type: 'text' }))
    return [cols, rows]
  }

  /** ✅ JSON 파싱 */
  const parseJSON = (text: string): [Column[], Row[]] => {
    try {
      const data = JSON.parse(text)
      if (!Array.isArray(data) || !data.length) return [[], []]
      const keys = Object.keys(data[0])
      const cols: Column[] = keys.map((k) => ({ key: k, title: k, type: 'text' }))
      const rows: Row[] = data.map((obj, idx) => ({ id: idx + 1, ...obj }))
      return [cols, rows]
    } catch {
      return [[], []]
    }
  }

  /** ✅ TXT 파싱 (탭 기준) */
  const parseTXT = (text: string): [Column[], Row[]] => {
    const lines = text.trim().split('\n')
    if (!lines.length) return [[], []]
    const headers = lines[0].split('\t').map((h) => h.trim())
    const rows: Row[] = lines.slice(1).map((line, idx) => {
      const values = line.split('\t')
      const row: Row = { id: idx + 1 }
      headers.forEach((h, i) => (row[h] = values[i] ?? ''))
      return row
    })
    const cols: Column[] = headers.map((h) => ({ key: h, title: h, type: 'text' }))
    return [cols, rows]
  }

  /** ✅ 파일 파싱 + 유효성 검사 */
  const handleFile = async (file: File): Promise<void> => {
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'json', 'txt'].includes(ext || '')) {
      showError('지원하지 않는 파일 형식입니다. (csv, json, txt만 가능)')
      return
    }

    if (file.size === 0) {
      showError('파일이 비어 있습니다.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('파일 크기는 최대 5MB까지만 허용됩니다.')
      return
    }

    const text = await file.text()
    let cols: Column[] = []
    let rows: Row[] = []

    if (ext === 'csv') [cols, rows] = parseCSV(text)
    else if (ext === 'json') [cols, rows] = parseJSON(text)
    else [cols, rows] = parseTXT(text)

    if (!rows.length) {
      showError('파일에 데이터가 없습니다.')
      return
    }

    onNext(file, cols, rows)
  }

  /** ✅ 드래그 드롭 */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="file-content">
      <PageTitle
        title={`데이터 가져오기 - ${tableName}`}
        description="파일에서 데이터 가져오기"
        size="small"
      />
      <hr className="divider" />

      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <CgSoftwareDownload size={140} color="var(--color-main-blue)" />
        <p className="preSemiBold20">파일을 드래그하거나 선택하세요.</p>
        <p className="preRegular16">지원 확장자: csv, json, txt</p>
        <input
          type="file"
          accept=".csv,.json,.txt"
          className="file-input"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />
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

        .upload-zone {
          position: relative;
          border: 2px solid var(--color-gray-200);
          border-radius: 12px;
          width: 100%;
          height: 280px;
          background-color: var(--color-white);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 0.25s;
          cursor: pointer;
        }

        .upload-zone.dragging {
          border-color: var(--color-main-blue);
          background-color: var(--color-light-blue);
        }

        .file-input {
          position: absolute;
          opacity: 0;
          inset: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}

export default FileUploadContent
