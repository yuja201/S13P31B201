import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@renderer/components/Button'
import InputField from '@renderer/components/InputField'
import PageTitle from '@renderer/components/PageTitle'
import RadioButton from '@renderer/components/RadioButton'
import { useToastStore } from '@renderer/stores/toastStore'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useSchemaStore } from '@renderer/stores/schemaStore'
import { useDebounce } from 'use-debounce'

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
  const showToast = useToastStore((s) => s.showToast)
  const clearSchema = useSchemaStore((state) => state.clearSchema)

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
  const [isConnectionTested, setIsConnectionTested] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const projects = useProjectStore((state) => state.projects)
  const [nameFeedback, setNameFeedback] = useState<string | null>(null)
  const [isNameAvailable, setIsNameAvailable] = useState<boolean>(true)
  const [debouncedProjectName] = useDebounce(formData.projectName, 500)
  const [initialDbConfig, setInitialDbConfig] = useState<{
    dbType: 'MySQL' | 'PostgreSQL'
    host: string
    port: string
    username: string
    password: string
    databaseName: string
  } | null>(null)

  useEffect(() => {
    if (selectedProject && selectedProject.database) {
      const [host, port] = selectedProject.database.url.split(':')
      const dbType: 'MySQL' | 'PostgreSQL' =
        selectedProject.dbms?.name === 'PostgreSQL' ? 'PostgreSQL' : 'MySQL'

      const dbConfig = {
        dbType,
        host,
        port,
        username: selectedProject.database.username,
        password: selectedProject.database.password,
        databaseName: selectedProject.database.database_name
      }

      setFormData({
        projectName: selectedProject.name,
        description: selectedProject.description,
        ...dbConfig
      })

      setInitialDbConfig(dbConfig)
      setSelected(dbType)
      setIsNameAvailable(true)
      setNameFeedback(null)
      setIsConnectionTested(true)
    }
  }, [selectedProject])

  useEffect(() => {
    if (!selectedProject) return

    if (debouncedProjectName.trim() === '') {
      setNameFeedback(null)
      setIsNameAvailable(false)
      return
    }

    if (debouncedProjectName.trim().toLowerCase() === selectedProject.name.trim().toLowerCase()) {
      setNameFeedback(null)
      setIsNameAvailable(true)
      return
    }

    const isDuplicate = projects.some(
      (p) =>
        p.id !== selectedProject.id &&
        p.name.toLowerCase() === debouncedProjectName.trim().toLowerCase()
    )

    if (isDuplicate) {
      setNameFeedback('이미 존재하는 프로젝트명입니다.')
      setIsNameAvailable(false)
    } else {
      setNameFeedback('사용 가능한 프로젝트명입니다.')
      setIsNameAvailable(true)
    }
  }, [debouncedProjectName, projects, selectedProject])

  const validateRequiredFields = (): boolean => {
    const required: [keyof ProjectInfo, string][] = [
      ['projectName', '프로젝트명을 입력해주세요.'],
      ['host', '호스트를 입력해주세요.'],
      ['port', '포트를 입력해주세요.'],
      ['username', '사용자명을 입력해주세요.'],
      ['password', '비밀번호를 입력해주세요.'],
      ['databaseName', '데이터베이스명을 입력해주세요.']
    ]

    for (const [field, message] of required) {
      if (!formData[field].trim()) {
        showToast(message, 'warning', '입력 오류')
        return false
      }
    }
    return true
  }

  const handleConnectionTest = async (): Promise<void> => {
    if (!validateRequiredFields()) return

    setIsTestingConnection(true)

    try {
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
        showToast(result.message, 'error', '연결 실패')
        setIsConnectionTested(false)
      }
    } catch (error) {
      console.error('연결 테스트 중 오류:', error)
      showToast('연결 테스트 중 오류가 발생했습니다.', 'warning', '오류')
      setIsConnectionTested(false)
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleInputChange = (field: keyof ProjectInfo, value: string): void => {
    if (field === 'projectName') {
      setNameFeedback(null)
      setIsNameAvailable(false)
    }

    if (field !== 'projectName' && field !== 'description') {
      setIsConnectionTested(false)
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (): Promise<void> => {
    if (!validateRequiredFields()) return

    const trimmedName = formData.projectName.trim()
    const isDuplicateOnSubmit = projects.some(
      (p) => p.id !== selectedProject?.id && p.name.toLowerCase() === trimmedName.toLowerCase()
    )

    if (isDuplicateOnSubmit) {
      showToast('이미 존재하는 프로젝트명입니다.', 'warning', '입력 오류')
      return
    }

    if (nameFeedback && !isNameAvailable) {
      showToast('프로젝트명을 확인해주세요.', 'warning', '입력 오류')
      return
    }

    if (!selectedProject) {
      showToast('프로젝트 정보를 찾을 수 없습니다.', 'error', '오류')
      return
    }

    const hasDbConfigChanged =
      initialDbConfig &&
      (formData.dbType !== initialDbConfig.dbType ||
        formData.host !== initialDbConfig.host ||
        formData.port !== initialDbConfig.port ||
        formData.username !== initialDbConfig.username ||
        formData.password !== initialDbConfig.password ||
        formData.databaseName !== initialDbConfig.databaseName)

    if (hasDbConfigChanged && !isConnectionTested) {
      showToast('연결 테스트를 먼저 진행해주세요.', 'error', '연결 필요')
      return
    }

    try {
      const updatedProject = await window.api.project.update({
        id: selectedProject.id,
        name: formData.projectName,
        description: formData.description
      })

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

      let updatedDbms = selectedProject.dbms
      if (updatedDatabase) {
        updatedDbms = await window.api.dbms.getById(updatedDatabase.dbms_id)
      }

      if (updatedProject) {
        const updatedProjectWithDetails = {
          ...updatedProject,
          database: updatedDatabase,
          dbms: updatedDbms
        }

        setSelectedProject(updatedProjectWithDetails)
        updateProjectInList(selectedProject.id, updatedProjectWithDetails)

        if (updatedDatabase) {
          clearSchema(updatedDatabase.id)
        }
      }

      navigate(`/main/schema/${selectedProject.id}`)
    } catch (error) {
      console.error(error)
      showToast('프로젝트 정보 저장에 실패했습니다.', 'error', '저장 실패')
    }
  }

  const hasDbConfigChanged =
    initialDbConfig &&
    (formData.dbType !== initialDbConfig.dbType ||
      formData.host !== initialDbConfig.host ||
      formData.port !== initialDbConfig.port ||
      formData.username !== initialDbConfig.username ||
      formData.password !== initialDbConfig.password ||
      formData.databaseName !== initialDbConfig.databaseName)

  const isNextButtonEnabled = !hasDbConfigChanged || isConnectionTested

  return (
    <>
      <style>
        {`
          .info-view-wrapper {
            width: 100%;
            display: flex;
            justify-content: center;
            max-width:700px;
            align-items: center;
          }

          .info-view-container {
            width: 100%;
            margin: 0 auto;
            
          }

          .info-view-header {
            margin-bottom: 14px;
          }

          .info-view-form-container {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .info-view-input-group {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .info-view-dbms-section {
            margin-bottom: 14px;
            font-size: 16px;
            font-weight: 500;
          }

          .info-view-radio-group {
            display: flex;
            gap: 14px;
          }

          .info-view-row-group {
            display: flex;
            gap: 14px;
            width: 100%;
          }

          .info-view-row-group > * {
            flex: 1;
            min-width: 0;
          }

          .info-view-button-container {
            display: flex;
            justify-content: flex-end;
            gap: 14px;
            margin-top: 14px;
          }
        `}
      </style>

      <div className="info-view-wrapper">
        <div className="info-view-container">
          <div className="info-view-header">
            <PageTitle
              title="프로젝트 정보"
              description="데이터베이스 프로젝트의 정보를 확인하고 수정하세요."
            />
          </div>

          <div className="info-view-form-container">
            {/* 프로젝트명 + 설명 */}
            <div className="info-view-input-group">
              <InputField
                title="프로젝트명"
                placeholder="프로젝트명"
                required
                maxLength={50}
                value={formData.projectName}
                width={300}
                onChange={(v) => handleInputChange('projectName', v)}
                description={nameFeedback || ' '}
                descriptionClassName={
                  isNameAvailable ? 'input-success-message' : 'input-error-message'
                }
              />
              <InputField
                title="프로젝트 설명"
                placeholder="프로젝트 설명"
                maxLength={300}
                value={formData.description}
                onChange={(v) => handleInputChange('description', v)}
              />
            </div>

            {/* DBMS 선택 */}
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

            {/* 호스트 + 포트 */}
            <div className="info-view-row-group">
              <InputField
                title="호스트"
                placeholder="127.0.0.1"
                required
                maxLength={100}
                value={formData.host}
                onChange={(v) => handleInputChange('host', v)}
              />
              <InputField
                title="포트"
                placeholder="3306"
                required
                maxLength={10}
                value={formData.port}
                onChange={(v) => handleInputChange('port', v)}
              />
            </div>

            {/* 사용자명 + 비밀번호 */}
            <div className="info-view-row-group">
              <InputField
                title="사용자명"
                placeholder="user"
                required
                maxLength={50}
                value={formData.username}
                onChange={(v) => handleInputChange('username', v)}
              />
              <InputField
                title="비밀번호"
                placeholder="password"
                required
                maxLength={100}
                value={formData.password}
                password
                onChange={(v) => handleInputChange('password', v)}
              />
            </div>

            {/* DB 이름 */}
            <InputField
              title="데이터베이스명"
              placeholder="sakila"
              required
              maxLength={100}
              value={formData.databaseName}
              onChange={(v) => handleInputChange('databaseName', v)}
            />
          </div>

          {/* 하단 버튼 */}
          <div className="info-view-button-container">
            <Button variant="gray" onClick={handleConnectionTest} isLoading={isTestingConnection}>
              연결테스트
            </Button>
            <Button onClick={handleSubmit} disabled={!isNextButtonEnabled}>
              다음
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default InfoView
