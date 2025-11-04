import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from '@renderer/components/Modal'
import Toast from '@renderer/components/Toast'
import type { Column, Row } from '@renderer/components/Table'
import FileUploadContent, { type FileUploadResult, type FileType } from './FileUploadContent'
import FilePreviewContent from './FilePreviewContent'
import FileMappingContent from './FileMappingContent'
import type {
  FileModalApplyPayload,
  ParseOptions,
  ParsedFileResult,
  MappingSubmitPayload
} from './types'

type Step = 'upload' | 'preview' | 'mapping'

interface FileModalProps {
  isOpen: boolean
  onClose: () => void
  tableName: string
  tableColumns: { name: string; type: string }[]
  recordCount: number
  onApply: (payload: FileModalApplyPayload) => void
}

const DEFAULT_PARSE_OPTIONS: ParseOptions = {
  useHeaderRow: true,
  lineSeparator: '\\n',
  columnSeparator: '\\t'
}

const FileModal: React.FC<FileModalProps> = ({
  isOpen,
  onClose,
  tableName,
  tableColumns,
  recordCount,
  onApply
}) => {
  const [step, setStep] = useState<Step>('upload')
  const [uploaded, setUploaded] = useState<FileUploadResult | null>(null)
  const [parseOptions, setParseOptions] = useState<ParseOptions>(DEFAULT_PARSE_OPTIONS)
  const [toast, setToast] = useState<{ show: boolean; type: 'warning' | 'success'; msg: string }>({
    show: false,
    type: 'warning',
    msg: ''
  })
  const [preserveOnClose, setPreserveOnClose] = useState(false)

  const parsedResult = useMemo<ParsedFileResult | null>(() => {
    if (!uploaded) return null
    return parseFile(uploaded, parseOptions)
  }, [uploaded, parseOptions])

  const cleanupCachedFile = useCallback(async (filePath?: string) => {
    if (!filePath || !window.api?.file?.cache?.remove) return
    try {
      await window.api.file.cache.remove(filePath)
    } catch (error) {
      console.warn('[file-modal] failed to remove cached file:', error)
    }
  }, [])

  const resetState = useCallback(
    (options?: { preserveFile?: boolean }) => {
      const preserveFile = options?.preserveFile ?? preserveOnClose
      if (uploaded?.filePath && !preserveFile) {
        void cleanupCachedFile(uploaded.filePath)
      }
      setStep('upload')
      setUploaded(null)
      setParseOptions(DEFAULT_PARSE_OPTIONS)
      setToast({ show: false, type: 'warning', msg: '' })
      setPreserveOnClose(false)
    },
    [cleanupCachedFile, preserveOnClose, uploaded]
  )

  useEffect(() => {
    if (!isOpen) {
      resetState()
    }
  }, [isOpen, resetState])

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 2500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [toast.show])

  const showToast = useCallback((msg: string, type: 'warning' | 'success' = 'warning') => {
    setToast({ show: true, type, msg })
  }, [])

  const handleUploadSuccess = (result: FileUploadResult): void => {
    if (uploaded?.filePath && uploaded.filePath !== result.filePath) {
      void cleanupCachedFile(uploaded.filePath)
    }
    setUploaded(result)
    setParseOptions(getDefaultOptions(result.fileType))
    setStep('preview')
  }

  const handleNextToMapping = (): void => {
    if (!parsedResult || parsedResult.error) {
      showToast(parsedResult?.error ?? '파일을 먼저 불러와주세요.')
      return
    }

    if (parsedResult.rows.length === 0) {
      showToast('파일에서 추출된 데이터가 없습니다.')
      return
    }

    setStep('mapping')
  }

  const handleMappingComplete = (payload: MappingSubmitPayload): void => {
    if (!uploaded || !parsedResult) return

    const activeMappings = payload.mappings.filter((m) => m.selected && m.mappedTo)
    if (activeMappings.length === 0) {
      showToast('매핑할 컬럼을 1개 이상 선택해주세요.')
      return
    }

    const columnMappings = activeMappings
      .map((mapping) => {
        const columnIndex = parsedResult.headers.findIndex((header) => header === mapping.mappedTo)
        if (columnIndex === -1) return null
        return {
          tableColumn: mapping.name,
          fileColumn: mapping.mappedTo,
          columnIndex
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    if (!columnMappings.length) {
      showToast('선택한 파일 컬럼 정보를 찾지 못했습니다.')
      return
    }

    const applyPayload: FileModalApplyPayload = {
      filePath: uploaded.filePath,
      fileType: uploaded.fileType,
      encoding: 'utf-8',
      parseOptions: {
        useHeaderRow: parseOptions.useHeaderRow,
        lineSeparator: uploaded.fileType === 'txt' ? parseOptions.lineSeparator : undefined,
        columnSeparator: uploaded.fileType === 'txt' ? parseOptions.columnSeparator : undefined
      },
      mappings: columnMappings,
      recordCount: payload.recordCount,
      headers: parsedResult.headers,
      preview: {
        columns: parsedResult.columns,
        rows: parsedResult.rows
      },
      totalRows: parsedResult.totalRows
    }

    onApply(applyPayload)
    setPreserveOnClose(true)
    showToast('파일 데이터 매핑이 완료되었습니다.', 'success')
    setTimeout(() => {
      onClose()
      resetState({ preserveFile: true })
    }, 600)
  }

  const handleBack = (): void => {
    if (step === 'mapping') setStep('preview')
    else if (step === 'preview') setStep('upload')
  }

  const handleCloseRequest = (): void => {
    onClose()
    resetState()
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleCloseRequest} width="740px">
        {step === 'upload' && (
          <FileUploadContent
            tableName={tableName}
            onNext={handleUploadSuccess}
            onError={showToast}
          />
        )}

        {step === 'preview' && uploaded && (
          <FilePreviewContent
            tableName={tableName}
            file={uploaded.file}
            fileType={uploaded.fileType}
            parseOptions={parseOptions}
            parseResult={parsedResult}
            onChangeOptions={(options) => setParseOptions((prev) => ({ ...prev, ...options }))}
            onBack={handleBack}
            onNext={handleNextToMapping}
          />
        )}

        {step === 'mapping' && parsedResult && uploaded && (
          <FileMappingContent
            tableName={tableName}
            tableColumns={tableColumns}
            fileHeaders={parsedResult.headers}
            rows={parsedResult.rows}
            recordCount={recordCount}
            maxRecords={parsedResult.totalRows > 0 ? parsedResult.totalRows : null}
            onBack={handleBack}
            onComplete={handleMappingComplete}
          />
        )}
      </Modal>

      {toast.show && (
        <Toast type={toast.type} title={toast.type === 'success' ? '성공' : '알림'}>
          {toast.msg}
        </Toast>
      )}
    </>
  )
}

export default FileModal

const CSV_SEPARATOR = ','

function parseFile(result: FileUploadResult, options: ParseOptions): ParsedFileResult {
  switch (result.fileType) {
    case 'csv':
      return parseDelimitedPreview(
        normalizeNewLines(result.previewContent),
        '\n',
        CSV_SEPARATOR,
        options,
        result,
        'csv'
      )
    case 'txt':
      return parseDelimitedPreview(
        normalizeNewLines(result.previewContent),
        resolveSeparator(options.lineSeparator, '\n'),
        resolveSeparator(options.columnSeparator, '\t'),
        options,
        result,
        'txt'
      )
    case 'json':
      return parseJsonPreview(result)
    default:
      return {
        columns: [],
        rows: [],
        headers: [],
        totalRows: 0,
        error: '지원하지 않는 파일 형식입니다.',
        fileType: result.fileType
      }
  }
}

function parseDelimitedPreview(
  normalizedContent: string,
  lineSeparator: string,
  columnSeparator: string,
  options: ParseOptions,
  meta: FileUploadResult,
  fileType: FileType
): ParsedFileResult {
  const rawLines = normalizedContent.split(lineSeparator)
  const lines = rawLines.filter((line) => line.trim().length > 0)

  if (!lines.length) {
    return {
      columns: [],
      rows: [],
      headers: [],
      totalRows: 0,
      error: `${fileType.toUpperCase()} 파일에서 데이터를 찾지 못했습니다.`,
      fileType
    }
  }

  const matrix = lines.map((line) => line.split(columnSeparator).map((value) => value.trim()))
  const [headers, dataRows] = extractMatrix(matrix, options.useHeaderRow)
  const dedupedHeaders = dedupeHeaders(headers)
  const columns: Column[] = dedupedHeaders.map((header) => ({
    key: header,
    title: header,
    type: 'text'
  }))

  const parsedRows: Row[] = dataRows.map((values, rowIndex) => {
    const row: Row = { id: rowIndex + 1 }
    dedupedHeaders.forEach((header, colIndex) => {
      row[header] = values[colIndex] ?? ''
    })
    return row
  })

  const previewRows = parsedRows.slice(0, 5)

  const totalRows =
    meta.lineCount !== null
      ? Math.max(meta.lineCount - (options.useHeaderRow ? 1 : 0), 0)
      : parsedRows.length

  return {
    columns,
    rows: previewRows,
    headers: dedupedHeaders,
    totalRows,
    fileType,
    truncated: meta.previewTruncated
  }
}

function parseJsonPreview(meta: FileUploadResult): ParsedFileResult {
  if (meta.previewTruncated) {
    return {
      columns: [],
      rows: [],
      headers: [],
      totalRows: 0,
      fileType: 'json',
      error: 'JSON 파일이 커서 미리보기를 제공할 수 없습니다.'
    }
  }

  try {
    const parsed = JSON.parse(meta.previewContent)
    if (!Array.isArray(parsed)) {
      return {
        columns: [],
        rows: [],
        headers: [],
        totalRows: 0,
        fileType: 'json',
        error: 'JSON 파일은 배열 형태여야 합니다.'
      }
    }

    if (!parsed.length) {
      return {
        columns: [],
        rows: [],
        headers: [],
        totalRows: 0,
        fileType: 'json',
        error: 'JSON 배열에 데이터가 없습니다.'
      }
    }

    const keySet = new Set<string>()
    parsed.forEach((item) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        Object.keys(item).forEach((key) => keySet.add(key))
      }
    })

    if (!keySet.size) {
      return {
        columns: [],
        rows: [],
        headers: [],
        totalRows: 0,
        fileType: 'json',
        error: 'JSON 데이터에서 사용할 수 있는 속성이 없습니다.'
      }
    }

    const headers = dedupeHeaders(Array.from(keySet))
    const columns: Column[] = headers.map((header) => ({
      key: header,
      title: header,
      type: 'text'
    }))

    const rows: Row[] = parsed.slice(0, 5).map((item, index) => {
      const row: Row = { id: index + 1 }
      headers.forEach((header) => {
        const value =
          item && typeof item === 'object' && !Array.isArray(item)
            ? (item as Record<string, unknown>)[header]
            : undefined
        row[header] = formatCellValue(value)
      })
      return row
    })

    return {
      columns,
      rows,
      headers,
      totalRows: parsed.length,
      fileType: 'json'
    }
  } catch (error) {
    console.error('[parseJsonPreview] JSON parse error:', error)
    return {
      columns: [],
      rows: [],
      headers: [],
      totalRows: 0,
      fileType: 'json',
      error: '유효한 JSON 형식이 아닙니다.'
    }
  }
}

