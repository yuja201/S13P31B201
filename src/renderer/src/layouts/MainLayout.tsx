import React, { useEffect } from 'react'
import { Outlet, useLocation, useParams } from 'react-router-dom'
import Sidebar from '@renderer/components/Sidebar'
import { useProjectStore } from '@renderer/stores/projectStore'
import { useSchemaStore } from '@renderer/stores/schemaStore'

const MainLayout: React.FC = () => {
  const location = useLocation()
  const { projectId } = useParams<{ projectId: string }>()
  const selectedProject = useProjectStore((state) => state.selectedProject)
  const selectProjectById = useProjectStore((state) => state.selectProjectById)
  const fetchSchema = useSchemaStore((state) => state.fetchSchema)
  const isLocked = location.pathname === '/'
  const showSidebar = location.pathname.startsWith('/main/') // main/*에서만 표시

  useEffect(() => {
    if (projectId) {
      selectProjectById(projectId)
    }
  }, [projectId, selectProjectById])

  useEffect(() => {
    if (!isLocked && selectedProject?.database?.id) {
      const databaseId = selectedProject.database.id
      fetchSchema(databaseId)
    }
  }, [isLocked, selectedProject, fetchSchema])

  return (
    <div className="layout">
      {showSidebar && (
        <Sidebar
          locked={false}
          projectName={selectedProject?.name}
          dbType={selectedProject?.dbms?.name}
          projectId={projectId}
        />
      )}

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
          flex-direction: column;
          flex: 1;
          padding: 80px;
          background-color: var(--color-background);
          overflow-y: auto;
        }
        .content-wrapper {
          display: flex; 
          flex-direction: column;
          flex-grow: 1; 
          width: 100%; 
          max-width: 1040px; 
          height: 865px;
          margin: auto;
        }

       @media (min-width: 1441px) {
          .main-content  {
            margin: auto;
          }
        }
      `}</style>
    </div>
  )
}
export default MainLayout
