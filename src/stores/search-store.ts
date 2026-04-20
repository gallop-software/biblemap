import { create } from 'zustand';
import Fuse from 'fuse.js';

export interface SearchEntry {
  id: string;
  name: string;
  altNames: string[];
  type: string;
  category: 'place' | 'nation' | 'people';
}

interface SearchState {
  query: string;
  results: SearchEntry[];
  isOpen: boolean;
  fuse: Fuse<SearchEntry> | null;

  initSearch: () => Promise<void>;
  setQuery: (query: string) => void;
  clearSearch: () => void;
  setOpen: (open: boolean) => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  isOpen: false,
  fuse: null,

  initSearch: async () => {
    const response = await fetch('/data/places/search-index.json');
    const data = (await response.json()) as SearchEntry[];
    const fuse = new Fuse(data, {
      keys: [
        { name: 'name', weight: 2.0 },
        { name: 'altNames', weight: 1.5 },
        { name: 'type', weight: 0.5 },
      ],
      threshold: 0.35,
      includeScore: true,
    });
    set({ fuse });
  },

  setQuery: (query: string) => {
    const { fuse } = get();
    if (!fuse || !query.trim()) {
      set({ query, results: [], isOpen: query.length > 0 });
      return;
    }
    const results = fuse.search(query, { limit: 10 }).map(r => r.item);
    set({ query, results, isOpen: true });
  },

  clearSearch: () => set({ query: '', results: [], isOpen: false }),
  setOpen: (open: boolean) => set({ isOpen: open }),
}));
