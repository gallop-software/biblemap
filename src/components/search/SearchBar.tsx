import { useRef, useEffect, useState, useMemo } from 'react';
import { useSearchStore, type SearchEntry } from '../../stores/search-store';
import { useVerseStore } from '../../stores/verse-store';
import { useMapStore } from '../../stores/map-store';
import { usePlaces } from '../../hooks/use-places';
import { parseVerseQuery, type VerseMatch } from '../../utils/verse-search';
import { BOOK_BY_ID } from '../../data/book-metadata';

function BookName({ book }: { book: import('../../types/bible').BookMeta }) {
  const abbrev = book.abbrev;
  const name = book.name;
  let boldLen = 0;
  if (name.toLowerCase().startsWith(abbrev.toLowerCase())) {
    boldLen = abbrev.length;
  } else {
    while (boldLen < abbrev.length && boldLen < name.length &&
           abbrev[boldLen].toLowerCase() === name[boldLen].toLowerCase()) {
      boldLen++;
    }
  }
  return <><strong>{name.slice(0, boldLen)}</strong>{name.slice(boldLen)}</>;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const placeResults = useSearchStore(s => s.results);
  const setPlaceQuery = useSearchStore(s => s.setQuery);
  const flyToPlace = useMapStore(s => s.flyToPlace);
  const places = usePlaces();

  const currentBook = useVerseStore(s => s.currentBook);
  const currentChapter = useVerseStore(s => s.currentChapter);
  const currentVerse = useVerseStore(s => s.currentVerse);
  const book = BOOK_BY_ID[currentBook];
  const currentRef = book
    ? `${book.abbrev} ${currentChapter}:${currentVerse}`
    : '';

  const verseMatches = useMemo(() => parseVerseQuery(query), [query]);

  const hasVerseResults = verseMatches.length > 0;
  const hasPlaceResults = placeResults.length > 0;

  type ResultItem =
    | { kind: 'verse'; match: VerseMatch }
    | { kind: 'place'; entry: SearchEntry };

  const allResults = useMemo<ResultItem[]>(() => {
    const items: ResultItem[] = [];
    for (const m of verseMatches) {
      if (m.verse !== undefined) items.push({ kind: 'verse', match: m });
    }
    for (const e of placeResults) {
      items.push({ kind: 'place', entry: e });
    }
    return items;
  }, [verseMatches, placeResults]);

  function handleChange(value: string) {
    setQuery(value);
    setPlaceQuery(value);
    setIsOpen(value.length > 0);
    setSelectedIndex(0);
  }

  function handleSelectVerse(match: VerseMatch) {
    if (match.chapter && match.verse) {
      const store = useVerseStore.getState();
      if (store.currentBook !== match.book.id) {
        store.setBook(match.book.id);
        setTimeout(() => {
          const s = useVerseStore.getState();
          if (match.chapter !== s.currentChapter) s.setChapter(match.chapter!);
          setTimeout(() => {
            useVerseStore.getState().setVerse(match.verse!);
          }, 100);
        }, 100);
      } else if (store.currentChapter !== match.chapter) {
        store.setChapter(match.chapter);
        setTimeout(() => {
          useVerseStore.getState().setVerse(match.verse!);
        }, 100);
      } else {
        store.setVerse(match.verse);
      }
    }
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  }

  function handleSelectPlace(entry: SearchEntry) {
    if (!places) return;
    const place = places[entry.id];
    if (place) {
      flyToPlace(place);
    } else {
      const placeByName = Object.values(places).find(p =>
        p.name.toLowerCase().includes(entry.name.toLowerCase())
      );
      if (placeByName) flyToPlace(placeByName);
    }
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  }

  function handleSelect(item: ResultItem) {
    if (item.kind === 'verse') handleSelectVerse(item.match);
    else handleSelectPlace(item.entry);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(allResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      setQuery('');
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="relative flex-1 md:max-w-lg">
      <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2.5 md:px-3 py-2 md:py-1.5">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 shrink-0">
          <circle cx="6" cy="6" r="4.5" />
          <line x1="9.5" y1="9.5" x2="13" y2="13" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (query) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={currentRef || 'Search...'}
          className="bg-transparent text-base text-white placeholder-gray-500 outline-none w-full"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="text-gray-500 hover:text-gray-300 p-1 text-lg leading-none shrink-0"
          >
            &times;
          </button>
        )}
      </div>

      {isOpen && (hasVerseResults || hasPlaceResults) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-white/10 rounded-lg shadow-2xl z-50 max-h-[60vh] md:max-h-80 overflow-y-auto overscroll-contain"
        >
          {hasVerseResults && (
            <div>
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-800/80 sticky top-0 border-b border-white/5">
                Verses
              </div>
              {verseMatches.map((match, i) => {
                if (match.verse === undefined) {
                  return (
                    <div key={`v-more-${i}`} className="px-3 py-1.5 text-sm text-gray-600 italic">
                      {match.display}
                    </div>
                  );
                }
                const idx = allResults.findIndex(r => r.kind === 'verse' && r.match === match);
                return (
                  <button
                    key={`v-${match.book.id}-${match.chapter}-${match.verse}`}
                    onClick={() => handleSelectVerse(match)}
                    className={`w-full text-left px-3 py-2.5 md:py-1.5 flex items-center gap-2 transition-colors ${
                      idx === selectedIndex
                        ? 'bg-amber-600/30 text-white'
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-amber-500 text-sm font-mono w-5 text-center">{match.verse}</span>
                    <span className="text-base"><BookName book={match.book} /> {match.chapter}:{match.verse}</span>
                  </button>
                );
              })}
            </div>
          )}

          {hasPlaceResults && (
            <div>
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-800/80 sticky top-0 border-b border-white/5">
                Places &amp; Nations
              </div>
              {placeResults.map((entry, i) => {
                const idx = allResults.findIndex(r => r.kind === 'place' && r.entry === entry);
                return (
                  <button
                    key={`p-${entry.id}-${i}`}
                    onClick={() => handleSelectPlace(entry)}
                    className={`w-full text-left px-3 py-2.5 md:py-1.5 flex items-center gap-2 transition-colors ${
                      idx === selectedIndex
                        ? 'bg-amber-600/30 text-white'
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-gray-500 text-sm w-5 text-center">
                      {entry.category === 'nation' ? '\u25B3' : entry.category === 'people' ? '\u263A' : '\u2022'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-base">{entry.name}</span>
                      {entry.altNames.length > 0 && (
                        <span className="text-sm text-gray-500 ml-2">
                          {entry.altNames.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 uppercase shrink-0">{entry.type}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isOpen && !hasVerseResults && !hasPlaceResults && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-white/10 rounded-lg shadow-2xl z-50 p-3">
          <div className="text-sm text-gray-500 text-center">
            No results. Try "Deut 1:1" or "Sinai"
          </div>
        </div>
      )}
    </div>
  );
}
