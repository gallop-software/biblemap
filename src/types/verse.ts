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
  zoom?: number;
  pitch?: number;
  bearing?: number;
  periodId?: string;
}

export interface VerseLocationRoute {
  ref: string;
  type: 'route';
  waypoints: RouteWaypoint[];
  zoom?: number;
  periodId?: string;
}

export interface VerseLocationNull {
  ref: string;
  type: null;
}

export type VerseLocation = VerseLocationPoint | VerseLocationRoute | VerseLocationNull;
