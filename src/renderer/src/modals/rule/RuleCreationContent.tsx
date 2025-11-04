import React, { useState } from 'react'
import SimpleCard from '@renderer/components/SimpleCard'
import InputField from '@renderer/components/InputField'
import PageTitle from '@renderer/components/PageTitle'
import SelectDomain from '@renderer/components/SelectDomain'
import Button from '@renderer/components/Button'

export interface RuleCreationData {
  source: 'FAKER' | 'AI'
  settingName: string
  apiToken?: string
  prompt?: string
  model?: string
  columnType?: string
  columnName?: string
  result?: number
  domainId?: number
  domainName?: string
}

interface RuleCreationContentProps {
  columnType?: string
  columnName?: string
  onCancel: () => void
  onSubmit?: (data: RuleCreationData) => void
}

const RuleCreationContent: React.FC<RuleCreationContentProps> = ({
  columnType,
  columnName,
  onCancel,
  onSubmit
}) => {
  const [selectedSource, setSelectedSource] = useState<'FAKER' | 'AI'>('FAKER')
  const [settingName, setSettingName] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [prompt, setPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState('OpenAI GPT-4o')
  const [selectedDomain, setSelectedDomain] = useState<{ id: number; name: string } | null>(null)

  const handleSubmit = async (): Promise<void> => {
    if (!settingName.trim()) {
      alert('설정 이름을 입력하세요.')
      return
    }
    if (!selectedDomain) {
      alert('도메인을 선택하세요.')
      return
    }
    try {
      if (selectedSource === 'FAKER') {
        // 실제 규칙 생성 API 호출
        const result = await window.api.rule.createFaker({
          name: settingName,
          data_source: 'FAKER',
          domain: selectedDomain.id
        })

        onSubmit?.({
          source: selectedSource,
          settingName,
          columnType,
          columnName,
          result: result.id,
          domainId: selectedDomain.id,
          domainName: selectedDomain.name
        })
      } else if (selectedSource === 'AI') {
        // AI 모드일 땐 단순히 폼 데이터 전달
        onSubmit?.({
          source: selectedSource,
          settingName,
          apiToken,
          prompt,
          model: selectedModel,
          columnType,
          columnName,
          domainId: selectedDomain.id,
          domainName: selectedDomain.name
        })
      }

      onCancel()

      // AI 선택 시 로직은 추후 추가
    } catch (err) {
      console.error(err)
      alert('규칙 저장 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="rule-create">
      {/* 상단 타입 표시 */}
      {columnType && <div className="rule-create__type">{columnType.toUpperCase()}</div>}

      {/* 제목 */}
      <div className="rule-create__header">
        <PageTitle
          size="small"
          title={`새 규칙 만들기 - ${columnName}`}
          description="데이터 생성 방식을 선택하고, 관련 정보를 입력하세요."
        />
        <br />
        <hr className="rule-create__divider" />
      </div>

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
      <div className="rule-create__section">
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
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <SimpleCard
            title="Faker.js 생성"
            description="무작위 데이터를 생성해요"
            selected={selectedSource === 'FAKER'}
            onSelect={() => setSelectedSource('FAKER')}
          />
          <SimpleCard
            title="AI 생성"
            description="진짜 같은 데이터를 생성해요"
            selected={selectedSource === 'AI'}
            onSelect={() => setSelectedSource('AI')}
          />
        </div>
      </div>

      {/* 도메인 선택 */}
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <SelectDomain onChange={(value) => setSelectedDomain(value)} />
      </div>

      {/* AI 생성 선택 시에만 표시되는 섹션 */}
      {selectedSource === 'AI' && (
        <>
          {/* 모델 선택 */}
          <div className="rule-create__section">
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
                color: 'var(--color-black)',
                boxSizing: 'border-box'
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
      <div className="rule-create__footer">
        <Button variant="gray" onClick={onCancel}>
          이전
        </Button>
        <Button variant="orange" onClick={handleSubmit}>
          확인
        </Button>
      </div>

      <style>{`
        .rule-create {
          display: flex;
          flex-direction: column;
          gap: 28px;
          width: 100%;
          align-self: center;
          box-sizing: border-box;
          overflow-x: hidden;
          padding: 0 14px 14px 0;
        }

        .rule-create__type {
          font-family: var(--font-family);
          font-size: 20px;
          font-weight: var(--fw-regular);
          color: var(--color-black);
        }

        .rule-create__header {
          margin-bottom: 4px;
        }

        .rule-create__divider {
          border: none;
          border-top: 1px solid rgba(0, 0, 0, 0.15);
          margin-top: 12px;
        }

        .rule-create__section {
          display: flex;
          flex-direction: column;
          margin-top: 10px;
          gap: 15px;
        }

        .rule-create__footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 12px;
        }
      `}</style>
    </div>
  )
}

export default RuleCreationContent
