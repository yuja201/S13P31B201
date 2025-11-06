import { create } from 'zustand'
import type { Project, Database, DBMS } from '@main/database/types'

export interface ProjectWithDetails extends Project {
  database?: Database
  dbms?: DBMS
}

interface ProjectState {
  projects: ProjectWithDetails[]
  selectedProject: ProjectWithDetails | null

  setProjects: (project: ProjectWithDetails[]) => void
  selectProjectById: (projectId: string | number) => Promise<void>
  updateProjectInList: (projectId: number, updatedProject: ProjectWithDetails) => void

  setSelectedProject: (project: ProjectWithDetails | null) => void
  clearSelectedProject: () => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProject: null,

  setProjects: (projects) => set({ projects }),

  selectProjectById: async (projectId) => {
    const idAsNumber = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId
    const project = get().projects.find((p) => p.id === idAsNumber)
    set({ selectedProject: project || null })

    if (project) {
      const updatedProject = await window.api.project.updateAccessedAt(idAsNumber)
      if (updatedProject) {
        get().updateProjectInList(idAsNumber, { ...project, ...updatedProject })
        set({ selectedProject: { ...project, ...updatedProject } })
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
