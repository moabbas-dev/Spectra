import { create } from 'zustand';
import type { WorkspaceRow } from '@shared/ipc-payloads';

interface WorkspaceState {
  workspaces: WorkspaceRow[];
  activeWorkspaceId: string | null;
  setWorkspaces: (rows: WorkspaceRow[]) => void;
  setActiveWorkspaceId: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  activeWorkspaceId: null,
  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspaceId: (activeWorkspaceId) => set({ activeWorkspaceId }),
}));
