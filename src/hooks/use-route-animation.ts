import { useRef, useCallback } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import type { PlaceCatalog, Place } from '../types/place';
import type { VerseLocationRoute } from '../types/verse';
import { along } from '@turf/along';
import { distance } from '@turf/distance';
import { lineString } from '@turf/helpers';

export interface RouteAnimationState {
  points: [number, number][];
  progress: number;
  currentSegment: number;
  waypointLabels: string[];
  isAnimating: boolean;
}

const SPEED_KM_PER_SECOND = 80;
const WAYPOINT_PAUSE_MS = 800;

export function useRouteAnimation() {
  const animationRef = useRef<number | null>(null);
  const stateRef = useRef<RouteAnimationState>({
    points: [],
    progress: 0,
    currentSegment: 0,
    waypointLabels: [],
    isAnimating: false,
  });
  const onUpdateRef = useRef<((state: RouteAnimationState) => void) | null>(null);

  const cancel = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    stateRef.current.isAnimating = false;
  }, []);

  const animate = useCallback((
    route: VerseLocationRoute,
    places: PlaceCatalog,
    mapRef: MapRef,
    onUpdate: (state: RouteAnimationState) => void,
    onComplete: () => void,
  ) => {
    cancel();

    const resolvedWaypoints: Place[] = [];
    for (const wp of route.waypoints) {
      const place = places[wp.placeId];
      if (place) resolvedWaypoints.push(place);
    }

    if (resolvedWaypoints.length < 2) {
      onComplete();
      return;
    }

    const coords: [number, number][] = resolvedWaypoints.map(p => p.coords);
    const line = lineString(coords);
    const totalDistance = distance(
      { type: 'Point', coordinates: coords[0] },
      { type: 'Point', coordinates: coords[coords.length - 1] },
      { units: 'kilometers' }
    );
    const totalDuration = (totalDistance / SPEED_KM_PER_SECOND) * 1000;
    const minDuration = 2000;
    const maxDuration = 6000;
    const duration = Math.max(minDuration, Math.min(maxDuration, totalDuration));

    const waypointLabels = route.waypoints.map(wp => wp.label);

    stateRef.current = {
      points: [coords[0]],
      progress: 0,
      currentSegment: 0,
      waypointLabels,
      isAnimating: true,
    };
    onUpdateRef.current = onUpdate;

    mapRef.flyTo({
      center: coords[0],
      zoom: route.zoom ?? 7,
      pitch: 30,
      bearing: 0,
      duration: 1500,
      essential: true,
    });

    const startTime = performance.now() + 1500;
    let pauseUntil = 0;

    function tick(now: number) {
      if (!stateRef.current.isAnimating) return;

      if (now < startTime) {
        animationRef.current = requestAnimationFrame(tick);
        return;
      }

      if (pauseUntil > 0 && now < pauseUntil) {
        animationRef.current = requestAnimationFrame(tick);
        return;
      }
      pauseUntil = 0;

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentPoint = along(line, progress * totalDistance, { units: 'kilometers' });
      const currentCoords = currentPoint.geometry.coordinates as [number, number];

      const drawnPoints: [number, number][] = [coords[0]];
      let cumulativeDist = 0;
      for (let i = 1; i < coords.length; i++) {
        const segDist = distance(
          { type: 'Point', coordinates: coords[i - 1] },
          { type: 'Point', coordinates: coords[i] },
          { units: 'kilometers' }
        );
        const targetDist = progress * totalDistance;
        if (cumulativeDist + segDist <= targetDist) {
          drawnPoints.push(coords[i]);
          cumulativeDist += segDist;

          if (i > stateRef.current.currentSegment) {
            stateRef.current.currentSegment = i;
            pauseUntil = now + WAYPOINT_PAUSE_MS;
          }
        } else {
          drawnPoints.push(currentCoords);
          break;
        }
      }

      stateRef.current.points = drawnPoints;
      stateRef.current.progress = progress;

      mapRef.easeTo({
        center: currentCoords,
        duration: 50,
        easing: (t: number) => t,
      });

      onUpdateRef.current?.(stateRef.current);

      if (progress >= 1) {
        stateRef.current.isAnimating = false;
        stateRef.current.points = coords;
        onUpdateRef.current?.(stateRef.current);
        onComplete();
        return;
      }

      animationRef.current = requestAnimationFrame(tick);
    }

    animationRef.current = requestAnimationFrame(tick);
  }, [cancel]);

  return { animate, cancel, stateRef };
}
