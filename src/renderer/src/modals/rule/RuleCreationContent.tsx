import { formatCheckConstraint } from '@renderer/utils/formatConstraint'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import SimpleCard from '@renderer/components/SimpleCard'
import InputField from '@renderer/components/InputField'
import PageTitle from '@renderer/components/PageTitle'
import SelectDomain from '@renderer/components/SelectDomain'
import Button from '@renderer/components/Button'
import { useToastStore } from '@renderer/stores/toastStore'
import Checkbox from '@renderer/components/Checkbox'
import { ColumnDetail } from '@renderer/views/CreateDummyView'
import { useRuleStore } from '@renderer/stores/ruleStore'

export interface RuleCreationData {
  source: 'FAKER' | 'AI'
  settingName: string
  apiToken?: string
  prompt?: string
  model?: string
  columnType: string
  columnName?: string
  result?: number
  domainId?: number
  domainName?: string
  ensureUnique?: boolean
}

interface RuleCreationContentProps {
  column: ColumnDetail
  columnType: string
  columnName?: string
  onCancel: () => void
  onSubmit?: (data: RuleCreationData) => void
}

const RuleCreationContent: React.FC<RuleCreationContentProps> = ({
  column,
  columnType,
  columnName,
  onCancel,
  onSubmit
}) => {
  const [selectedSource, setSelectedSource] = useState<'FAKER' | 'AI'>('FAKER')
  const [settingName, setSettingName] = useState('')
  const showToast = useToastStore((s) => s.showToast)
  const [apiToken, setApiToken] = useState('')
  const [prompt, setPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState('1')
  const [selectedDomain, setSelectedDomain] = useState<{ id: number; name: string } | null>(null)
  const [ensureUnique, setEnsureUnique] = useState(false)
  const isUniqueColumn = useMemo(() => column.constraints.includes('UNIQUE'), [column])
  const addRule = useRuleStore((state) => state.addRule)
  const [locale, setLocale] = useState<'en' | 'ko'>('en')

  const handleDomainChange = useCallback(
    (domain: { id: number; name: string }) => {
      setSelectedDomain(domain)
    },
    [setSelectedDomain]
  )

  const validateRequiredFields = (): boolean => {
    if (!settingName.trim()) {
      showToast('설정 이름을 입력하세요.', 'warning', '입력 오류')
      return false
    }
    if (!selectedDomain) {
      showToast('도메인을 선택하세요.', 'warning', '입력 오류')
      return false
    }
    if (selectedSource === 'AI') {
      if (!apiToken.trim()) {
        showToast('API 토큰을 입력하세요.', 'warning', '입력 오류')
        return false
      }
      if (prompt.length > 500) {
        showToast('프롬프트는 500자 이내로 입력하세요.', 'warning', '입력 오류')
        return false
      }
    }
    return true
  }

  const handleSubmit = async (): Promise<void> => {
    if (!validateRequiredFields()) return

    if (selectedSource === 'AI' && apiToken.trim()) {
      let envKey = ''
      if (selectedModel === '1') envKey = 'OPENAI_API_KEY'
      else if (selectedModel === '2') envKey = 'ANTHROPIC_API_KEY'
      else if (selectedModel === '3') envKey = 'GOOGLE_API_KEY'

      if (envKey) {
        const result = await window.api.env.updateApiKey(envKey, apiToken)
        if (!result.success) {
          console.error('Failed to save API key:', result.error)
        }
      }
    }

    try {
      if (selectedSource === 'FAKER') {
        const result = await window.api.rule.createFaker({
          name: settingName,
          domain: selectedDomain!.id,
          locale: locale
        })
        addRule(result)

        onSubmit?.({
          source: selectedSource,
          settingName,
          columnType,
          columnName,
          result: result.id,
          domainId: selectedDomain!.id,
          domainName: selectedDomain!.name,
          ensureUnique: ensureUnique
        })

        showToast('Faker 규칙이 저장되었습니다.', 'success', '성공')
      } else if (selectedSource === 'AI') {
        const result = await window.api.rule.createAI({
          name: settingName,
          domain: selectedDomain!.id,
          model_id: Number(selectedModel),
          token: apiToken,
          prompt
        })
        addRule(result)

        onSubmit?.({
          source: selectedSource,
          settingName,
          apiToken,
          prompt,
          model: selectedModel,
          columnType,
          columnName,
          result: result.id,
          domainId: selectedDomain!.id,
          domainName: selectedDomain!.name,
          ensureUnique: ensureUnique
        })

        showToast('AI 규칙이 저장되었습니다.', 'success', '성공')
      }

      onCancel()
    } catch (err) {
      console.error(err)
      showToast('규칙 저장 중 오류가 발생했습니다.', 'warning', '저장 실패')
    }
  }

  useEffect(() => {
    if (selectedSource === 'AI') {
      let autoToken = ''
      if (selectedModel === '1' && window.env?.OPENAI_API_KEY) {
        autoToken = window.env.OPENAI_API_KEY
      } else if (selectedModel === '2' && window.env?.ANTHROPIC_API_KEY) {
        autoToken = window.env.ANTHROPIC_API_KEY
      } else if (selectedModel === '3' && window.env?.GOOGLE_API_KEY) {
        autoToken = window.env.GOOGLE_API_KEY
      }
      setApiToken(autoToken)
    } else {
      setApiToken('')
      setPrompt('')
    }
  }, [selectedModel, selectedSource])

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
        {column.checkConstraint && (
          <div className="check-constraint-notice">
            ※ 참고: 이 컬럼에는 <span>{formatCheckConstraint(column.checkConstraint)}</span> 제약
            조건이 있습니다.
          </div>
        )}
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
        <SelectDomain
          source={selectedSource}
          columnType={columnType}
          onChange={handleDomainChange}
        />
      </div>
      {/* Faker Locale 선택 추가 */}
      {selectedSource === 'FAKER' && (
        <div style={{ marginTop: '12px' }}>
          <div className="preSemiBold14" style={{ marginBottom: '6px' }}>
            언어 <span style={{ color: '#ED3F27' }}>*</span>
          </div>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as 'en' | 'ko')}
            style={{
              width: '100%',
              height: '42px',
              border: '1px solid #c9d8eb',
              borderRadius: '10px',
              padding: '0 16px',
              fontSize: '15px',
              fontFamily: 'var(--font-family)',
              backgroundColor: 'var(--color-white)'
            }}
          >
            <option value="en">English</option>
            <option value="ko">한국어</option>
          </select>
        </div>
      )}
      {(selectedSource === 'FAKER' || selectedSource === 'AI') && isUniqueColumn && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          <Checkbox
            id="ensure-unique"
            label="고유값 보장 (Ensure Uniqueness)"
            checked={ensureUnique}
            onChange={(e) => setEnsureUnique(e.target.checked)}
          />
          <p style={{ margin: '0 0 0 28px', fontSize: '13px', color: 'var(--color-gray-600)' }}>
            데이터 생성 시 중복되지 않는 값을 보장합니다. 생성 속도가 느려질 수 있습니다.
          </p>
        </div>
      )}

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

        .check-constraint-notice {
          background-color: var(--color-light-yellow);
          border: 1px solid var(--color-orange);
          border-radius: 8px;
          padding: 10px 12px;
          font: var(--preRegular14);
          color: var(--color-dark-gray);
          margin-top: 16px;
         }

        .check-constraint-notice span {
          font-weight: var(--fw-semiBold);
          color: var(--color-black);
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
