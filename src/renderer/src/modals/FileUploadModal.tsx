import React, { useState, useCallback } from 'react'
import Modal from '@renderer/components/Modal'
import { CgSoftwareDownload } from 'react-icons/cg'
import PageTitle from '@renderer/components/PageTitle'
// import FilePreviewModal from '@renderer/modals/FilePreviewModal'

interface FileUploadModalProps {
  isOpen: boolean
  onClose: () => void
  tableName: string
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({ isOpen, onClose, tableName }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
      setIsPreviewOpen(true)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setIsPreviewOpen(true)
    }
  }

  const handlePreviewClose = () => {
    setIsPreviewOpen(false)
    setSelectedFile(null)
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <PageTitle
          title={`데이터 가져오기 - ${tableName}`}
          description="파일에서 데이터 가져오기"
          size="small"
        />

        <hr className="divider" />

        <div className="main-content">
          <div
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-icon">
              <CgSoftwareDownload size={150} />
            </div>

            <p className="upload-text preSemiBold24">파일을 드래그 하거나 파일을 선택하세요.</p>
            <p className="upload-subtext preSemiBold24">지원 확장자 : csv, json, txt</p>

            <input
              type="file"
              accept=".csv,.json,.txt"
              onChange={handleFileChange}
              className="file-input"
            />
          </div>
        </div>

        <style>{`
          .main-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px;
          }

          .upload-zone {
            position: relative;
            border: 2px solid var(--color-gray-200);
            width: 500px;
            height: 350px;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: var(--color-white);
            color: var(--color-dark-gray);
            transition: all 0.25s ease;
            cursor: pointer;
          }

          .upload-zone.dragging {
            border-color: var(--color-main-blue);
            background-color: var(--color-light-blue);
          }

          .file-input {
            opacity: 0;
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
          }

          .divider {
            border: none;
            border-top: 1px solid var(--color-gray-200);
            margin: 16px 0;
          }
        `}</style>
      </Modal>

      {/* {selectedFile && (
        <FilePreviewModal isOpen={isPreviewOpen} onClose={handlePreviewClose} file={selectedFile} />
      )} */}
    </>
  )
}

export default FileUploadModal
