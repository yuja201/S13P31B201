import React, { useState, useEffect } from 'react'
import Modal from '@renderer/components/Modal'
import PageTitle from '@renderer/components/PageTitle'
import InputField from '@renderer/components/InputField'
import Button from '@renderer/components/Button'
import { useToastStore } from '@renderer/stores/toastStore'

interface AISettingModalProps {
  isOpen: boolean
  onClose: () => void
}

const AISettingModal: React.FC<AISettingModalProps> = ({ isOpen, onClose }) => {
  const showToast = useToastStore((s) => s.showToast)

  const [model, setModel] = useState('1')
  const [apiToken, setApiToken] = useState('')

  // 기존 저장된 env 적용
  useEffect(() => {
    if (!isOpen) return

    let autoToken = ''
    if (model === '1' && window.env?.OPENAI_API_KEY) autoToken = window.env.OPENAI_API_KEY
    else if (model === '2' && window.env?.ANTHROPIC_API_KEY)
      autoToken = window.env.ANTHROPIC_API_KEY
    else if (model === '3' && window.env?.GOOGLE_API_KEY) autoToken = window.env.GOOGLE_API_KEY

    setApiToken(autoToken)
  }, [isOpen, model])

  const handleSave = async (): Promise<void> => {
    if (!apiToken.trim()) {
      showToast('API 토큰을 입력하세요.', 'warning', '입력 오류')
      return
    }

    let envKey = ''
    if (model === '1') envKey = 'OPENAI_API_KEY'
    else if (model === '2') envKey = 'ANTHROPIC_API_KEY'
    else if (model === '3') envKey = 'GOOGLE_API_KEY'

    if (envKey) {
      const result = await window.api.env.updateApiKey(envKey, apiToken)
      if (!result.success) {
        console.error('Failed to save API key:', result.error)
        showToast('API 키 저장 실패', 'warning', '저장 실패')
        return
      }
    }

    showToast('AI 설정이 저장되었습니다.', 'success', '성공')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="720px">
      <div className="ai-setting-modal">
        <PageTitle size="small" title="설정" description="AI API 토큰을 입력하세요." />
        <hr className="rule-create__divider" />

        {/* 모델 선택 */}
        <div className="section">
          <label className="label">
            모델 선택 <span className="required">*</span>
          </label>
          <select value={model} onChange={(e) => setModel(e.target.value)} className="select">
            <option value="1">OpenAI GPT-4.1 Mini</option>
            <option value="2">Claude 3.5 Haiku</option>
            <option value="3">Gemini 2.0 Flash</option>
          </select>
        </div>

        {/* API 토큰 입력 */}
        <InputField
          title="API 토큰"
          placeholder="API 키를 입력하세요"
          required
          titleBold
          width="100%"
          value={apiToken}
          onChange={setApiToken}
        />

        {/* 하단 버튼 */}
        <div className="footer">
          <Button variant="gray" onClick={onClose}>
            취소
          </Button>
          <Button variant="orange" onClick={handleSave}>
            확인
          </Button>
        </div>
      </div>

      <style>{`
        .ai-setting-modal {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 28px;
          padding: 6px 6px 12px 6px;
          animation: fadeIn 0.25s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .label {
          font-family: var(--font-family);
          font-size: 15px;
          font-weight: var(--fw-semiBold);
          color: var(--color-black);
        }

        .required { color: #ED3F27; }

        .select {
          width: 100%;
          height: 42px;
          border: 1px solid #c9d8eb;
          border-radius: 10px;
          padding: 0 16px;
          font-size: 15px;
          background-color: var(--color-white);
          color: var(--color-black);
        }

        .footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
        }

        .rule-create__divider {
          border: none;
          border-top: 1px solid rgba(0, 0, 0, 0.15);
          margin-top: 12px;
        }
      `}</style>
    </Modal>
  )
}

export default AISettingModal
