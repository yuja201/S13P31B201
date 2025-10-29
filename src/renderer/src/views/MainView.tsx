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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 64px',
        height: 'auto',
        overflow: 'visible',
        boxSizing: 'border-box'
      }}
    >
      {/* 타이틀 */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 className="preBold32" style={{ color: 'var(--color-main-blue)' }}>
          프로젝트를 선택하세요
        </h2>
        <p className="preLight20" style={{ color: 'var(--color-dark-gray)' }}>
          작업할 데이터베이스 프로젝트를 선택하거나 새로 만드세요
        </p>
      </div>

      {/* 검색창 */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <SearchBox placeholder="프로젝트 검색" height={'50px'} />
      </div>

      {/* 필터 + 카드 컨테이너 */}
      <div
        style={{
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}
      >
        {/* 필터 버튼 */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '16px',
            maxWidth: '1232px'
          }}
        >
          <div style={{ position: 'relative', width: '130px' }}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--color-white)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: 'var(--shadow)',
                padding: '10px 16px',
                cursor: 'pointer',
                color: 'var(--color-dark-gray)',
                transition: 'all 0.2s ease'
              }}
            >
              <IoFilterOutline size={18} style={{ marginRight: '6px' }} />
              <span>{getSortLabel()}</span>
            </button>

            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '48px',
                  left: 0,
                  width: '100%',
                  backgroundColor: 'var(--color-white)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow)',
                  padding: '8px 0',
                  zIndex: 10
                }}
              >
                {[
                  { key: 'modified', label: '수정일순' },
                  { key: 'created', label: '생성일순' },
                  { key: 'name', label: '이름순' }
                ].map((option) => (
                  <div
                    key={option.key}
                    onClick={() => handleSortChange(option.key as 'modified' | 'created' | 'name')}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        sortOption === option.key ? 'rgba(0, 0, 0, 0.05)' : 'transparent')
                    }
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      backgroundColor:
                        sortOption === option.key ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                      color:
                        sortOption === option.key
                          ? 'var(--color-main-blue)'
                          : 'var(--color-dark-gray)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 카드 리스트 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 400px)',
            justifyContent: 'center',
            gap: '16px',
            width: '100%',
            boxSizing: 'border-box',
            paddingBottom: '80px'
          }}
        >
          {projects.map((project) => (
            <Card key={project.id} {...project} onClick={() => goToProject(project.id)} />
          ))}
        </div>
      </div>

      {/* 플로팅 + 버튼 */}
      <button
        onClick={() => setIsModalOpen(true)}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        style={{
          position: 'fixed',
          bottom: 40,
          right: 40,
          width: 64,
          height: 64,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'var(--color-orange)',
          color: '#fff',
          fontSize: 32,
          boxShadow: 'var(--shadow)',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        +
      </button>

      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* 스크롤바 스타일 */}
      <style>
        {`
          html, body { overflow-y: auto; }
          ::-webkit-scrollbar { width: 10px; }
          ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 999px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
          ::-webkit-scrollbar-track { background: transparent; }
        `}
      </style>
    </div>
  )
}

export default MainView
