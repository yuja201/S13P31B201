import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '@renderer/components/Sidebar'

const MainLayout: React.FC = () => {
  const location = useLocation()

  const isLocked = location.pathname === '/'

  return (
    <div className="layout">
      <Sidebar locked={isLocked} />
      <main className="main-content">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>

      <style>{`
        .layout {
          display: flex;
          height: 100vh;
          background-color: var(--color-background);
        }
        .main-content {
          display: flex;
          flex: 1;
          padding: 80px;
          background-color: var(--color-background);
          overflow-y: auto;
          justify-content: center; 
          align-items: center;
        }
        .content-wrapper {
          display: flex; 
          flex-direction: column;
          flex-grow: 1;
          justify-content: center; 
          align-items: center;

        }
      `}</style>
    </div>
  )
}
export default MainLayout
