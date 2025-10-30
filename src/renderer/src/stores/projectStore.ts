import { create } from 'zustand'
import type { Project, Database, DBMS } from '../../../main/database/types'

export interface ProjectWithDetails extends Project {
  database?: Database
  dbms?: DBMS
}

interface ProjectState {
  selectedProject: ProjectWithDetails | null
  setSelectedProject: (project: ProjectWithDetails | null) => void
  clearSelectedProject: () => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  selectedProject: null,
  setSelectedProject: (project) => set({ selectedProject: project }),
  clearSelectedProject: () => set({ selectedProject: null })
}))
