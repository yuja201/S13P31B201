import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@renderer/components/Button'
import InputField from '@renderer/components/InputField'
import PageTitle from '@renderer/components/PageTitle'
import RadioButton from '@renderer/components/RadioButton'
import Toast from '@renderer/components/Toast'
import { useProjectStore } from '@renderer/stores/projectStore'

interface ProjectInfo {
  projectName: string
  description: string
  dbType: 'MySQL' | 'PostgreSQL'
  host: string
  port: string
  username: string
  password: string
  databaseName: string
}

const InfoView: React.FC = () => {
  const navigate = useNavigate()
  const selectedProject = useProjectStore((state) => state.selectedProject)
  const setSelectedProject = useProjectStore((state) => state.setSelectedProject)
  const updateProjectInList = useProjectStore((state) => state.updateProjectInList)

  const [formData, setFormData] = useState<ProjectInfo>({
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
  const [showToast, setShowToast] = useState(false)
  const [toastType, setToastType] = useState<'success' | 'warning' | 'error'>('success')
  const [toastMessage, setToastMessage] = useState('')
  const [isConnectionTested, setIsConnectionTested] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)

  useEffect(() => {
    if (selectedProject && selectedProject.database) {
      const [host, port] = selectedProject.database.url.split(':')
      const dbType = selectedProject.dbms?.name === 'PostgreSQL' ? 'PostgreSQL' : 'MySQL'

      setFormData({
        projectName: selectedProject.name,
        description: selectedProject.description,
        dbType: dbType,
        host: host,
        port: port,
        username: selectedProject.database.username,
        password: selectedProject.database.password,
        databaseName: selectedProject.database.database_name
      })

      setSelected(dbType)
    }
  }, [selectedProject])

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
    if (!formData.databaseName.trim()) {
      setToastType('warning')
      setToastMessage('데이터베이스명을 입력해주세요.')
      setShowToast(true)
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
        setToastType('success')
        setToastMessage('데이터베이스 연결에 성공했습니다.')
        setIsConnectionTested(true)
      } else {
        setToastType('error')
        setToastMessage(result.message)
        setIsConnectionTested(false)
      }
      setShowToast(true)
    } catch (error) {
      console.error('연결 테스트 중 오류:', error)
      setToastType('warning')
      setToastMessage('연결 테스트 중 오류가 발생했습니다.')
      setIsConnectionTested(false)
      setShowToast(true)
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleInputChange = (field: keyof ProjectInfo, value: string): void => {
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
      setToastType('error')
      setToastMessage('연결 테스트를 먼저 진행해주세요.')
      setShowToast(true)
      return
    }

    if (!selectedProject) {
      setToastType('error')
      setToastMessage('프로젝트 정보를 찾을 수 없습니다.')
      setShowToast(true)
      return
    }

    try {
      // 프로젝트 정보 업데이트
      const updatedProject = await window.api.project.update({
        id: selectedProject.id,
        name: formData.projectName,
        description: formData.description
      })

      // 데이터베이스 연결 정보 업데이트
      let updatedDatabase = selectedProject.database
      if (selectedProject.database) {
        const dbmsId = formData.dbType === 'MySQL' ? 1 : 2

        updatedDatabase = await window.api.database.update({
          id: selectedProject.database.id,
          dbms_id: dbmsId,
          url: `${formData.host}:${formData.port}`,
          username: formData.username,
          password: formData.password,
          database_name: formData.databaseName
        })
      }

      // DBMS 정보 가져오기
      let updatedDbms = selectedProject.dbms
      if (updatedDatabase) {
        updatedDbms = await window.api.dbms.getById(updatedDatabase.dbms_id)
      }

      // Zustand Store 업데이트
      if (updatedProject) {
        const updatedProjectWithDetails = {
          ...updatedProject,
          database: updatedDatabase,
          dbms: updatedDbms
        }

        setSelectedProject(updatedProjectWithDetails)
        updateProjectInList(selectedProject.id, updatedProjectWithDetails)
      }

      // SchemaView로 이동
      navigate(`/main/schema/${selectedProject.id}`)
    } catch (error) {
      console.error('프로젝트 정보 저장 중 오류 발생:', error)
      setToastType('error')
      setToastMessage('프로젝트 정보 저장에 실패했습니다.')
      setShowToast(true)
    }
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
            title="프로젝트 정보"
            description="데이터베이스 프로젝트의 정보를 확인하고 수정하세요."
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
          <div className="info-view-row-group">
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
        <div className="info-view-button-container">
          <Button variant="gray" onClick={handleConnectionTest} isLoading={isTestingConnection}>
            연결테스트
          </Button>
          <Button onClick={handleSubmit} disabled={!isConnectionTested}>
            다음
          </Button>
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
      </div>
    </>
  )
}

export default InfoView
