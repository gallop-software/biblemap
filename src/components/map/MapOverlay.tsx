import { useVerseStore } from '../../stores/verse-store';
import { BOOK_BY_ID } from '../../data/book-metadata';

export function MapOverlay() {
  const currentLocation = useVerseStore(s => s.currentLocation);
  const currentBook = useVerseStore(s => s.currentBook);
  const currentChapter = useVerseStore(s => s.currentChapter);
  const currentVerse = useVerseStore(s => s.currentVerse);

  if (!currentLocation || currentLocation.type === null) return null;

  const book = BOOK_BY_ID[currentBook];
  const ref = `${book?.abbrev ?? currentBook} ${currentChapter}:${currentVerse}`;

  return (
    <div className="absolute bottom-14 md:bottom-4 left-2 right-2 md:left-1/2 md:right-auto md:-translate-x-1/2 pointer-events-none z-10">
      <div className="bg-black/70 backdrop-blur-sm text-white px-4 md:px-5 py-2.5 md:py-3 rounded-xl shadow-2xl pointer-events-auto max-w-md md:max-w-none mx-auto md:mx-0">
        <div className="text-xs md:text-sm font-medium text-amber-300">{ref}</div>
        <div className="text-sm md:text-base font-semibold">{currentLocation.label}</div>
      </div>
    </div>
  );
}
