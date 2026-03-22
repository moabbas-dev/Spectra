import { create } from 'zustand';
import type { ProjectRow } from '@shared/ipc-payloads';

interface ProjectsState {
  projects: ProjectRow[];
  selectedProjectId: string | null;
  treeRevision: number;
  setProjects: (rows: ProjectRow[]) => void;
  setSelectedProjectId: (id: string | null) => void;
  bumpTree: () => void;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  selectedProjectId: null,
  treeRevision: 0,
  setProjects: (projects) => set({ projects }),
  setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
  bumpTree: () => set((s) => ({ treeRevision: s.treeRevision + 1 })),
}));
