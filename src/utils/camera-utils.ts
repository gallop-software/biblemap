import type { PlaceType } from '../types/place';
import { distance } from '@turf/distance';
import { point } from '@turf/helpers';

interface CameraDefaults {
  zoom: number;
  pitch: number;
  bearing: number;
}

const PLACE_TYPE_DEFAULTS: Record<PlaceType, CameraDefaults> = {
  mountain: { zoom: 12, pitch: 60, bearing: 0 },
  settlement: { zoom: 11, pitch: 45, bearing: 0 },
  region: { zoom: 8, pitch: 30, bearing: 0 },
  desert: { zoom: 8, pitch: 25, bearing: 0 },
  valley: { zoom: 11, pitch: 40, bearing: 0 },
  river: { zoom: 8, pitch: 20, bearing: 0 },
  'body-of-water': { zoom: 9, pitch: 25, bearing: 0 },
  nation: { zoom: 7, pitch: 20, bearing: 0 },
};

export function getCameraDefaults(placeType: PlaceType): CameraDefaults {
  return PLACE_TYPE_DEFAULTS[placeType];
}

export function calculateFlightDuration(
  from: [number, number],
  to: [number, number]
): number {
  const d = distance(point(from), point(to), { units: 'kilometers' });
  if (d < 50) return 1500;
  if (d < 500) return 2500;
  return 4000;
}
