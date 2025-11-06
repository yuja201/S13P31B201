import Button from '@renderer/components/Button'
import InputField from '@renderer/components/InputField'
import Modal from '@renderer/components/Modal'
import PageTitle from '@renderer/components/PageTitle'
import RadioButton from '@renderer/components/RadioButton'
import { useToastStore } from '@renderer/stores/toastStore'
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
  databaseName: string
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: '',
    description: '',
    dbType: 'MySQL',
    host: '127.0.0.1',
    port: '3306',
    username: 'root',
    password: '',
    databaseName: ''
  })

  const [selected, setSelected] = useState('MySQL')
  const showToast = useToastStore((s) => s.showToast)
  const [isConnectionTested, setIsConnectionTested] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)

  const validateRequiredFields = (): boolean => {
    if (!formData.projectName.trim()) {
      showToast('프로젝트명을 입력해주세요.', 'warning', '입력 오류')
      return false
    }
    if (!formData.host.trim()) {
      showToast('호스트를 입력해주세요.', 'warning', '입력 오류')
      return false
    }
    if (!formData.port.trim()) {
      showToast('포트를 입력해주세요.', 'warning', '입력 오류')
      return false
    }
    if (!formData.username.trim()) {
      showToast('사용자명을 입력해주세요.', 'warning', '입력 오류')
      return false
    }
    if (!formData.password.trim()) {
      showToast('비밀번호를 입력해주세요.', 'warning', '입력 오류')
      return false
    }
    if (!formData.databaseName.trim()) {
      showToast('데이터베이스명을 입력해주세요.', 'warning', '입력 오류')
      return false
    }
    return true
  }

  const handleConnectionTest = async (): Promise<void> => {
    if (!validateRequiredFields()) {
      return
    }

    setIsTestingConnection(true)

    try {
      // 연결 테스트
      const result = await window.api.testConnection({
        dbType: formData.dbType,
        host: formData.host,
        port: parseInt(formData.port),
        username: formData.username,
        password: formData.password,
        database: formData.databaseName
      })

      if (result.success) {
        showToast('데이터베이스 연결에 성공했습니다.', 'success', '연결 성공')
        setIsConnectionTested(true)
      } else {
        showToast(result.message, 'error')
        setIsConnectionTested(false)
      }
    } catch (error) {
      console.error('연결 테스트 중 오류:', error)
      showToast('연결 테스트 중 오류가 발생했습니다.', 'error', '연결 실패')
      setIsConnectionTested(false)
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleInputChange = (field: keyof ProjectFormData, value: string): void => {
    // DB 정보 변경 시 연결 테스트 상태 초기화
    if (field !== 'projectName' && field !== 'description') {
      setIsConnectionTested(false)
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (): Promise<void> => {
    if (!validateRequiredFields()) {
      return
    }

    if (!isConnectionTested) {
      showToast('연결 테스트를 먼저 진행해주세요.', 'error', '연결 실패')
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
        password: formData.password,
        database_name: formData.databaseName
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
        password: '',
        databaseName: ''
      })
      setSelected('MySQL')
      setIsConnectionTested(false)
      onClose()
    } catch (error) {
      console.error('프로젝트 생성 중 오류 발생:', error)
      showToast('프로젝트 생성에 실패했습니다.', 'error', '연결 실패')
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
                  setFormData((prev) => ({
                    ...prev,
                    dbType: 'MySQL',
                    port: '3306',
                    username: 'root'
                  }))
                  setIsConnectionTested(false)
                }}
              />
              <RadioButton
                label="PostgreSQL"
                name="DBMS"
                value="PostgreSQL"
                checked={selected === 'PostgreSQL'}
                onChange={(e) => {
                  setSelected(e.target.value)
                  setFormData((prev) => ({
                    ...prev,
                    dbType: 'PostgreSQL',
                    port: '5432',
                    username: 'postgres'
                  }))
                  setIsConnectionTested(false)
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
          <div className="create-project-modal-row-group">
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
          <InputField
            title="데이터베이스명"
            placeholder="sakila"
            width={300}
            required={true}
            value={formData.databaseName}
            onChange={(value) => handleInputChange('databaseName', value)}
          />
        </div>
        <div className="create-project-modal-button-container">
          <Button variant="gray" onClick={handleConnectionTest} isLoading={isTestingConnection}>
            연결테스트
          </Button>
          <Button onClick={handleSubmit} disabled={!isConnectionTested}>
            생성
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default CreateProjectModal
