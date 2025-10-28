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
    </div>
  )
}
export default MainLayout
