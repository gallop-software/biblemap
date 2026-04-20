export type PlaceType =
  | 'settlement'
  | 'mountain'
  | 'region'
  | 'body-of-water'
  | 'river'
  | 'desert'
  | 'valley'
  | 'nation';

export interface Place {
  id: string;
  name: string;
  altNames: string[];
  type: PlaceType;
  coords: [number, number]; // [lng, lat]
  modernName?: string;
  description?: string;
  searchTerms: string[];
}

export type PlaceCatalog = Record<string, Place>;
