import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBox from '@renderer/components/SearchBox'
import Card from '@renderer/components/Card'
import CreateProjectModal from '@renderer/modals/CreateProjectModal'
import { IoFilterOutline } from 'react-icons/io5'

const MainView: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortOption, setSortOption] = useState<'modified' | 'created' | 'name'>('modified')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const navigate = useNavigate()

  const projects = [
    {
      id: 1,
      name: 'FORINGKOR',
      dbType: 'PostgreSQL',
      description: '온라인 쇼핑몰 메일 데이터베이스 성능 테스트 프로젝트',
      host: '127.0.0.1',
      port: 3306,
      username: 'root',
      lastUpdated: '12시간 전'
    },
    {
      id: 2,
      name: 'TripOn',
      dbType: 'MySQL',
      description: '여행 계획 및 후기 공유 서비스',
      host: 'localhost',
      port: 3307,
      username: 'admin',
      lastUpdated: '3시간 전'
    },
    {
      id: 3,
      name: 'Dolfin',
      dbType: 'MariaDB',
      description: 'AI 저축 코치 플랫폼',
      host: '192.168.0.10',
      port: 3306,
      username: 'ssafy',
      lastUpdated: '1일 전'
    },
    {
      id: 4,
      name: 'MiniChoco',
      dbType: 'PostgreSQL',
      description: '미니멀리즘 재판 서비스',
      host: '127.0.0.1',
      port: 3306,
      username: 'root',
      lastUpdated: '2일 전'
    },
    {
      id: 5,
      name: 'HereIsDummy',
      dbType: 'SQLite',
      description: '더미데이터 생성 및 DB 성능 테스트 도구',
      host: '127.0.0.1',
      port: 3306,
      username: 'dummy',
      lastUpdated: '5시간 전'
    }
  ]

  const goToProject = (projectId: number): void => {
    navigate(`/main/dashboard/${projectId}`)
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
        <SearchBox placeholder="프로젝트 검색" height={'50px'} />
      </div>

      {/* 필터 + 카드 컨테이너 */}
      <div className="content-container">
        {/* 필터 버튼 */}
        <div className="filter-section">
          <div className="dropdown-wrapper">
            <button
              className="filter-button preRegular14"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              // onMouseOver/Out 제거
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
                    // onMouseEnter/Leave 제거
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
          {projects.map((project) => (
            <Card key={project.id} {...project} onClick={() => goToProject(project.id)} />
          ))}
        </div>
      </div>

      {/* 플로팅 + 버튼 */}
      <button className="floating-add-button shadow" onClick={() => setIsModalOpen(true)}>
        +
      </button>

      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* 스크롤바 스타일 포함 전체 스타일 */}
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
          align-items: center;
          box-sizing: border-box;
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
          width: 130px;
        }

        .filter-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
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
