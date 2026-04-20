import { useVerseStore } from '../../stores/verse-store';
import { BOOK_BY_ID } from '../../data/book-metadata';

export function NavigationControls() {
  const currentBook = useVerseStore(s => s.currentBook);
  const currentChapter = useVerseStore(s => s.currentChapter);
  const currentVerse = useVerseStore(s => s.currentVerse);
  const nextVerse = useVerseStore(s => s.nextVerse);
  const prevVerse = useVerseStore(s => s.prevVerse);

  const book = BOOK_BY_ID[currentBook];
  const ref = `${book?.abbrev ?? currentBook} ${currentChapter}:${currentVerse}`;

  return (
    <div className="flex items-center gap-1 md:gap-3">
      <button
        onClick={prevVerse}
        className="text-white/80 hover:text-white p-2 rounded hover:bg-white/10 transition-colors"
        title="Previous verse (Left arrow)"
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <span className="hidden md:inline text-base font-semibold text-white min-w-[110px] text-center">{ref}</span>
      <button
        onClick={nextVerse}
        className="text-white/80 hover:text-white p-2 rounded hover:bg-white/10 transition-colors"
        title="Next verse (Right arrow)"
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
