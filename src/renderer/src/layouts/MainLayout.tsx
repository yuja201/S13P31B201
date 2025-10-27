import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '@renderer/components/Sidebar'

const MainLayout: React.FC = () => {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default MainLayout
