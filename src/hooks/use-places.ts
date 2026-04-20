import { useState, useEffect } from 'react';
import type { PlaceCatalog } from '../types/place';
import { loadPlaces } from '../utils/data-loader';

let placesCache: PlaceCatalog | null = null;

export function usePlaces(): PlaceCatalog | null {
  const [places, setPlaces] = useState<PlaceCatalog | null>(placesCache);

  useEffect(() => {
    if (placesCache) return;
    loadPlaces().then(data => {
      placesCache = data;
      setPlaces(data);
    });
  }, []);

  return places;
}
