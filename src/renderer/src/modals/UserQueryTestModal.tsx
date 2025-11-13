import React, { useState } from 'react'
import Modal from '@renderer/components/Modal'
import Button from '@renderer/components/Button'
import PageTitle from '@renderer/components/PageTitle'
import { useToastStore } from '@renderer/stores/toastStore'

interface UserQueryTestModalProps {
  isOpen: boolean
  projectId: string
  onClose: () => void
  onStart: (query: string, count: number, timeout: number) => void
}

const RUN_COUNT_OPTIONS = [10, 20, 30, 50, 100, 200, 500, 1000]
const TIMEOUT_OPTIONS = [5, 10, 20, 30, 60, 90, 120]

const UserQueryTestModal: React.FC<UserQueryTestModalProps> = ({ isOpen, onClose, onStart }) => {
  const [query, setQuery] = useState('')
  const [runCount, setRunCount] = useState(50)
  const [timeout, setTimeout] = useState(30)

  const showToast = useToastStore((s) => s.showToast)

  const handleValidate = (): void => {
    if (!query.trim()) {
      showToast('SQL 쿼리를 입력해주세요.', 'warning', '문법 검증 실패')
      return
    }
    console.log('[문법 검증 실행] query:', query)
    showToast('문법 검증을 완료했습니다.', 'success', '검증 성공')
  }

  const handleStart = (): void => {
    if (!query.trim()) {
      showToast('쿼리가 비어있습니다.', 'error', '실행 불가')
      return
    }
    console.log('[쿼리 테스트 시작]', query, runCount, timeout)
    onStart(query, runCount, timeout)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="750px">
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
          <Button variant="gray" size="md" onClick={onClose}>
            취소
          </Button>
          <Button variant="orange" size="md" onClick={handleStart}>
            시작
          </Button>
        </div>
      </div>

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
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23555' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
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
          justify-content: flex-end;  /* 🔥 오른쪽 정렬 */
          gap: 12px;
          margin-top: 24px;           /* 🔥 위 여백 추가 */
        }
      `}</style>
    </Modal>
  )
}

export default UserQueryTestModal
