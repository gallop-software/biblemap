import { useEffect, useState } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { LineLayerSpecification, CircleLayerSpecification } from 'maplibre-gl';
import type { RouteAnimationState } from '../../hooks/use-route-animation';

interface RouteLayerProps {
  animationState: RouteAnimationState | null;
  fullRouteCoords: [number, number][] | null;
}

const routeLineStyle: LineLayerSpecification = {
  id: 'route-line',
  type: 'line',
  source: 'route-drawn',
  paint: {
    'line-color': '#F59E0B',
    'line-width': 4,
    'line-opacity': 0.9,
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
};

const routeLineBgStyle: LineLayerSpecification = {
  id: 'route-line-bg',
  type: 'line',
  source: 'route-full',
  paint: {
    'line-color': '#F59E0B',
    'line-width': 2,
    'line-opacity': 0.25,
    'line-dasharray': [2, 4],
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
};

const waypointStyle: CircleLayerSpecification = {
  id: 'route-waypoints',
  type: 'circle',
  source: 'route-waypoints',
  paint: {
    'circle-radius': 6,
    'circle-color': '#F59E0B',
    'circle-stroke-color': '#FFFFFF',
    'circle-stroke-width': 2,
  },
};

export function RouteLayer({ animationState, fullRouteCoords }: RouteLayerProps) {
  const [drawnGeoJSON, setDrawnGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [fullGeoJSON, setFullGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [waypointGeoJSON, setWaypointGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    if (!fullRouteCoords || fullRouteCoords.length < 2) {
      setFullGeoJSON(null);
      setWaypointGeoJSON(null);
      setDrawnGeoJSON(null);
      return;
    }

    setFullGeoJSON({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: fullRouteCoords },
      }],
    });

    setWaypointGeoJSON({
      type: 'FeatureCollection',
      features: fullRouteCoords.map(coord => ({
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'Point' as const, coordinates: coord },
      })),
    });
  }, [fullRouteCoords]);

  useEffect(() => {
    if (!animationState || animationState.points.length < 2) {
      if (!fullRouteCoords) setDrawnGeoJSON(null);
      return;
    }

    setDrawnGeoJSON({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: animationState.points },
      }],
    });
  }, [animationState, fullRouteCoords]);

  if (!fullGeoJSON) return null;

  return (
    <>
      <Source id="route-full" type="geojson" data={fullGeoJSON}>
        <Layer {...routeLineBgStyle} />
      </Source>
      {drawnGeoJSON && (
        <Source id="route-drawn" type="geojson" data={drawnGeoJSON}>
          <Layer {...routeLineStyle} />
        </Source>
      )}
      {waypointGeoJSON && (
        <Source id="route-waypoints" type="geojson" data={waypointGeoJSON}>
          <Layer {...waypointStyle} />
        </Source>
      )}
    </>
  );
}
