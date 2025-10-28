import React, { useState } from 'react'
import Modal from '@renderer/components/Modal'
import SimpleCard from '@renderer/components/SimpleCard'
import InputField from '@renderer/components/InputField'
import PageTitle from '@renderer/components/PageTitle'
import SelectDomain from '@renderer/components/SelectDomain'
import Button from '@renderer/components/Button'

interface RuleCreationModalProps {
  isOpen: boolean
  onClose: () => void
}

const RuleCreationModal: React.FC<RuleCreationModalProps> = ({ isOpen, onClose }) => {
  const [selectedSource, setSelectedSource] = useState<'faker' | 'ai'>('faker')
  const [settingName, setSettingName] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [prompt, setPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState('OpenAI GPT-4')

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="720px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* 제목 */}
        <PageTitle
          size="small"
          title="생성 규칙 선택 - username"
          description="고정값을 입력하거나 생성한 규칙을 적용해보세요."
        />

        {/* 설정 이름 */}
        <InputField
          title="설정 이름"
          placeholder="예: 한국 이름, 회사 이메일, 나이(20-60)"
          required
          titleBold
          width="100%"
          value={settingName}
          onChange={setSettingName}
          description="나중에 쉽게 찾을 수 있도록 구체적인 이름을 입력하세요."
        />

        {/* 데이터 소스 선택 */}
        <div>
          <div
            className="preSemiBold16"
            style={{ marginBottom: '12px', color: 'var(--color-black)' }}
          >
            데이터 소스 <span style={{ color: '#ED3F27' }}>*</span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              width: '100%',
              justifyContent: 'center'
            }}
          >
            <SimpleCard
              title="Faker.js 생성"
              description="무작위 데이터를 생성해요"
              selected={selectedSource === 'faker'}
              onSelect={() => setSelectedSource('faker')}
            />
            <SimpleCard
              title="AI 생성"
              description="진짜 같은 데이터를 생성해요"
              selected={selectedSource === 'ai'}
              onSelect={() => setSelectedSource('ai')}
            />
          </div>
        </div>

        {/* 도메인 선택 */}
        <div>
          <SelectDomain />
        </div>

        {/* AI 생성 선택 시에만 표시되는 섹션 */}
        {selectedSource === 'ai' && (
          <>
            {/* 모델 선택 */}
            <div>
              <div
                className="preSemiBold14"
                style={{ marginBottom: '12px', color: 'var(--color-black)' }}
              >
                모델 선택 <span style={{ color: '#ED3F27' }}>*</span>
              </div>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  border: '1px solid #c9d8eb',
                  borderRadius: '10px',
                  padding: '0 16px',
                  fontSize: '15px',
                  fontFamily: 'var(--font-family)',
                  outline: 'none',
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-black)'
                }}
              >
                <option value="OpenAI GPT-4o">OpenAI GPT-4o</option>
                <option value="Claude 3.5">Claude 3.5</option>
                <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
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
              size="sm"
            />

            {/* 프롬프트 입력 */}
            <InputField
              title="프롬프트 (500자 이내)"
              placeholder="예: 50에서 500 사이의 값을 만들어주세요. 400 이상은 50% 이상으로 해주세요."
              width="100%"
              titleBold
              value={prompt}
              onChange={setPrompt}
              size="sm"
            />
          </>
        )}

        {/* 하단 버튼 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '12px'
          }}
        >
          <Button variant="gray" onClick={onClose}>
            취소
          </Button>
          <Button variant="orange">생성</Button>
        </div>
      </div>
    </Modal>
  )
}

export default RuleCreationModal
