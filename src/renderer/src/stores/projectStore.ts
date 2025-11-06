import { create } from 'zustand'
import type { Project, Database, DBMS } from '@main/database/types'

export interface ProjectWithDetails extends Project {
  database?: Database
  dbms?: DBMS
}

interface ProjectState {
  projects: ProjectWithDetails[]
  selectedProject: ProjectWithDetails | null
  currentSelectRequestId: number

  setProjects: (project: ProjectWithDetails[]) => void
  selectProjectById: (projectId: string | number) => Promise<void>
  updateProjectInList: (projectId: number, updatedProject: ProjectWithDetails) => void

  setSelectedProject: (project: ProjectWithDetails | null) => void
  clearSelectedProject: () => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProject: null,
  currentSelectRequestId: 0,

  setProjects: (projects) => set({ projects }),

  selectProjectById: async (projectId) => {
    const idAsNumber = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId
    const project = get().projects.find((p) => p.id === idAsNumber)

    // 요청 순서를 할당
    const requestId = get().currentSelectRequestId + 1
    set({ selectedProject: project || null, currentSelectRequestId: requestId })

    if (project) {
      try {
        const updatedProject = await window.api.project.updateUpdatedAt(idAsNumber)

        // 최신 요청만 처리
        if (updatedProject && get().currentSelectRequestId === requestId) {
          get().updateProjectInList(idAsNumber, { ...project, ...updatedProject })
          set({ selectedProject: { ...project, ...updatedProject } })
        }
      } catch (error) {
        console.error('Failed to update project updated_at timestamp:', error)
      }
    }
  },

  updateProjectInList: (projectId, updatedProject) => {
    const currentProjects = get().projects
    const updatedProjects = currentProjects.map((p) => (p.id === projectId ? updatedProject : p))
    set({ projects: updatedProjects })
  },

  setSelectedProject: (project) => set({ selectedProject: project }),
  clearSelectedProject: () => set({ selectedProject: null })
}))
