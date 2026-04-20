import { create } from 'zustand';
import type { MapRef } from 'react-map-gl/maplibre';
import type { Place } from '../types/place';
import { getCameraDefaults, calculateFlightDuration } from '../utils/camera-utils';

interface MapState {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  isAnimating: boolean;
  mapRef: MapRef | null;

  setMapRef: (ref: MapRef | null) => void;
  flyToPlace: (place: Place, overrides?: { zoom?: number; pitch?: number; bearing?: number }) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  center: [35.2, 31.0],
  zoom: 7,
  pitch: 45,
  bearing: 0,
  isAnimating: false,
  mapRef: null,

  setMapRef: (ref) => set({ mapRef: ref }),

  flyToPlace: (place, overrides) => {
    const { mapRef, center } = get();
    if (!mapRef) return;

    const defaults = getCameraDefaults(place.type);
    const zoom = overrides?.zoom ?? defaults.zoom;
    const pitch = overrides?.pitch ?? defaults.pitch;
    const bearing = overrides?.bearing ?? defaults.bearing;
    const duration = calculateFlightDuration(center, place.coords);

    set({ isAnimating: true });

    mapRef.flyTo({
      center: place.coords,
      zoom,
      pitch,
      bearing,
      duration,
      curve: 1.42,
      essential: true,
    });

    setTimeout(() => {
      set({
        center: place.coords,
        zoom,
        pitch,
        bearing,
        isAnimating: false,
      });
    }, duration);
  },
}));
