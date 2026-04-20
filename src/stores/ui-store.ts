import { create } from 'zustand';

interface UIState {
  textPanelOpen: boolean;
  toggleTextPanel: () => void;
  setTextPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  textPanelOpen: true,
  toggleTextPanel: () => set(s => ({ textPanelOpen: !s.textPanelOpen })),
  setTextPanelOpen: (open) => set({ textPanelOpen: open }),
}));
