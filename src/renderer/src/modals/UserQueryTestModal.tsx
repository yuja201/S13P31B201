import React, { useState, useEffect } from 'react'
import Modal from '@renderer/components/Modal'
import Button from '@renderer/components/Button'
import PageTitle from '@renderer/components/PageTitle'
import LoadingSpinner from '@renderer/components/LoadingSpinner'
import { useToastStore } from '@renderer/stores/toastStore'

interface UserQueryTestModalProps {
  isOpen: boolean
  projectId: string
  initialQuery?: string
  initialCount?: number
  initialTimeout?: number
  onClose: () => void
  onStart: (query: string, cnt: number, timeout: number) => Promise<number>
  onNavigate: (testId: number) => void
}

const RUN_COUNT_OPTIONS = [10, 20, 30, 50, 100, 200, 500, 1000]
const TIMEOUT_OPTIONS = [5, 10, 20, 30, 60, 90, 120]

const UserQueryTestModal: React.FC<UserQueryTestModalProps> = ({
  isOpen,
  onClose,
  onStart,
  onNavigate,
  projectId,
  initialQuery,
  initialCount,
  initialTimeout
}) => {
  const [query, setQuery] = useState(initialQuery ?? '')
  const [runCount, setRunCount] = useState(initialCount ?? 50)
  const [timeout, setTimeout] = useState(initialTimeout ?? 30)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  const showToast = useToastStore((s) => s.showToast)

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery ?? '')
      setRunCount(initialCount ?? 50)
      setTimeout(initialTimeout ?? 30)
    }
  }, [isOpen, initialQuery, initialCount, initialTimeout])
  // ==========================
  // 공통 SQL 문법 검증 함수
  // ==========================
  const performValidation = async (): Promise<{ valid: boolean; error?: string }> => {
    return window.api.validateSQL({
      projectId: Number(projectId),
      query
    })
  }

  // ==========================
  // 문법 검증
  // ==========================
  const handleValidate = async (): Promise<void> => {
    if (!query.trim()) {
      showToast('SQL 쿼리를 입력해주세요.', 'warning', '문법 검증 실패')
      return
    }

    setIsValidating(true)

    try {
      const result = await performValidation()

      if (result.valid) {
        showToast('SQL 문법이 유효합니다.', 'success', '검증 성공')
      } else {
        showToast(result.error || 'SQL 문법 오류가 있습니다.', 'error', '검증 실패')
      }
    } catch (error) {
      const err = error as Error
      showToast(err.message || 'SQL 문법 검증 중 오류가 발생했습니다.', 'error', '검증 실패')
    } finally {
      setIsValidating(false)
    }
  }

  // ==========================
  // 테스트 실행
  // ==========================
  const handleStart = async (): Promise<void> => {
    if (!query.trim()) {
      showToast('쿼리가 비어있습니다.', 'error', '실행 불가')
      return
    }

    try {
      // 1) 실행 전에 문법 검증
      const validate = await performValidation()

      if (!validate.valid) {
        showToast(validate.error || 'SQL 문법 오류가 있습니다.', 'error', '문법 검증 실패')
        return
      }

      // 2) 문법 검증 성공 → 로딩 시작
      setIsLoading(true)

      // 3) 테스트 실행
      const newTestId = await onStart(query, runCount, timeout)
      onNavigate(newTestId)
    } catch (error) {
      const err = error as Error
      showToast(err.message || '쿼리 실행 중 오류가 발생했습니다.', 'error', '실행 실패')
    } finally {
      setIsLoading(false)
    }
  }

  const isBusy = isLoading || isValidating

  return (
    <Modal
      isOpen={isOpen}
      // isBusy일 땐 모달 닫기 막기 (undefined 대신 no-op으로 타입 오류 방지)
      onClose={isBusy ? () => {} : onClose}
      width="750px"
    >
      {isBusy ? (
        <div className="loading-layout">
          <div className="loading-spinner-wrapper">
            <LoadingSpinner
              background="transparent"
              text={
                isValidating ? '쿼리 문법을 검증 중입니다...' : '유자가 쿼리를 실행 중입니다...'
              }
              width={690}
            />
          </div>
          <div className="loading-text-top">잠시만 기다려주세요...</div>

          <style>{`
            .loading-layout {
              width: 100%;
              height: 420px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
            }
            .loading-spinner-wrapper {
              margin-bottom: 20px;
            }
            .loading-text-top {
              margin-top: 10px;
              font-size: 16px;
              font-weight: 500;
            }
          `}</style>
        </div>
      ) : (
        <div className="query-modal">
          <PageTitle
            title="사용자 쿼리 테스트"
            description="테스트할 쿼리를 입력해보세요."
            size="small"
          />

          <hr className="divider" />

          {/* SQL 입력 */}
          <div className="label-row">
            <div className="section-title preSemiBold20">SQL 쿼리 입력</div>
            <Button variant="blue" size="md" onClick={handleValidate}>
              문법 검증
            </Button>
          </div>

          <textarea
            className="textarea-field"
            placeholder="ex) SELECT * FROM users;"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {/* 테스트 설정 */}
          <div className="section-title preSemiBold20 mt-6">테스트 설정</div>

          <div className="option-block">
            <span className="input-label preRegular14">실행 횟수</span>
            <select
              className="select-field wide"
              value={runCount}
              onChange={(e) => setRunCount(Number(e.target.value))}
            >
              {RUN_COUNT_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="option-block">
            <span className="input-label preRegular14">타임아웃</span>
            <select
              className="select-field wide"
              value={timeout}
              onChange={(e) => setTimeout(Number(e.target.value))}
            >
              {TIMEOUT_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}초
                </option>
              ))}
            </select>
          </div>

          {/* 버튼 */}
          <div className="actions">
            <Button variant="gray" size="md" onClick={onClose} disabled={isBusy}>
              취소
            </Button>
            <Button variant="orange" size="md" onClick={handleStart} disabled={isBusy}>
              시작
            </Button>
          </div>
        </div>
      )}

      <style>{`
        .query-modal .label-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 24px;
          margin-bottom: 8px;
        }

        .query-modal .section-title {
          display: flex;
          align-items: flex-end;
          margin-bottom: 8px;
        }

        .query-modal .input-label {
          margin-bottom: 8px;
          margin-top: 6px;
          color: var(--color-black);
        }

        .divider {
          width: 100%;
          border: none;
          border-top: 1px solid var(--color-dark-gray);
          margin: 14px 0 24px;
        }

        .query-modal .textarea-field {
          width: 100%;
          height: 160px;
          border-radius: 10px;
          border: 1px solid #c9d8eb;
          padding: 12px;
          resize: vertical;
          font-family: var(--font-family);
          font-size: 14px;
          box-shadow: var(--shadow);
          margin-bottom: 20px;
        }

        .query-modal .select-field {
          width: 100%;
          max-width: 240px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid #c9d8eb;
          padding: 0 10px;
          padding-right: 24px;
          box-shadow: var(--shadow);
          font-family: var(--font-family);
          font-size: 14px;
          appearance: none;
          background-color: var(--color-white);
          background-image:
            url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23555' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
        }

        .query-modal .option-block {
          display: flex;
          flex-direction: column;
          margin-bottom: 5px;
        }
        
        .query-modal .actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
      `}</style>
    </Modal>
  )
}

export default UserQueryTestModal
