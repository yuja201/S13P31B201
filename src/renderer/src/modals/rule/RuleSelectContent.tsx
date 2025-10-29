import React, { useState } from 'react'
import Button from '@renderer/components/Button'
import InputField from '@renderer/components/InputField'
import PageTitle from '@renderer/components/PageTitle'
import Label from '@renderer/components/Label'

export interface RuleCreationData {
  source: 'faker' | 'ai'
  settingName: string
  apiToken?: string
  prompt?: string
  model?: string
}

interface RuleSelectContentProps {
  typeName: string
  onCancel: () => void
  onConfirm?: (value: string) => void
  onCreateNew?: () => void
}

const RuleSelectContent: React.FC<RuleSelectContentProps> = ({
  typeName,
  onCancel,
  onConfirm,
  onCreateNew
}) => {
  const [fixedValue, setFixedValue] = useState('')

  const handleConfirm = (): void => {
    onConfirm?.(fixedValue)
  }

  return (
    <div className="rule-select">
      {/* 상단 타입 표시 */}
      <div className="rule-select__type">{typeName.toUpperCase()}</div>

      {/* 제목 */}
      <div className="rule-select__header">
        <PageTitle
          title="생성 규칙 선택 - username"
          description="고정값을 입력하거나 생성한 규칙을 적용해보세요."
          size="small"
        />
        <br />
        <hr className="rule-select__divider" />
      </div>

      {/* 고정값 입력 */}
      <div className="rule-select__section">
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
      <div className="rule-select__section">
        <div className="rule-select__section-header">
          <span className="rule-select__section-title">이전 설정</span>
          <Button variant="blue" size="sm" onClick={onCreateNew}>
            + 새로 만들기
          </Button>
        </div>

        <div className="rule-select__rules">
          <div className="rule-select__rule">
            <div className="rule-select__rule-top">
              <span className="rule-select__rule-title">나이 (20~60)</span>
              <Label text="Faker.js" />
            </div>
            <span className="rule-select__rule-desc">숫자</span>
          </div>

          <div className="rule-select__rule">
            <div className="rule-select__rule-top">
              <span className="rule-select__rule-title">출생년도</span>
              <Label text="AI" />
            </div>
            <span className="rule-select__rule-desc">
              연도
              <br />
              2000년대 이상을 80% 해주고 나머지 20%는 2000년대 이하로 해줘
            </span>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="rule-select__footer">
        <Button variant="gray" onClick={onCancel}>
          취소
        </Button>
        <Button variant="orange" onClick={handleConfirm}>
          확인
        </Button>
      </div>

      <style>{`
        .rule-select {
          display: flex;
          flex-direction: column;
          gap: 25px;
          padding: 0 14px 14px 0;
        }

        .rule-select__type {
          font-family: var(--font-family);
          font-size: 20px;
          font-weight: var(--fw-regular);
          color: var(--color-black);
        }

        .rule-select__header {
          margin-bottom: 4px;
        }

        .rule-select__divider {
          border: none;
          border-top: 1px solid rgba(0, 0, 0, 0.15);
          margin-top: 12px;
        }

        .rule-select__section {
          display: flex;
          flex-direction: column;
          margin-top: 10px;
          gap: 15px;
        }

        .rule-select__section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .rule-select__section-title {
          font-family: var(--font-family);
          font-weight: var(--fw-semiBold);
          font-size: 16px;
          color: var(--color-black);
        }

        .rule-select__rules {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .rule-select__rule {
          background-color: var(--color-white);
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 10px;
          padding: 22px 20px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          transition: all 0.2s ease-in-out;
        }

        .rule-select__rule:hover {
          background-color: rgba(230, 240, 255, 0.5);
        }

        .rule-select__rule-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .rule-select__rule-title {
          font-family: var(--font-family);
          font-weight: var(--fw-medium);
          font-size: 16px;
          color: var(--color-black);
        }

        .rule-select__rule-desc {
          font-family: var(--font-family);
          font-weight: var(--fw-regular);
          font-size: 14px;
          color: var(--color-dark-gray);
          line-height: 1.5;
          white-space: pre-line;
        }

        .rule-select__footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  )
}

export default RuleSelectContent
