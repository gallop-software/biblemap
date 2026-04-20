import { Source, Layer } from 'react-map-gl/maplibre';
import type { CircleLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import { usePeriodStore } from '../../stores/period-store';

const cityCircleStyle: CircleLayerSpecification = {
  id: 'cities-circle',
  type: 'circle',
  source: 'cities',
  paint: {
    'circle-radius': [
      'match', ['get', 'importance'],
      'capital', 7,
      'major', 5,
      3,
    ],
    'circle-color': [
      'match', ['get', 'importance'],
      'capital', '#FFD700',
      'major', '#FFA500',
      '#D2B48C',
    ],
    'circle-stroke-color': '#000000',
    'circle-stroke-width': 1,
    'circle-opacity': 0.9,
  },
};

const cityLabelStyle: SymbolLayerSpecification = {
  id: 'cities-label',
  type: 'symbol',
  source: 'cities',
  layout: {
    'text-field': ['get', 'name'],
    'text-size': [
      'match', ['get', 'importance'],
      'capital', 12,
      'major', 11,
      10,
    ],
    'text-font': ['Open Sans Bold'],
    'text-offset': [0, 1.2],
    'text-anchor': 'top',
    'text-allow-overlap': false,
  },
  paint: {
    'text-color': '#FFFFFF',
    'text-halo-color': 'rgba(0,0,0,0.8)',
    'text-halo-width': 1.2,
  },
  minzoom: 7,
};

const capitalLabelStyle: SymbolLayerSpecification = {
  id: 'capitals-label',
  type: 'symbol',
  source: 'cities',
  filter: ['==', ['get', 'importance'], 'capital'],
  layout: {
    'text-field': ['get', 'name'],
    'text-size': 12,
    'text-font': ['Open Sans Bold'],
    'text-offset': [0, 1.2],
    'text-anchor': 'top',
    'text-allow-overlap': false,
  },
  paint: {
    'text-color': '#FFD700',
    'text-halo-color': 'rgba(0,0,0,0.8)',
    'text-halo-width': 1.5,
  },
  maxzoom: 7,
};

export function CitiesLayer() {
  const cities = usePeriodStore(s => s.cities);

  if (!cities) return null;

  return (
    <Source id="cities" type="geojson" data={cities}>
      <Layer {...cityCircleStyle} />
      <Layer {...cityLabelStyle} />
      <Layer {...capitalLabelStyle} />
    </Source>
  );
}
