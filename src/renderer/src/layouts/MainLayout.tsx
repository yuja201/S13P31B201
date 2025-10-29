import React, { useState, useEffect } from 'react'
import { Outlet, useLocation, useParams } from 'react-router-dom'
import Sidebar from '@renderer/components/Sidebar'

// --- 임시 프로젝트 데이터  ---
const projectsData = [
  { id: '1', name: 'FORINGKOR', dbType: 'PostgreSQL' /*...*/ },
  { id: '2', name: 'TripOn', dbType: 'MySQL' /*...*/ },
  { id: '3', name: 'Dolfin', dbType: 'MariaDB' /*...*/ },
  { id: '4', name: 'MiniChoco', dbType: 'PostgreSQL' /*...*/ },
  { id: '5', name: 'HereIsDummy', dbType: 'SQLite' /*...*/ }
]

const MainLayout: React.FC = () => {
  const location = useLocation()
  const params = useParams<{ projectId: string }>()
  const [currentProject, setCurrentProject] = useState<{ name: string; dbType: string } | null>(
    null
  )
  const isLocked = location.pathname === '/'

  useEffect(() => {
    if (params.projectId) {
      // projectId에 해당하는 프로젝트 정보 찾기
      const foundProject = projectsData.find((p) => p.id === params.projectId)
      if (foundProject) {
        setCurrentProject({ name: foundProject.name, dbType: foundProject.dbType })
      } else {
        setCurrentProject(null)
      }
    } else {
      setCurrentProject(null)
    }
  }, [params.projectId])

  return (
    <div className="layout">
      <Sidebar
        locked={isLocked}
        projectName={currentProject?.name}
        dbType={currentProject?.dbType}
      />
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
