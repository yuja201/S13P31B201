import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LiaExchangeAltSolid } from 'react-icons/lia'
import { FaDatabase, FaLink, FaChartBar, FaHistory } from 'react-icons/fa'
import logoIcon from '@renderer/assets/icons/logo.svg'
import { GrUpdate } from 'react-icons/gr'
import { RxDashboard } from 'react-icons/rx'
// import { IoSettingsSharp } from 'react-icons/io5'
import { BsLayoutSidebar } from 'react-icons/bs'

interface SidebarProps {
  locked?: boolean
  projectName?: string
  dbType?: string
  projectId?: string
}
const Sidebar: React.FC<SidebarProps> = ({ locked = false, projectName, dbType, projectId }) => {
  const [collapsed, setCollapsed] = useState(locked)
  const navigate = useNavigate()

  const toggleSidebar = (): void => {
    if (locked) return
    setCollapsed(!collapsed)
  }

  // --- MainView로 이동하는 함수 ---
  const goToMainView = (): void => {
    navigate('/')
  }

  // locked prop이 변경될 때
  useEffect(() => {
    setCollapsed(locked)
  }, [locked])

  const location = useLocation()

  const currentTime = new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${locked ? 'locked' : ''}`}>
        {' '}
        {/* 헤더 */}
        <div className="sidebar-header">
          <div className="logo-row">
            {/* 로고/아이콘 전환 영역 */}
            <div
              className="logo-hover-wrapper"
              // locked가 아닐 때만 toggleSidebar 실행
              onClick={() => {
                if (collapsed && !locked) toggleSidebar()
                else goToMainView()
              }}
            >
              <img
                src={logoIcon}
                alt="Logo"
                className={`logo ${collapsed ? 'logo-collapsed' : ''}`}
              />
              {/* collapsed이고 locked가 아닐 때만 호버 아이콘 표시 */}
              {collapsed && !locked && (
                <div className="sidebar-hover-icon">
                  <BsLayoutSidebar size={22} />
                </div>
              )}
            </div>

            {/* 펼쳐진 상태일 때 오른쪽 상단 아이콘 */}
            {!collapsed && (
              <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
                <BsLayoutSidebar size={20} />
              </button>
            )}
          </div>

          {/* 프로젝트 정보 */}
          <div className="sidebar-project">
            <div className="project-label-wrapper" onClick={goToMainView}>
              <p className="preRegular16 project-label">
                프로젝트 변경 <LiaExchangeAltSolid size={18} />
              </p>
            </div>
            <div className="project-box shadow">
              <div className="project-name preSemiBold20">{projectName || '선택 안됨'}</div>
              <div className="project-db preLight12">{dbType || '-'}</div>
            </div>
            <div className="preLight12 project-time">
              <GrUpdate /> {currentTime}
            </div>
          </div>
        </div>
        {/* 메뉴 */}
        <nav className="sidebar-menu">
          <NavLink
            to={projectId ? `/main/dashboard/${projectId}` : '#'}
            className={({ isActive }): string =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <RxDashboard size={22} /> 프로젝트 대시보드
          </NavLink>
          <NavLink
            to={projectId ? `/main/info/${projectId}` : '#'}
            className={({ isActive }): string =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <FaLink size={22} /> 프로젝트 정보
          </NavLink>
          <NavLink
            to={projectId ? `/main/dummy/${projectId}` : '#'}
            className={(): string => {
              const isDummyRelated =
                location.pathname.startsWith(`/main/dummy/${projectId}`) ||
                location.pathname.startsWith(`/main/select-method/${projectId}`)
              return `sidebar-link ${isDummyRelated ? 'sidebar-link-active' : ''}`
            }}
          >
            <FaDatabase size={22} /> 더미데이터 생성
          </NavLink>
          <NavLink
            to={projectId ? `/main/test/${projectId}` : '#'}
            className={({ isActive }): string =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <FaChartBar size={22} /> DB 성능 테스트
          </NavLink>
          <NavLink
            to={projectId ? `/main/history/${projectId}` : '#'}
            className={({ isActive }): string =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <FaHistory size={22} /> 테스트 히스토리
          </NavLink>
        </nav>
        {/* footer */}
        {/* <div className={`sidebar-footer ${collapsed ? 'footer-collapsed' : ''}`}>
          <IoSettingsSharp size={24} />
        </div> */}
      </aside>

      <style>
        {`
        .sidebar {
          display: flex;
          flex-direction: column;
          width: 260px;
          background-color: var(--color-main-blue);
          color: white;
          padding: 24px 16px;
          box-sizing: border-box;
          align-items: center;
          transition: width 0.3s ease;
          position: relative;
        }

        .collapsed {
          width: 90px;
        }

        .sidebar-header {
          display: flex;
          flex-direction: column;
          width: 100%;
          padding: 16px;
        }

        /* 로고 줄 */
        .logo-row {
          display: flex;
          justify-content: space-between;
          width: 100%;
          align-items: center;
          min-height: 32px; 
        }
          
        .logo-hover-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .logo {
          width: 26px;
          transition: transform 0.2s ease, opacity 0.25s ease;
        }

       .sidebar.collapsed .logo-hover-wrapper:hover .logo {
          opacity: 0;
        }
       .sidebar-hover-icon {
          position: absolute;
          opacity: 0;
          transition: opacity 0.25s ease;
          color: white;
          z-index: 1;
        }

        .sidebar.collapsed .logo-hover-wrapper:hover .sidebar-hover-icon {
          opacity: 1;
          z-index: 3;
        }

        /* 펼쳐진 상태 오른쪽 상단 토글 아이콘 */
        .sidebar-toggle-btn {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.2s ease;
          display: flex;
          padding: 6px;
        }
        .sidebar-toggle-btn:hover {
          background: rgba(255,255,255,0.1);
        }

        .sidebar-project {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          margin-top: 56px;
          width: 100%;
          transition: opacity 0.2s ease 0.2s, max-height 0.2s ease, margin-top 0.2s ease;
          opacity: 1;
          max-height: 500px; 
          overflow: hidden;
          white-space: nowrap;
        }
        .project-label-wrapper {
          display: flex; 
          justify-content: center; 
          width: 100%; 
          cursor: pointer; 
          padding: 4px 0; 
          border-radius: 4px; 
          transition: background-color 0.2s ease;
        }
        .project-label-wrapper:hover {
        }
        .project-label {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .project-label svg {
          transition: transform 0.3s ease-in-out; 
        }

        .project-label-wrapper:hover .project-label svg {
          transform: rotate(180deg); 
        }
          
        .project-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: var(--color-white);
          color: var(--color-black);
          padding: 16px 0;
          border-radius: 10px;
          width: 100%;
        }

        .project-time {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .sidebar-menu {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 56px; 
          transition: opacity 0.2s ease 0.2s, max-height 0.3s ease, margin-top 0.3s ease;
          opacity: 1;
          overflow: hidden;
          gap: 4px;
          padding: 16px;
          white-space: nowrap;
        }

        .sidebar-link {
          width: 100%;
          height: 48px;
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 0 16px;
          border-radius: 8px;
          color: var(--color-white);
          text-decoration: none;
          transition: all 0.2s;
          font: var(--preRegular16);
        }

        .sidebar-link:hover {
          background: var(--color-white);
          color: var(--color-main-blue);
          font: var(--preRegular16);
        }

        .sidebar-link.sidebar-link-active {
          background: var(--color-white);
          color: var(--color-main-blue);
          font: var(--preSemibold16) ;
        }

        .sidebar-footer {
          width: 100%;
          margin-top: auto;
          display: flex;
          justify-content: start;
          padding: 15px;
          transition: all 0.3s ease;
        }
        /* locked 상태일 때 호버 효과 및 커서 변경 */
        .sidebar.locked .logo-hover-wrapper {
          cursor: default;
        }

        .sidebar.locked .sidebar.collapsed .logo-hover-wrapper:hover .logo {
          opacity: 1; /* locked일 땐 로고가 사라지지 않음 */
        }
        
        .sidebar.locked .sidebar.collapsed .logo-hover-wrapper:hover .sidebar-hover-icon {
          opacity: 0; /* locked일 땐 아이콘이 나타나지 않음 */
        }

        /* --- 접혔을 때 콘텐츠 숨김 처리 --- */
        .sidebar.collapsed .sidebar-project,
        .sidebar.collapsed .sidebar-menu {
          opacity: 0;
          max-height: 0;
          margin-top: 0;
          pointer-events: none; 
        }
      `}
      </style>
    </>
  )
}

export default Sidebar
