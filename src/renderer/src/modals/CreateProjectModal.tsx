import { Button } from '@renderer/components/Button'
import InputField from '@renderer/components/InputField'
import Modal from '@renderer/components/Modal'
import PageTitle from '@renderer/components/PageTitle'
import RadioButton from '@renderer/components/RadioButton'
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
  const handleInputChange = (field: keyof ProjectFormData, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (): void => {
    const alertMessage = `
      입력값?
      프로젝트명: ${formData.projectName}
      프로젝트 설명: ${formData.description}
      DBMS: ${formData.dbType}
      호스트: ${formData.host}
      포트: ${formData.port}
      사용자명: ${formData.username}
      비밀번호: ${formData.password}
    `.trim()

    alert(alertMessage)

    if (onSubmit) {
      onSubmit(formData)
    }
    onClose()
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
            font-size: 20px;
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
          />
        </div>
        <div className="create-project-modal-button-container">
          <Button variant="gray">연결테스트</Button>
          <Button onClick={handleSubmit}>생성</Button>
        </div>
      </Modal>
    </>
  )
}

export default CreateProjectModal
