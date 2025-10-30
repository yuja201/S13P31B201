import Button from '@renderer/components/Button'
import InputField from '@renderer/components/InputField'
import Modal from '@renderer/components/Modal'
import PageTitle from '@renderer/components/PageTitle'
import RadioButton from '@renderer/components/RadioButton'
import Toast from '@renderer/components/Toast'
import React, { useState } from 'react'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (projectData: ProjectFormData) => void
}

export interface ProjectFormData {
  projectName: string
  description: string
  dbType: 'MySQL' | 'PostgreSQL'
  host: string
  port: string
  username: string
  password: string
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<ProjectFormData>({
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
  const [toastType, setToastType] = useState<'success' | 'warning' | 'error'>('success')
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

  const handleConnectionTest = async (): Promise<void> => {
    if (!validateRequiredFields()) {
      return
    }

    try {
      // 연결 테스트
      const result = await window.api.testConnection({
        dbType: formData.dbType,
        host: formData.host,
        port: parseInt(formData.port),
        username: formData.username,
        password: formData.password
      })

      if (result.success) {
        setToastType('success')
        setToastMessage('데이터베이스 연결에 성공했습니다.')
      } else {
        setToastType('error')
        setToastMessage(result.message)
      }
      setShowToast(true)
    } catch (error) {
      console.error('연결 테스트 중 오류:', error)
      setToastType('warning')
      setToastMessage('연결 테스트 중 오류가 발생했습니다.')
      setShowToast(true)
    }
  }

  const handleInputChange = (field: keyof ProjectFormData, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (): Promise<void> => {
    if (!validateRequiredFields()) {
      return
    }

    try {
      // 프로젝트 생성
      const project = await window.api.project.create({
        name: formData.projectName,
        description: formData.description
      })

      const dbmsId = formData.dbType === 'MySQL' ? 1 : 2

      // 데이터베이스 연결 정보 저장
      await window.api.database.create({
        project_id: project.id,
        dbms_id: dbmsId,
        url: `${formData.host}:${formData.port}`,
        username: formData.username,
        password: formData.password
      })

      if (onSubmit) {
        onSubmit(formData)
      }

      setFormData({
        projectName: '',
        description: '',
        dbType: 'MySQL',
        host: '127.0.0.1',
        port: '3306',
        username: 'root',
        password: ''
      })
      setSelected('MySQL')
      onClose()
    } catch (error) {
      console.error('프로젝트 생성 중 오류 발생:', error)
      setToastType('error')
      setToastMessage('프로젝트 생성에 실패했습니다.')
      setShowToast(true)
    }
  }

  return (
    <>
      <style>
        {`
          .create-project-modal-header {
            margin-bottom: 14px;
          }

          .create-project-modal-divider {
            margin: 14px 0;
            border: none;
            border-top: 1px solid #e5e7eb;
          }

          .create-project-modal-form-container {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .create-project-modal-input-group {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .create-project-modal-dbms-section {
            margin-bottom: 14px;
            font-size: 16px;
          }

          .create-project-modal-radio-group {
            display: flex;
            gap: 14px;
          }

          .create-project-modal-row-group {
            display: flex;
            gap: 14px;
          }

          .create-project-modal-button-container {
            display: flex;
            justify-content: flex-end;
            gap: 14px;
            margin-top: 14px;
            margin-right: 16px;
            margin-bottom: 10px;
          }
        `}
      </style>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="create-project-modal-header">
          <PageTitle
            title="프로젝트 생성"
            description="새로운 데이터베이스 프로젝트의 정보를 입력해주세요."
            size="small"
          />
          <hr className="create-project-modal-divider" />
        </div>
        <div className="create-project-modal-form-container">
          <div className="create-project-modal-input-group">
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
              width={645}
              value={formData.description}
              onChange={(value) => handleInputChange('description', value)}
            />
          </div>
          <div>
            <p className="create-project-modal-dbms-section">DBMS</p>
            <div className="create-project-modal-radio-group">
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
          <div className="create-project-modal-row-group">
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
        <div className="create-project-modal-button-container">
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
              title={
                toastType === 'success'
                  ? '연결 성공'
                  : toastType === 'warning'
                    ? '입력 오류'
                    : '연결 실패'
              }
              onClose={() => setShowToast(false)}
            >
              <div className="toast-text">{toastMessage}</div>
            </Toast>
          </div>
        )}
      </Modal>
    </>
  )
}

export default CreateProjectModal
