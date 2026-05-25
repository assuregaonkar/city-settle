import { create } from 'zustand';

interface CompareState {
  ids: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  ids: [],
  add: (id) =>
    set((s) => (s.ids.includes(id) || s.ids.length >= 3 ? s : { ids: [...s.ids, id] })),
  remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
  toggle: (id) => (get().ids.includes(id) ? get().remove(id) : get().add(id)),
  clear: () => set({ ids: [] }),
}));
