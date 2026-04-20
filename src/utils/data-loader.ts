import type { VerseLocation } from '../types/verse';
import type { PlaceCatalog } from '../types/place';
import type { HistoricalPeriod } from '../types/period';

const verseCache = new Map<string, VerseLocation[]>();
const textCache = new Map<string, Record<string, Record<string, string>>>();
const boundaryCache = new Map<string, GeoJSON.FeatureCollection>();
const cityCache = new Map<string, GeoJSON.FeatureCollection>();

export async function loadVerseLocations(bookId: string): Promise<VerseLocation[]> {
  const cached = verseCache.get(bookId);
  if (cached) return cached;

  const response = await fetch(`/data/verses/${bookId}.jsonl`);
  const text = await response.text();
  const locations = text
    .trim()
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line) as VerseLocation);

  verseCache.set(bookId, locations);
  return locations;
}

export async function loadPlaces(): Promise<PlaceCatalog> {
  const response = await fetch('/data/places/places.json');
  return response.json();
}

export async function loadBibleText(bookId: string): Promise<Record<string, Record<string, string>>> {
  const cached = textCache.get(bookId);
  if (cached) return cached;

  const response = await fetch(`/data/bible/${bookId}.json`);
  const data = await response.json();
  const chapters = data.chapters as Record<string, Record<string, string>>;
  textCache.set(bookId, chapters);
  return chapters;
}

export async function loadPeriods(): Promise<HistoricalPeriod[]> {
  const response = await fetch('/data/boundaries/periods.json');
  const data = await response.json();
  return data.periods as HistoricalPeriod[];
}

export async function loadBoundaries(folder: string): Promise<GeoJSON.FeatureCollection | null> {
  const cached = boundaryCache.get(folder);
  if (cached) return cached;

  const response = await fetch(`/data/boundaries/${folder}/boundaries.geojson`);
  if (!response.ok) return null;
  const data = await response.json() as GeoJSON.FeatureCollection;
  boundaryCache.set(folder, data);
  return data;
}

export async function loadCities(folder: string): Promise<GeoJSON.FeatureCollection | null> {
  const cached = cityCache.get(folder);
  if (cached) return cached;

  const response = await fetch(`/data/boundaries/${folder}/cities.geojson`);
  if (!response.ok) return null;
  const data = await response.json() as GeoJSON.FeatureCollection;
  cityCache.set(folder, data);
  return data;
}
