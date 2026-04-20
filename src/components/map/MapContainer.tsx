import { useRef, useCallback } from 'react';
import Map, { type MapRef, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { useMapStore } from '../../stores/map-store';
import { LocationMarker } from './LocationMarker';
import { MapOverlay } from './MapOverlay';
import { RouteLayer } from './RouteLayer';
import { BoundaryLayer } from './BoundaryLayer';
import { CitiesLayer } from './CitiesLayer';
import type { StyleSpecification } from 'maplibre-gl';
import type { RouteAnimationState } from '../../hooks/use-route-animation';

const MAP_STYLE: StyleSpecification = {
  version: 8,
  name: 'BibleMap Satellite',
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri',
      maxzoom: 18,
    },
    'terrain-dem': {
      type: 'raster-dem',
      tiles: [
        'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      encoding: 'terrarium',
    },
  },
  terrain: {
    source: 'terrain-dem',
    exaggeration: 1.5,
  },
  sky: {
    'sky-color': '#87CEEB',
    'horizon-color': '#B0C4DE',
    'fog-color': '#E8DCC8',
    'sky-horizon-blend': 0.5,
    'horizon-fog-blend': 0.3,
  },
  layers: [
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'satellite',
      paint: {
        'raster-opacity': 1,
        'raster-saturation': -0.2,
      },
    },
  ],
};

interface MapContainerProps {
  routeAnimationState: RouteAnimationState | null;
  fullRouteCoords: [number, number][] | null;
}

export function MapContainer({ routeAnimationState, fullRouteCoords }: MapContainerProps) {
  const mapRef = useRef<MapRef>(null);
  const setMapRef = useMapStore(s => s.setMapRef);

  const onMapLoad = useCallback(() => {
    if (mapRef.current) {
      setMapRef(mapRef.current);
    }
  }, [setMapRef]);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        onLoad={onMapLoad}
        initialViewState={{
          longitude: 35.2,
          latitude: 31.0,
          zoom: 7,
          pitch: 45,
          bearing: 0,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        maxPitch={85}
      >
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-right" />
        <BoundaryLayer />
        <CitiesLayer />
        <RouteLayer
          animationState={routeAnimationState}
          fullRouteCoords={fullRouteCoords}
        />
        <LocationMarker />
      </Map>
      <MapOverlay />
    </div>
  );
}
