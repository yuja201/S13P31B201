import React from 'react'
import { Link } from 'react-router-dom'

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <h2 className="preSemiBold24" style={{ marginBottom: '40px' }}>
        Here&apos;s Dummy
      </h2>
      <nav className="sidebar-nav">
        <Link to="/main" className="sidebar-link">
          홈
        </Link>
        <Link to="/main/settings" className="sidebar-link">
          설정
        </Link>
      </nav>
    </aside>
  )
}

export default Sidebar
