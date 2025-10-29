import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@renderer/components/Button'
import InputField from '@renderer/components/InputField'
import PageTitle from '@renderer/components/PageTitle'
import RadioButton from '@renderer/components/RadioButton'
import Toast from '@renderer/components/Toast'

interface ProjectInfo {
  projectName: string
  description: string
  dbType: 'MySQL' | 'PostgreSQL'
  host: string
  port: string
  username: string
  password: string
}

const InfoView: React.FC = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState<ProjectInfo>({
    projectName: '',
    description: '',
    dbType: 'MySQL',
    host: '127.0.0.1',
    port: '3306',
    username: 'root',
    password: ''
  })

  const [selected, setSelected] = useState('MySQL')
  const [showToast, setShowToast] = useState(false)
  const [toastType, setToastType] = useState<'success' | 'warning'>('success')
  const [toastMessage, setToastMessage] = useState('')

  const validateRequiredFields = (): boolean => {
    if (!formData.projectName.trim()) {
      setToastType('warning')
      setToastMessage('프로젝트명을 입력해주세요.')
      setShowToast(true)
      return false
    }
    if (!formData.host.trim()) {
      setToastType('warning')
      setToastMessage('호스트를 입력해주세요.')
      setShowToast(true)
      return false
    }
    if (!formData.port.trim()) {
      setToastType('warning')
      setToastMessage('포트를 입력해주세요.')
      setShowToast(true)
      return false
    }
    if (!formData.username.trim()) {
      setToastType('warning')
      setToastMessage('사용자명을 입력해주세요.')
      setShowToast(true)
      return false
    }
    if (!formData.password.trim()) {
      setToastType('warning')
      setToastMessage('비밀번호를 입력해주세요.')
      setShowToast(true)
      return false
    }
    return true
  }

  const handleConnectionTest = (): void => {
    if (!validateRequiredFields()) {
      return
    }

    setToastType('success')
    setToastMessage('데이터베이스 연결에 성공했습니다.')
    setShowToast(true)
  }

  const handleInputChange = (field: keyof ProjectInfo, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (): void => {
    if (!validateRequiredFields()) {
      return
    }

    // TODO: 프로젝트 정보 저장 로직
    // 저장 후 SchemaView로 이동
    navigate('/main/schema')
  }

  return (
    <>
      <style>
        {`
          .info-view-header {
            margin-bottom: 40px;
          }
          .info-view-form-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .info-view-input-group {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .info-view-dbms-section {
            margin-bottom: 20px;
            font-size: 16px;
          }
          .info-view-radio-group {
            display: flex;
            gap: 20px;
          }
          .info-view-row-group {
            display: flex;
            gap: 50px;
          }
          .info-view-button-container {
            display: flex;
            justify-content: flex-end;
            gap: 20px;
            margin-top: 20px;
          }
        `}
      </style>
      <div>
        <div className="info-view-header">
          <PageTitle
            title="프로젝트 생성"
            description="새로운 데이터베이스 프로젝트의 정보를 입력해주세요."
          />
        </div>
        <div className="info-view-form-container">
          <div className="info-view-input-group">
            <InputField
              title="프로젝트명"
              placeholder="프로젝트명"
              width={300}
              required={true}
              value={formData.projectName}
              onChange={(value) => handleInputChange('projectName', value)}
            />
            <InputField
              title="프로젝트 설명"
              placeholder="프로젝트 설명"
              width={650}
              value={formData.description}
              onChange={(value) => handleInputChange('description', value)}
            />
          </div>
          <div>
            <p className="info-view-dbms-section">DBMS</p>
            <div className="info-view-radio-group">
              <RadioButton
                label="MySQL"
                name="DBMS"
                value="MySQL"
                checked={selected === 'MySQL'}
                onChange={(e) => {
                  setSelected(e.target.value)
                  handleInputChange('dbType', e.target.value as 'MySQL' | 'PostgreSQL')
                }}
              />
              <RadioButton
                label="PostgreSQL"
                name="DBMS"
                value="PostgreSQL"
                checked={selected === 'PostgreSQL'}
                onChange={(e) => {
                  setSelected(e.target.value)
                  handleInputChange('dbType', e.target.value as 'MySQL' | 'PostgreSQL')
                }}
              />
            </div>
          </div>
          <div className="info-view-row-group">
            <InputField
              title="호스트"
              placeholder="127.0.0.1"
              width={300}
              required={true}
              value={formData.host}
              onChange={(value) => handleInputChange('host', value)}
            />
            <InputField
              title="포트"
              placeholder="3306"
              width={300}
              required={true}
              value={formData.port}
              onChange={(value) => handleInputChange('port', value)}
            />
          </div>
          <InputField
            title="사용자명"
            placeholder="user"
            width={300}
            required={true}
            value={formData.username}
            onChange={(value) => handleInputChange('username', value)}
          />
          <InputField
            title="비밀번호"
            placeholder="password"
            width={300}
            required={true}
            value={formData.password}
            onChange={(value) => handleInputChange('password', value)}
            password={true}
          />
        </div>
        <div className="info-view-button-container">
          <Button variant="gray" onClick={handleConnectionTest}>
            연결테스트
          </Button>
          <Button onClick={handleSubmit}>생성</Button>
        </div>

        {showToast && (
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999
            }}
          >
            <Toast
              type={toastType}
              title={toastType === 'success' ? '연결 성공' : '입력 오류'}
              onClose={() => setShowToast(false)}
            >
              <div className="toast-text">{toastMessage}</div>
            </Toast>
          </div>
        )}
      </div>
    </>
  )
}

export default InfoView
