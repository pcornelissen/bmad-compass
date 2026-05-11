import { create } from 'zustand';
import type { DashboardState } from '../shared/types.js';

export interface UiState {
  selectedWorkflowId: string | null;
  previewArtifactPath: string | null;
  previewContent: string | null;
  wsOnline: boolean;
}

export interface AppStore {
  data: DashboardState | null;
  ui: UiState;
  setData: (state: DashboardState) => void;
  selectWorkflow: (id: string | null) => void;
  openPreview: (path: string, content: string) => void;
  closePreview: () => void;
  setWsOnline: (online: boolean) => void;
}

export const useStore = create<AppStore>((set) => ({
  data: null,
  ui: { selectedWorkflowId: null, previewArtifactPath: null, previewContent: null, wsOnline: false },
  setData: (state) => set({ data: state }),
  selectWorkflow: (id) => set(s => ({ ui: { ...s.ui, selectedWorkflowId: id } })),
  openPreview: (path, content) => set(s => ({ ui: { ...s.ui, previewArtifactPath: path, previewContent: content } })),
  closePreview: () => set(s => ({ ui: { ...s.ui, previewArtifactPath: null, previewContent: null } })),
  setWsOnline: (online) => set(s => ({ ui: { ...s.ui, wsOnline: online } })),
}));
