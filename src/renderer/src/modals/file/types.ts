import type { Column, Row } from '@renderer/components/Table'
import type { FileType } from '@renderer/modals/file/FileUploadContent'
import type { FileMappingApplyPayload } from '@renderer/stores/generationStore'

export interface ParseOptions {
  useHeaderRow: boolean
  lineSeparator: string
  columnSeparator: string
}

export interface ParsedFileResult {
  columns: Column[]
  rows: Row[]
  headers: string[]
  totalRows: number
  error?: string
  fileType: FileType
  truncated?: boolean
}

export interface FileModalApplyPayload extends FileMappingApplyPayload {
  headers: string[]
  preview: {
    columns: Column[]
    rows: Row[]
  }
  totalRows: number
}

export interface MappingColumn {
  name: string
  type: string
  mappedTo: string
  selected: boolean
}

export interface MappingSubmitPayload {
  mappings: MappingColumn[]
  recordCount: number
  allowDuplicates: boolean
}
