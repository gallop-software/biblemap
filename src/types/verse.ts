export interface VerseRef {
  book: string;
  chapter: number;
  verse: number;
  subVerse?: string;
}

export interface RouteWaypoint {
  placeId: string;
  label: string;
}

export interface VerseLocationPoint {
  ref: string;
  type: 'point';
  placeId: string;
  label: string;
  zoom?: number;
  pitch?: number;
  bearing?: number;
}

export interface VerseLocationRoute {
  ref: string;
  type: 'route';
  waypoints: RouteWaypoint[];
  label: string;
  zoom?: number;
}

export interface VerseLocationNull {
  ref: string;
  type: null;
  label?: string;
}

export type VerseLocation = VerseLocationPoint | VerseLocationRoute | VerseLocationNull;