function extractMatrix(matrix: string[][], useHeaderRow: boolean): [string[], string[][]] {
  if (useHeaderRow && matrix.length > 0) {
    const headerRow = matrix[0]
    return [headerRow, matrix.slice(1)]
  }

  const maxLength = matrix.reduce((max, row) => Math.max(max, row.length), 0)
  const headers = Array.from({ length: maxLength }, (_, idx) => `col${idx + 1}`)
  return [headers, matrix]
}

function dedupeHeaders(headers: string[]): string[] {
  const counter = new Map<string, number>()
  return headers.map((header, idx) => {
    const base = header && header.trim() ? header.trim() : `col${idx + 1}`
    const count = counter.get(base) ?? 0
    counter.set(base, count + 1)
    if (count === 0) return base
    return `${base}_${count + 1}`
  })
}

function resolveSeparator(value: string, fallback: string): string {
  if (!value) return fallback
  if (value === '\\n') return '\n'
  if (value === '\\t') return '\t'
  return value
}

function normalizeNewLines(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function getDefaultOptions(fileType: FileType): ParseOptions {
  if (fileType === 'txt') {
    return {
      useHeaderRow: true,
      lineSeparator: '\\n',
      columnSeparator: '\\t'
    }
  }

  return {
    useHeaderRow: true,
    lineSeparator: '\\n',
    columnSeparator: '\\t'
  }
}
