import React, { useCallback, useState } from 'react'
import { CgSoftwareDownload } from 'react-icons/cg'
import PageTitle from '@renderer/components/PageTitle'
import LoadingSpinner from '@renderer/components/LoadingSpinner'
import { useToastStore } from '@renderer/stores/toastStore'

export type FileType = 'csv' | 'json' | 'txt'

export interface FileUploadResult {
  file: File
  filePath: string
  fileType: FileType
  previewContent: string
  previewTruncated: boolean
  lineCount: number | null
  fileSize: number
}

interface FileUploadContentProps {
  tableName: string
  onNext: (result: FileUploadResult) => void
}

const SUPPORTED_EXTENSIONS: FileType[] = ['csv', 'json', 'txt']
const MAX_PREVIEW_CHARS = 200_000 // about 200 KB of preview text

const FileUploadContent: React.FC<FileUploadContentProps> = ({ tableName, onNext }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const showToast = useToastStore((s) => s.showToast)

  const streamFileToCache = useCallback(async (file: File, ext: FileType) => {
    if (!window.api?.file?.cache?.stream?.open) {
      throw new Error('파일 스트리밍 API를 사용할 수 없습니다.')
    }

    const { streamId, filePath } = await window.api.file.cache.stream.open({ extension: ext })
    const reader = file.stream().getReader()
    const decoder = new TextDecoder('utf-8')

    let preview = ''
    let previewTruncated = false
    let lineBreakCount = 0
    let lastByte = -1

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (!value) continue

        await window.api.file.cache.stream.write({
          streamId,
          chunk: Array.from(value)
        })

        lastByte = value[value.length - 1] ?? lastByte

        if (ext !== 'json') {
          lineBreakCount += countNewlines(value)
        }

        if (!previewTruncated) {
          const textChunk = decoder.decode(value, { stream: true })
          preview += textChunk
          if (preview.length > MAX_PREVIEW_CHARS) {
            preview = preview.slice(0, MAX_PREVIEW_CHARS)
            previewTruncated = true
          }
        }
      }

      if (!previewTruncated) {
        preview += decoder.decode(new Uint8Array(), { stream: false })
      } else {
        decoder.decode(new Uint8Array(), { stream: false })
      }

      await window.api.file.cache.stream.close({ streamId })

      const lineCount =
        ext === 'json' ? null : lineBreakCount + (file.size > 0 && lastByte !== 0x0a ? 1 : 0)

      return { filePath, preview, previewTruncated, lineCount }
    } catch (error) {
      await window.api.file.cache.stream.close({ streamId }).catch(() => {})
      throw error
    }
  }, [])
  const handleFile = async (file: File): Promise<void> => {
    if (!file) return

    setIsLoading(true)

    try {
      const ext = (file.name.split('.').pop() || '').toLowerCase() as FileType | ''

      if (!SUPPORTED_EXTENSIONS.includes(ext as FileType)) {
        showToast('지원하지 않는 파일 형식입니다. (csv, json, txt만 지원)', 'warning', '파일 오류')
        return
      }

      if (file.size === 0) {
        showToast('파일이 비어 있습니다.', 'warning', '파일 오류')
        return
      }

      const { filePath, preview, previewTruncated, lineCount } = await streamFileToCache(
        file,
        ext as FileType
      )

      if (!preview.trim()) {
        showToast('파일에서 유효한 데이터를 찾지 못했습니다.', 'warning', '파일 오류')
        return
      }

      onNext({
        file,
        filePath,
        fileType: ext as FileType,
        previewContent: preview,
        previewTruncated,
        lineCount,
        fileSize: file.size
      })
    } catch (error) {
      console.error('파일 처리 실패:', error)
      showToast('파일을 처리하는 중 오류가 발생했습니다.', 'warning', '파일 오류')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  return (
    <div className="file-content">
      {isLoading ? (
        <div className="loading-layout">
          <div className="loading-spinner-wrapper">
            <LoadingSpinner background="transparent" text="" width={700} />
          </div>

          <div className="loading-text-top">유자가 파일을 읽는 중 입니다...</div>
        </div>
      ) : (
        <>
          <PageTitle
            title={`파일 불러오기 - ${tableName}`}
            description="파일을 이용해 더미 데이터를 생성할 수 있습니다."
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
            <p className="preSemiBold20">파일을 드래그하거나 선택해주세요</p>
            <p className="preRegular16">지원 형식: csv, json, txt</p>
            <input
              type="file"
              accept=".csv,.json,.txt"
              className="file-input"
              onChange={(e) => e.target.files && void handleFile(e.target.files[0])}
            />
          </div>
        </>
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

function countNewlines(buffer: Uint8Array): number {
  let count = 0
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === 0x0a) count++
  }
  return count
}

export default FileUploadContent
