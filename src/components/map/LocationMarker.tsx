import { Marker } from 'react-map-gl/maplibre';
import { useVerseStore } from '../../stores/verse-store';
import { usePlaces } from '../../hooks/use-places';

export function LocationMarker() {
  const currentLocation = useVerseStore(s => s.currentLocation);
  const places = usePlaces();

  if (!currentLocation || currentLocation.type === null || !places) return null;

  const placeId = currentLocation.type === 'point'
    ? currentLocation.placeId
    : currentLocation.waypoints[currentLocation.waypoints.length - 1]?.placeId;

  const place = placeId ? places[placeId] : null;
  if (!place) return null;

  return (
    <Marker longitude={place.coords[0]} latitude={place.coords[1]} anchor="center">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-8 h-8 rounded-full bg-blue-500/30 location-marker-pulse" />
        <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
      </div>
    </Marker>
  );
}
