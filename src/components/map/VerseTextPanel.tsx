import { useEffect, useRef } from 'react';
import { useVerseStore } from '../../stores/verse-store';
import { useUIStore } from '../../stores/ui-store';
import { BOOK_BY_ID } from '../../data/book-metadata';

export function VerseTextPanel() {
  const currentBook = useVerseStore(s => s.currentBook);
  const currentChapter = useVerseStore(s => s.currentChapter);
  const currentVerse = useVerseStore(s => s.currentVerse);
  const chapterText = useVerseStore(s => s.chapterText);
  const setTextPanelOpen = useUIStore(s => s.setTextPanelOpen);
  const scrollRef = useRef<HTMLDivElement>(null);

  const book = BOOK_BY_ID[currentBook];
  const verseCount = book?.verseCounts[currentChapter - 1] ?? 0;
  const verses = Array.from({ length: verseCount }, (_, i) => i + 1);

  useEffect(() => {
    const el = document.getElementById(`verse-text-${currentVerse}`);
    if (el && scrollRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentVerse]);

  return (
    <div className="flex flex-col h-full bg-gray-900/95 md:border-l border-white/10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div>
          <h3 className="text-lg font-semibold text-amber-400">
            {book?.name} {currentChapter}
          </h3>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">
            King James Version
          </div>
        </div>
        <button
          onClick={() => setTextPanelOpen(false)}
          className="md:hidden text-gray-500 hover:text-white p-2 -mr-2"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="4" x2="14" y2="14" />
            <line x1="14" y1="4" x2="4" y2="14" />
          </svg>
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 overscroll-contain" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
        {verses.map(v => {
          const text = chapterText[String(v)];
          const isActive = v === currentVerse;
          return (
            <p
              key={v}
              id={`verse-text-${v}`}
              className={`text-base md:text-lg leading-relaxed transition-colors duration-300 cursor-pointer py-0.5 ${
                isActive
                  ? 'text-white font-medium'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => useVerseStore.getState().setVerse(v)}
            >
              <sup className={`text-xs mr-1.5 ${isActive ? 'text-amber-400 font-bold' : 'text-gray-600'}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                {v}
              </sup>
              {text || '...'}
            </p>
          );
        })}
      </div>
    </div>
  );
}
