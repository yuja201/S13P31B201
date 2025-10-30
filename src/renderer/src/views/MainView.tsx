import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBox from '@renderer/components/SearchBox'
import Card from '@renderer/components/Card'
import CreateProjectModal from '@renderer/modals/CreateProjectModal'
import { IoFilterOutline } from 'react-icons/io5'
import { formatRelativeTime } from '@renderer/utils/timeFormat'

interface ProjectInfo {
  id: number
  name: string
  dbType: string
  description: string
  host: string
  port: number
  username: string
  lastUpdated: string
  created_at: number
  updated_at: number
}

const MainView: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortOption, setSortOption] = useState<'modified' | 'created' | 'name'>('modified')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  // 프로젝트 목록 로드
  const loadProjects = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const projectList = await window.api.project.getAll()
      const dbmsList = await window.api.dbms.getAll()

      const projectsWithDB = await Promise.all(
        projectList.map(async (project) => {
          const databases = await window.api.database.getByProjectId(project.id)
          const database = databases[0] // 첫 번째 DB 연결 정보 사용
          const dbms = dbmsList.find((d) => d.id === database.dbms_id)
          const [host, port] = database.url.split(':')

          return {
            id: project.id,
            name: project.name,
            dbType: dbms?.name || '정보없음',
            description: project.description,
            host: host,
            port: parseInt(port) || 0,
            username: database.username,
            lastUpdated: formatRelativeTime(project.updated_at),
            created_at: project.created_at,
            updated_at: project.updated_at
          }
        })
      )

      setProjects(projectsWithDB)
    } catch (error) {
      console.error('프로젝트 로드 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 컴포넌트 마운트 시 프로젝트 로드
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // 필터링된 프로젝트 목록
  const filteredProjects = projects
    .filter((project) => {
      if (!searchQuery) return true
      return project.name.toLowerCase().includes(searchQuery.toLowerCase())
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'created':
          return b.created_at - a.created_at
        case 'name':
          return a.name.localeCompare(b.name)
        case 'modified':
        default:
          return b.updated_at - a.updated_at
      }
    })

  const goToProject = (projectId: number): void => {
    navigate(`/main/dashboard/${projectId}`)
  }

  const handleSearch = (value: string): void => {
    setSearchQuery(value)
  }

  const handleSortChange = (option: 'modified' | 'created' | 'name'): void => {
    setSortOption(option)
    setIsDropdownOpen(false)
  }

  const getSortLabel = (): string => {
    return sortOption === 'created' ? '생성일순' : sortOption === 'name' ? '이름순' : '수정일순'
  }

  return (
    <div className="main-view-container">
      {/* 타이틀 */}
      <div className="title-section">
        <h2 className="title-heading preBold32">프로젝트를 선택하세요</h2>
        <p className="title-description preLight20">
          작업할 데이터베이스 프로젝트를 선택하거나 새로 만드세요
        </p>
      </div>

      {/* 검색창 */}
      <div className="search-section">
        <SearchBox placeholder="프로젝트 검색" height={'50px'} onSearch={handleSearch} />
      </div>

      {/* 필터 + 카드 컨테이너 */}
      <div className="content-container">
        {/* 필터 버튼 */}
        <div className="filter-section">
          <div className="dropdown-wrapper">
            <button
              className="filter-button preRegular14"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <IoFilterOutline size={18} style={{ marginRight: '6px' }} />
              <span>{getSortLabel()}</span>
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu shadow">
                {[
                  { key: 'modified', label: '수정일순' },
                  { key: 'created', label: '생성일순' },
                  { key: 'name', label: '이름순' }
                ].map((option) => (
                  <div
                    key={option.key}
                    className={`dropdown-item preRegular14 ${
                      sortOption === option.key ? 'active' : ''
                    }`}
                    onClick={() => handleSortChange(option.key as 'modified' | 'created' | 'name')}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 카드 리스트 */}
        <div className="card-list-grid">
          {loading ? (
            <div className="empty-state">
              <p className="empty-state-title">로딩 중...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">
                {searchQuery
                  ? `"${searchQuery}"에 대한 검색 결과가 없습니다.`
                  : '아직 생성된 프로젝트가 없습니다.'}
              </p>
              {!searchQuery && (
                <p className="empty-state-description">
                  우측 하단의 + 버튼을 눌러 프로젝트를 생성하세요.
                </p>
              )}
            </div>
          ) : (
            filteredProjects.map((project) => (
              <Card key={project.id} {...project} onClick={() => goToProject(project.id)} />
            ))
          )}
        </div>
      </div>

      {/* 플로팅 + 버튼 */}
      <button className="floating-add-button shadow" onClick={() => setIsModalOpen(true)}>
        +
      </button>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={() => {
          loadProjects()
        }}
      />

      <style>{`
        .main-view-container {
          display: flex;
          flex-direction: column;
          padding: 40px 64px;
          height: auto;
          overflow: visible;
          box-sizing: border-box;
          width: 100%;
        }

        .title-section {
          text-align: center;
          margin-bottom: 20px;
        }
        .title-heading {
          color: var(--color-main-blue);
        }
        .title-description {
          color: var(--color-dark-gray);
        }

        .search-section {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .content-container {
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          align-items: center;
        }

        .filter-section {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          margin-bottom: 16px;
          max-width: 1232px; 
        }

        .dropdown-wrapper {
          position: relative;
        }

        .filter-button {
          display: flex;
          align-items: center;
          background-color: var(--color-white);
          border: none;
          border-radius: 12px;
          box-shadow: var(--shadow);
          padding: 10px 16px;
          cursor: pointer;
          color: var(--color-dark-gray);
          transition: transform 0.2s ease, box-shadow 0.2s ease; 
        }
        .filter-button:hover {
          transform: scale(1.03);
          box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.15);
        }

        .dropdown-menu {
          position: absolute;
          top: 48px; 
          left: 0;
          width: 100%;
          background-color: var(--color-white);
          border-radius: 12px;
          padding: 8px 0;
          z-index: 10;
        }

        .dropdown-item {
          padding: 10px 16px;
          cursor: pointer;
          background-color: transparent;
          color: var(--color-dark-gray);
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .dropdown-item:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        .dropdown-item.active {
          background-color: rgba(0, 0, 0, 0.05);
          color: var(--color-main-blue);
        }

        .card-list-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          justify-content: center; 
          gap: 16px;
          width: 100%;
          box-sizing: border-box;
          padding-bottom: 80px; 
          width: 100%;
          max-width: 1232px;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px;
          color: var(--color-dark-gray);
        }
        .empty-state-title {
          font-size: 18px;
          margin-bottom: 12px;
        }
        .empty-state-description {
          font-size: 14px;
        }

        .floating-add-button {
          position: fixed;
          bottom: 40px;
          right: 40px;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: none;
          background-color: var(--color-orange);
          color: #fff;
          font-size: 32px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .floating-add-button:hover {
          transform: scale(1.08);
          box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
        }

        /* 스크롤바 스타일 */
        html, body { overflow-y: auto; }
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 999px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  )
}

export default MainView
