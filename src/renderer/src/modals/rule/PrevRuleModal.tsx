import React, { useState } from 'react'
import Modal from '@renderer/components/Modal'
import Button from '@renderer/components/Button'
import InputField from '@renderer/components/InputField'
import PageTitle from '@renderer/components/PageTitle'
import Label from '@renderer/components/Label'

interface PrevRuleModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: (value: string) => void
}

const PrevRuleModal: React.FC<PrevRuleModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [fixedValue, setFixedValue] = useState('')

  const handleConfirm = (): void => {
    if (onConfirm) onConfirm(fixedValue)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="560px">
      <div className="prev-modal">
        {/* 제목 */}
        <div className="prev-modal__header">
          <PageTitle
            title="생성 규칙 선택 - username"
            description="고정값을 입력하거나 생성한 규칙을 적용해보세요."
            size="small"
          />
        </div>

        {/* 고정값 입력 */}
        <div className="prev-modal__section">
          <InputField
            title="고정값 입력"
            placeholder="예: 홍길동, 20, 0.0, TRUE"
            width="100%"
            titleBold
            size="md"
            value={fixedValue}
            onChange={setFixedValue}
          />
        </div>

        {/* 이전 설정 */}
        <div className="prev-modal__section">
          <div className="prev-modal__section-header">
            <span className="prev-modal__section-title">이전 설정</span>
            <Button variant="blue" size="sm">
              + 새로 만들기
            </Button>
          </div>

          <div className="prev-modal__rules">
            <div className="prev-modal__rule">
              <div className="prev-modal__rule-top">
                <span className="prev-modal__rule-title">나이 (20~60)</span>
                <Label text="Faker.js" />
              </div>
              <span className="prev-modal__rule-desc">숫자</span>
            </div>

            <div className="prev-modal__rule">
              <div className="prev-modal__rule-top">
                <span className="prev-modal__rule-title">출생년도</span>
                <Label text="AI" />
              </div>
              <span className="prev-modal__rule-desc">
                연도
                <br />
                2000년대 이상을 80% 해주고 나머지 20%는 2000년대 이하로 해줘
              </span>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="prev-modal__footer">
          <Button variant="gray" onClick={onClose}>
            취소
          </Button>
          <Button variant="orange" onClick={handleConfirm}>
            확인
          </Button>
        </div>
      </div>

      <style>{`
        .prev-modal {
          display: flex;
          flex-direction: column;
          gap: 35px;
          padding: 0 14px 14px 0;
        }

        .prev-modal__header {
          margin-bottom: 4px;
        }

        .prev-modal__section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .prev-modal__section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .prev-modal__section-title {
          font-family: var(--font-family);
          font-weight: var(--fw-semiBold);
          font-size: 16px;
          color: var(--color-black);
        }

        .prev-modal__rules {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .prev-modal__rule {
          background-color: var(--color-white);
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 10px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: all 0.2s ease-in-out;
        }

        .prev-modal__rule:hover {
          background-color: rgba(230, 240, 255, 0.5);
        }

        .prev-modal__rule-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .prev-modal__rule-title {
          font-family: var(--font-family);
          font-weight: var(--fw-medium);
          font-size: 14px;
          color: var(--color-black);
        }

        .prev-modal__rule-desc {
          font-family: var(--font-family);
          font-weight: var(--fw-regular);
          font-size: 12px;
          color: var(--color-dark-gray);
          line-height: 1.4;
          white-space: pre-line;
        }

        .prev-modal__footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 10px;
        }
      `}</style>
    </Modal>
  )
}

export default PrevRuleModal
