import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaDatabase, FaLink, FaChartBar, FaHistory } from 'react-icons/fa'
import logoIcon from '@renderer/assets/icons/logo.svg'
import { GrUpdate } from 'react-icons/gr'
import { RxDashboard } from 'react-icons/rx'
import { IoSettingsSharp } from 'react-icons/io5'
import { BsLayoutSidebar } from 'react-icons/bs'

interface SidebarProps {
  locked?: boolean
}
const Sidebar: React.FC<SidebarProps> = ({ locked = false }) => {
  const [collapsed, setCollapsed] = useState(locked)
  const toggleSidebar = (): void => {
    if (locked) return
    setCollapsed(!collapsed)
  }

  // locked prop이 변경될 때
  useEffect(() => {
    setCollapsed(locked)
  }, [locked])

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
              onClick={collapsed && !locked ? toggleSidebar : undefined}
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
            <p className="preRegular16 project-label">현재 프로젝트</p>
            <div className="project-box shadow">
              <div className="project-name preSemiBold20">FORINGKOR</div>
              <div className="project-db preLight12">PostgreSQL</div>
            </div>
            <div className="preLight12 project-time">
              <GrUpdate /> {currentTime}
            </div>
          </div>
        </div>
        {/* 메뉴 */}
        <nav className="sidebar-menu">
          <Link to="/main/dashboard" className="sidebar-link">
            <RxDashboard /> 프로젝트 대시보드
          </Link>
          <Link to="/main/info" className="sidebar-link">
            <FaLink /> 프로젝트 정보
          </Link>
          <Link to="/main/dummy" className="sidebar-link">
            <FaDatabase /> 더미데이터 생성
          </Link>
          <Link to="/main/test" className="sidebar-link">
            <FaChartBar /> DB 성능 테스트
          </Link>
          <Link to="/main/history" className="sidebar-link">
            <FaHistory /> 테스트 히스토리
          </Link>
        </nav>
        {/* footer */}
        <div className={`sidebar-footer ${collapsed ? 'footer-collapsed' : ''}`}>
          <IoSettingsSharp size={28} />
        </div>
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
          transition: opacity 0.2s ease-out, max-height 0.3s ease, margin-top 0.3s ease;
          opacity: 1;
          max-height: 500px; /* (충분히 큰 값) */
          overflow: hidden;
        }

        .project-label {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .project-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: var(--color-white);
          color: var(--color-black);
          padding: 16px 8px;
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
          transition: opacity 0.2s ease-out, max-height 0.3s ease, margin-top 0.3s ease;
          opacity: 1;
          max-height: 500px; /* (충분히 큰 값) */
          overflow: hidden;
        }

        .sidebar-link {
          width: 100%;
          height: 48px;
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 0 16px;
          border-radius: 8px;
          color: var(--color-white);
          text-decoration: none;
          transition: all 0.2s;
        }

        .sidebar-link:hover {
          background: var(--color-white);
          color: var(--color-main-blue);
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
          pointer-events: none; /* (숨겨졌을 때 클릭 방지) */
        }
      `}
      </style>
    </>
  )
}

export default Sidebar
