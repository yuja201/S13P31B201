// src/renderer/src/components/Sidebar.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { FaDatabase, FaLink, FaChartBar, FaClipboardList, FaHistory, FaCog } from 'react-icons/fa'
import logoIcon from '@renderer/assets/icons/logo.svg'
import { LiaExchangeAltSolid } from 'react-icons/lia'

const Sidebar: React.FC = () => {
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
      <aside className="sidebar">
        <div className="sidebar-header">
          {/* 로고 영역 */}
          <div className="sidebar-logo">
            <img src={logoIcon} alt="Logo" className="logo" />
            <h2 className="preSemiBold24 sidebar-title">Here&apos;s Dummy</h2>
          </div>

          {/* 현재 프로젝트 정보 */}
          <div className="sidebar-project">
            <p className="preRegular16 project-label">
              현재 프로젝트
              <LiaExchangeAltSolid />
            </p>
            <div className="project-box shadow">
              <div className="preSemiBold20">FORINGKOR</div>
              <div className="preLight12">PostgreSQL</div>
            </div>
            <div className="preLight12 project-time">
              <FaHistory style={{ marginRight: '6px' }} />
              {currentTime}
            </div>
          </div>
        </div>
        {/* 네비게이션 메뉴 */}
        <nav className="sidebar-menu">
          <Link to="/main/dashboard" className="sidebar-link">
            <FaClipboardList /> 프로젝트 대시보드
          </Link>
          <Link to="/main/info" className="sidebar-link">
            <FaLink /> 프로젝트 정보
          </Link>
          <Link to="/main/dummy" className="sidebar-link">
            <FaDatabase /> 더미데이터 생성
          </Link>
          <Link to="/main/perf" className="sidebar-link">
            <FaChartBar /> DB 성능 테스트
          </Link>
          <Link to="/main/history" className="sidebar-link">
            <FaHistory /> 테스트 히스토리
          </Link>
        </nav>

        {/* 하단 설정 아이콘 */}
        <div className="sidebar-footer">
          <FaCog size={20} />
        </div>
      </aside>

      <style>
        {`
        .sidebar {
          display: flex;
          flex-direction: column;
          width: 240px;
          background-color: var(--color-main-blue);
          color: white;
          padding: 56px 16px 16px 16px;
          box-sizing: border-box;
          align-items: center;
          gap: 80px
        }
        .sidebar-header{
          display: flex;
          flex-direction: column;
          gap: 40px;
          width:100%
        }
        .sidebar-logo{
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .logo{
          width: 38px
          
        }
        .sidebar-project{
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .project-label{
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .project-box{
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: var(--color-white);
          color: var(--color-black);
          padding: 16px 8px;
          border-radius: 10px;
          width: 100%;
        }
      `}
      </style>
    </>
  )
}

export default Sidebar
