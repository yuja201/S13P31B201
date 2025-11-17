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
  const refreshSchema = useSchemaStore((state) => state.refreshSchema)
  const isLocked = location.pathname === '/' || location.pathname === '/error'

  useEffect(() => {
    if (projectId) {
      ; (async () => {
        try {
          await selectProjectById(projectId)
        } catch (error) {
          console.error('Failed to select project:', error)
        }
      })()
    }
  }, [projectId, selectProjectById])

  useEffect(() => {
    if (!isLocked && selectedProject?.database?.id) {
      const databaseId = selectedProject.database.id
      refreshSchema(databaseId)
    }
  }, [isLocked, selectedProject, refreshSchema])

  return (
    <div className="layout">
      <Sidebar
        locked={isLocked}
        projectName={selectedProject?.name}
        dbType={selectedProject?.dbms?.name}
        projectId={projectId}
      />
      <main className="main-content">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>

      <style>{`
      .layout {
        display: flex;
        min-height: 100vh;
        background-color: var(--color-background);
        
      }
      @media (min-width: 1620px) {
        .layout {
          justify-content: center;
        }
      }

      /* 사이드바 */
      .layout > :first-child {
        position: sticky;
        top: 0;
        left: 0;
        height: 100vh;
        flex-shrink: 0;
        transition: width 0.3s ease;
        z-index: 10;
      }

      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        background-color: var(--color-background);
        padding: 80px;
        min-width: 1180px;
      }

      @media (min-height: 1000px) {
        .main-content {
          padding: 120px 80px;
        }
      }

      @media (max-width: 768px) {
        .main-content {
          padding: 40px 20px;
        }
      }

      .content-wrapper {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        width: 100%;
        max-width: 1040px;
        margin: auto;
        min-height: 100%;
      }
    `}</style>
    </div>
  )
}

export default MainLayout
