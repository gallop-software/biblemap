import { create } from 'zustand';

interface UIState {
  textPanelOpen: boolean;
  toggleTextPanel: () => void;
  setTextPanelOpen: (open: boolean) => void;
}

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

export const useUIStore = create<UIState>((set) => ({
  textPanelOpen: !isMobile,
  toggleTextPanel: () => set(s => ({ textPanelOpen: !s.textPanelOpen })),
  setTextPanelOpen: (open) => set({ textPanelOpen: open }),
}));
