import { BOOKS } from '../data/book-metadata';
import type { BookMeta } from '../types/bible';

export interface VerseMatch {
  book: BookMeta;
  chapter?: number;
  verse?: number;
  display: string;
}

const bookAliases: Record<string, string> = {};
for (const book of BOOKS) {
  const names = [
    book.name.toLowerCase(),
    book.abbrev.toLowerCase(),
    book.id,
  ];
  for (const name of names) {
    bookAliases[name] = book.id;
  }
}
bookAliases['genesis'] = 'gen';
bookAliases['dt'] = 'deu';
bookAliases['deut'] = 'deu';
bookAliases['deuteronomy'] = 'deu';
bookAliases['ex'] = 'exo';
bookAliases['exodus'] = 'exo';
bookAliases['lev'] = 'lev';
bookAliases['leviticus'] = 'lev';
bookAliases['num'] = 'num';
bookAliases['numbers'] = 'num';
bookAliases['josh'] = 'jos';
bookAliases['joshua'] = 'jos';
bookAliases['judg'] = 'jdg';
bookAliases['judges'] = 'jdg';
bookAliases['matt'] = 'mat';
bookAliases['matthew'] = 'mat';
bookAliases['mk'] = 'mrk';
bookAliases['mark'] = 'mrk';
bookAliases['lk'] = 'luk';
bookAliases['luke'] = 'luk';
bookAliases['jn'] = 'jhn';
bookAliases['john'] = 'jhn';
bookAliases['acts'] = 'act';
bookAliases['rom'] = 'rom';
bookAliases['romans'] = 'rom';
bookAliases['rev'] = 'rev';
bookAliases['revelation'] = 'rev';
bookAliases['ps'] = 'psa';
bookAliases['psalms'] = 'psa';
bookAliases['psalm'] = 'psa';
bookAliases['prov'] = 'pro';
bookAliases['proverbs'] = 'pro';
bookAliases['isa'] = 'isa';
bookAliases['isaiah'] = 'isa';
bookAliases['jer'] = 'jer';
bookAliases['jeremiah'] = 'jer';
bookAliases['ezek'] = 'ezk';
bookAliases['ezekiel'] = 'ezk';
bookAliases['dan'] = 'dan';
bookAliases['daniel'] = 'dan';

export function parseVerseQuery(query: string): VerseMatch[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const refMatch = q.match(/^(\d?\s*[a-z]+)\s*(\d+)?(?:\s*[:\.]\s*(\d+))?$/);
  if (refMatch) {
    const bookPart = refMatch[1].replace(/\s+/g, ' ').trim();
    const chapterStr = refMatch[2];
    const verseStr = refMatch[3];

    const bookId = bookAliases[bookPart];
    if (bookId) {
      const book = BOOKS.find(b => b.id === bookId)!;
      const chapter = chapterStr ? parseInt(chapterStr, 10) : undefined;
      const verse = verseStr ? parseInt(verseStr, 10) : undefined;

      if (chapter && verse) {
        if (chapter <= book.chapters) {
          const maxVerse = book.verseCounts[chapter - 1];
          if (verse <= maxVerse) {
            return [{
              book, chapter, verse,
              display: `${book.name} ${chapter}:${verse}`,
            }];
          }
        }
        return [];
      }

      if (chapter) {
        if (chapter > book.chapters) return [];
        const maxVerse = book.verseCounts[chapter - 1];
        const results: VerseMatch[] = [];
        for (let v = 1; v <= Math.min(maxVerse, 20); v++) {
          results.push({
            book, chapter, verse: v,
            display: `${book.name} ${chapter}:${v}`,
          });
        }
        if (maxVerse > 20) {
          results.push({
            book, chapter, verse: undefined,
            display: `... ${maxVerse - 20} more verses`,
          });
        }
        return results;
      }

      const results: VerseMatch[] = [];
      for (let ch = 1; ch <= Math.min(book.chapters, 10); ch++) {
        results.push({
          book, chapter: ch, verse: 1,
          display: `${book.name} ${ch}`,
        });
      }
      if (book.chapters > 10) {
        results.push({
          book, chapter: undefined, verse: undefined,
          display: `... ${book.chapters - 10} more chapters`,
        });
      }
      return results;
    }
  }

  const matching = BOOKS.filter(b =>
    b.name.toLowerCase().startsWith(q) ||
    b.abbrev.toLowerCase().startsWith(q) ||
    b.id.startsWith(q)
  );

  return matching.slice(0, 10).map(book => ({
    book,
    chapter: 1,
    verse: 1,
    display: `${book.name}`,
  }));
}
