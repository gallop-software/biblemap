import type { VerseRef } from '../types/verse';

export function parseRef(ref: string): VerseRef {
  const parts = ref.split('.');
  const book = parts[0];
  const chapter = parseInt(parts[1], 10);
  const versePart = parts[2];

  const subVerseMatch = versePart.match(/^(\d+)([a-f])$/);
  if (subVerseMatch) {
    return { book, chapter, verse: parseInt(subVerseMatch[1], 10), subVerse: subVerseMatch[2] };
  }

  const rangeMatch = versePart.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    return { book, chapter, verse: parseInt(rangeMatch[1], 10) };
  }

  return { book, chapter, verse: parseInt(versePart, 10) };
}

export function formatRef(ref: VerseRef): string {
  const sub = ref.subVerse ?? '';
  return `${ref.book}.${ref.chapter}.${ref.verse}${sub}`;
}

export function refContainsVerse(ref: string, book: string, chapter: number, verse: number): boolean {
  if (!ref.startsWith(`${book}.${chapter}.`)) return false;

  const versePart = ref.split('.')[2];
  const rangeMatch = versePart.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    return verse >= start && verse <= end;
  }

  const subVerseMatch = versePart.match(/^(\d+)[a-f]$/);
  if (subVerseMatch) {
    return parseInt(subVerseMatch[1], 10) === verse;
  }

  return parseInt(versePart, 10) === verse;
}

export function getVerseNumber(ref: string): number {
  const versePart = ref.split('.')[2];
  return parseInt(versePart, 10);
}
