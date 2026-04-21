import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { FillLayerSpecification, LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import { usePeriodStore } from '../../stores/period-store';

const boundaryFillStyle: FillLayerSpecification = {
  id: 'boundary-fill',
  type: 'fill',
  source: 'boundaries',
  paint: {
    'fill-color': ['get', 'fillColor'],
    'fill-opacity': 0.2,
  },
};

const boundaryLineStyle: LineLayerSpecification = {
  id: 'boundary-line',
  type: 'line',
  source: 'boundaries',
  paint: {
    'line-color': ['get', 'strokeColor'],
    'line-width': 2,
    'line-opacity': 0.7,
    'line-dasharray': [4, 2],
  },
};

const boundaryLabelStyle: SymbolLayerSpecification = {
  id: 'boundary-labels',
  type: 'symbol',
  source: 'boundary-labels',
  layout: {
    'text-field': ['get', 'name'],
    'text-size': 13,
    'text-font': ['Open Sans Bold'],
    'text-allow-overlap': false,
    'text-ignore-placement': false,
  },
  paint: {
    'text-color': ['coalesce', ['get', 'textColor'], ['get', 'strokeColor']],
    'text-halo-color': 'rgba(0,0,0,0.7)',
    'text-halo-width': 1.5,
    'text-opacity': 0.85,
  },
};

export function BoundaryLayer() {
  const boundaries = usePeriodStore(s => s.boundaries);

  const labelData = useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (!boundaries) return null;
    return {
      type: 'FeatureCollection',
      features: boundaries.features
        .filter(f => f.properties?.labelCoords)
        .map(f => ({
          type: 'Feature' as const,
          properties: f.properties,
          geometry: {
            type: 'Point' as const,
            coordinates: f.properties!.labelCoords as [number, number],
          },
        })),
    };
  }, [boundaries]);

  if (!boundaries) return null;

  return (
    <>
      <Source id="boundaries" type="geojson" data={boundaries}>
        <Layer {...boundaryFillStyle} />
        <Layer {...boundaryLineStyle} />
      </Source>
      {labelData && (
        <Source id="boundary-labels" type="geojson" data={labelData}>
          <Layer {...boundaryLabelStyle} />
        </Source>
      )}
    </>
  );
}
