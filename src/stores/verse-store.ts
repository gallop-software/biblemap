import { create } from 'zustand';
import type { VerseLocation } from '../types/verse';
import { BOOK_BY_ID } from '../data/book-metadata';
import { loadVerseLocations, loadBibleText } from '../utils/data-loader';
import { refContainsVerse } from '../utils/verse-parser';

interface VerseState {
  currentBook: string;
  currentChapter: number;
  currentVerse: number;
  currentLocation: VerseLocation | null;
  chapterLocations: VerseLocation[];
  chapterText: Record<string, string>;
  isLoading: boolean;

  setBook: (bookId: string) => void;
  setChapter: (chapter: number) => void;
  setVerse: (verse: number) => void;
  nextVerse: () => void;
  prevVerse: () => void;
  nextChapter: () => void;
  prevChapter: () => void;
  loadChapterData: () => Promise<void>;
}

function resolveLocation(
  locations: VerseLocation[],
  book: string,
  chapter: number,
  verse: number
): VerseLocation | null {
  for (const loc of locations) {
    if (refContainsVerse(loc.ref, book, chapter, verse)) {
      return loc;
    }
  }
  return null;
}

export const useVerseStore = create<VerseState>((set, get) => ({
  currentBook: 'isa',
  currentChapter: 26,
  currentVerse: 1,
  currentLocation: null,
  chapterLocations: [],
  chapterText: {},
  isLoading: false,

  setBook: (bookId: string) => {
    set({ currentBook: bookId, currentChapter: 1, currentVerse: 1, chapterLocations: [], chapterText: {} });
    get().loadChapterData();
  },

  setChapter: (chapter: number) => {
    set({ currentChapter: chapter, currentVerse: 1 });
    get().loadChapterData();
  },

  setVerse: (verse: number) => {
    const { chapterLocations, currentBook, currentChapter } = get();
    const location = resolveLocation(chapterLocations, currentBook, currentChapter, verse);
    set({ currentVerse: verse, currentLocation: location });
  },

  nextVerse: () => {
    const { currentVerse, currentBook, currentChapter } = get();
    const book = BOOK_BY_ID[currentBook];
    if (!book) return;
    const maxVerse = book.verseCounts[currentChapter - 1];
    if (currentVerse < maxVerse) {
      get().setVerse(currentVerse + 1);
    } else if (currentChapter < book.chapters) {
      set({ currentChapter: currentChapter + 1, currentVerse: 1 });
      get().loadChapterData();
    }
  },

  prevVerse: () => {
    const { currentVerse, currentBook, currentChapter } = get();
    if (currentVerse > 1) {
      get().setVerse(currentVerse - 1);
    } else if (currentChapter > 1) {
      const book = BOOK_BY_ID[currentBook];
      if (!book) return;
      const prevChapter = currentChapter - 1;
      const maxVerse = book.verseCounts[prevChapter - 1];
      set({ currentChapter: prevChapter, currentVerse: maxVerse });
      get().loadChapterData();
    }
  },

  nextChapter: () => {
    const { currentBook, currentChapter } = get();
    const book = BOOK_BY_ID[currentBook];
    if (!book) return;
    if (currentChapter < book.chapters) {
      set({ currentChapter: currentChapter + 1, currentVerse: 1 });
      get().loadChapterData();
    }
  },

  prevChapter: () => {
    const { currentChapter } = get();
    if (currentChapter > 1) {
      set({ currentChapter: currentChapter - 1, currentVerse: 1 });
      get().loadChapterData();
    }
  },

  loadChapterData: async () => {
    const { currentBook, currentChapter, currentVerse } = get();
    set({ isLoading: true });

    try {
      const [allLocations, chapters] = await Promise.all([
        loadVerseLocations(currentBook),
        loadBibleText(currentBook),
      ]);

      const chapterStr = String(currentChapter);
      const chapterLocations = allLocations.filter(loc => {
        const parts = loc.ref.split('.');
        return parts[1] === chapterStr;
      });

      const chapterText = chapters[chapterStr] || {};
      const location = resolveLocation(chapterLocations, currentBook, currentChapter, currentVerse);

      set({ chapterLocations, chapterText, currentLocation: location, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
