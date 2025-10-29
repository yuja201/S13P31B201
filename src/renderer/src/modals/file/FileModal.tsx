import React, { useState, useEffect, useCallback } from 'react'
import Modal from '@renderer/components/Modal'
import Toast from '@renderer/components/Toast'
import FileUploadContent from './FileUploadContent'
import FilePreviewContent from './FilePreviewContent'
import FileMappingContent from './FileMappingContent'
import type { Column, Row } from '@renderer/components/Table'

type Step = 'upload' | 'preview' | 'mapping'

interface FileModalProps {
  isOpen: boolean
  onClose: () => void
  tableName: string
}

const FileModal: React.FC<FileModalProps> = ({ isOpen, onClose, tableName }) => {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [toast, setToast] = useState<{ show: boolean; type: 'warning' | 'success'; msg: string }>({
    show: false,
    type: 'warning',
    msg: ''
  })

  useEffect(() => {
    if (!isOpen) {
      setStep('upload')
      setFile(null)
      setColumns([])
      setRows([])
      setToast({ show: false, type: 'warning', msg: '' })
    }
  }, [isOpen])

  /** Toast 표시 */
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

  const handleUploadSuccess = (
    uploadedFile: File,
    parsedColumns: Column[],
    parsedRows: Row[]
  ): void => {
    setFile(uploadedFile)
    setColumns(parsedColumns)
    setRows(parsedRows)
    setStep('preview')
  }

  const handleNextToMapping = (): void => {
    if (!rows.length) {
      showToast('유효한 데이터가 없습니다.')
      return
    }
    setStep('mapping')
  }

  const handleComplete = (): void => {
    showToast('데이터 매핑이 완료되었습니다.', 'success')
    setTimeout(() => onClose(), 600)
  }

  const handleBack = (): void => {
    if (step === 'mapping') setStep('preview')
    else if (step === 'preview') setStep('upload')
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} width="740px">
        {step === 'upload' && (
          <FileUploadContent
            tableName={tableName}
            onNext={handleUploadSuccess}
            onError={showToast}
          />
        )}

        {step === 'preview' && file && (
          <FilePreviewContent
            tableName={tableName}
            file={file}
            columns={columns}
            rows={rows}
            onBack={handleBack}
            onNext={handleNextToMapping}
          />
        )}

        {step === 'mapping' && (
          <FileMappingContent
            tableName={tableName}
            columns={columns}
            rows={rows}
            onBack={handleBack}
            onComplete={handleComplete}
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
