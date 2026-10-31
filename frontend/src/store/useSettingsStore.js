import { create } from 'zustand';

export const useSettingsStore = create((set) => ({
  theme: 'dark',
  isSidebarOpen: window.innerWidth >= 1024,
  isInfoRailOpen: false,
  selectedSourceChunk: null,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),

  toggleInfoRail: () => set((state) => ({ isInfoRailOpen: !state.isInfoRailOpen })),
  setInfoRailOpen: (isInfoRailOpen) => set({ isInfoRailOpen }),

  setSelectedSourceChunk: (chunk) => set({ 
    selectedSourceChunk: chunk,
    isInfoRailOpen: chunk ? true : false
  }),
}));
