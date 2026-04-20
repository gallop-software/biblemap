import { useEffect, useState, useRef } from 'react';
import { TopBar } from './TopBar';
import { BottomBar } from './BottomBar';
import { MapContainer } from '../map/MapContainer';
import { VerseTextPanel } from '../map/VerseTextPanel';
import { useUIStore } from '../../stores/ui-store';
import { useVerseStore } from '../../stores/verse-store';
import { useMapStore } from '../../stores/map-store';
import { usePlaces } from '../../hooks/use-places';
import { useRouteAnimation } from '../../hooks/use-route-animation';
import type { RouteAnimationState } from '../../hooks/use-route-animation';
import { usePeriodStore } from '../../stores/period-store';
import { useSearchStore } from '../../stores/search-store';
import { BOOK_BY_ID } from '../../data/book-metadata';
import type { VerseLocationRoute } from '../../types/verse';

export function AppShell() {
  const textPanelOpen = useUIStore(s => s.textPanelOpen);
  const currentLocation = useVerseStore(s => s.currentLocation);
  const flyToPlace = useMapStore(s => s.flyToPlace);
  const mapRef = useMapStore(s => s.mapRef);
  const places = usePlaces();
  const loadChapterData = useVerseStore(s => s.loadChapterData);
  const currentBook = useVerseStore(s => s.currentBook);
  const initPeriods = usePeriodStore(s => s.initPeriods);
  const setYearAndLoad = usePeriodStore(s => s.setYearAndLoad);
  const loadPeriodById = usePeriodStore(s => s.loadPeriodById);
  const periods = usePeriodStore(s => s.periods);
  const initSearch = useSearchStore(s => s.initSearch);

  const { animate, cancel, stateRef: animStateRef } = useRouteAnimation();
  const [routeAnimState, setRouteAnimState] = useState<RouteAnimationState | null>(null);
  const [fullRouteCoords, setFullRouteCoords] = useState<[number, number][] | null>(null);
  const prevLocationRef = useRef<string | null>(null);

  useEffect(() => {
    loadChapterData();
  }, [loadChapterData]);

  useEffect(() => {
    initPeriods();
    initSearch();
  }, [initPeriods, initSearch]);

  useEffect(() => {
    const book = BOOK_BY_ID[currentBook];
    if (book && periods.length > 0) {
      setYearAndLoad(book.dateRange.start);
    }
  }, [currentBook, periods, setYearAndLoad]);

  useEffect(() => {
    if (!currentLocation || periods.length === 0) return;
    if (currentLocation.type === 'point' || currentLocation.type === 'route') {
      if (currentLocation.periodId) {
        loadPeriodById(currentLocation.periodId);
      } else {
        const book = BOOK_BY_ID[currentBook];
        if (book) setYearAndLoad(book.dateRange.start);
      }
    }
  }, [currentLocation, currentBook, periods, loadPeriodById, setYearAndLoad]);

  useEffect(() => {
    if (!currentLocation || !places) return;

    const locationKey = currentLocation.type === 'point'
      ? currentLocation.placeId
      : currentLocation.type === 'route'
        ? currentLocation.ref
        : null;

    if (locationKey && locationKey === prevLocationRef.current) {
      return;
    }
    prevLocationRef.current = locationKey;

    cancel();
    setRouteAnimState(null);
    setFullRouteCoords(null);

    if (currentLocation.type === 'point') {
      const place = places[currentLocation.placeId];
      if (place) {
        flyToPlace(place, {
          zoom: currentLocation.zoom,
          pitch: currentLocation.pitch,
          bearing: currentLocation.bearing,
        });
      }
    } else if (currentLocation.type === 'route' && mapRef) {
      const routeLocation = currentLocation as VerseLocationRoute;
      const coords: [number, number][] = [];
      for (const wp of routeLocation.waypoints) {
        const place = places[wp.placeId];
        if (place) coords.push(place.coords);
      }
      setFullRouteCoords(coords.length >= 2 ? coords : null);

      animate(
        routeLocation,
        places,
        mapRef,
        (state) => setRouteAnimState({ ...state }),
        () => {},
      );
    }
  }, [currentLocation, places, flyToPlace, mapRef, animate, cancel]);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const store = useVerseStore.getState();
      switch (e.key) {
        case 'ArrowRight':
        case 'j':
          e.preventDefault();
          store.nextVerse();
          break;
        case 'ArrowLeft':
        case 'k':
          e.preventDefault();
          store.prevVerse();
          break;
        case ']':
          e.preventDefault();
          store.nextChapter();
          break;
        case '[':
          e.preventDefault();
          store.prevChapter();
          break;
        case ' ':
          e.preventDefault();
          if (animStateRef.current.isAnimating) {
            cancel();
            setRouteAnimState(null);
          }
          break;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancel, animStateRef]);

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-gray-950">
      <TopBar />
      <div className="flex flex-1 min-h-0 relative">
        <div className="flex-1 min-w-0">
          <MapContainer
            routeAnimationState={routeAnimState}
            fullRouteCoords={fullRouteCoords}
          />
        </div>
        {/* Desktop: side panel */}
        {textPanelOpen && (
          <div className="hidden md:block w-80 lg:w-96 shrink-0">
            <VerseTextPanel />
          </div>
        )}
        {/* Mobile: bottom sheet overlay */}
        {textPanelOpen && (
          <div className="md:hidden absolute inset-x-0 bottom-0 z-30 h-[55%] rounded-t-2xl overflow-hidden border-t border-white/10 shadow-2xl">
            <VerseTextPanel />
          </div>
        )}
      </div>
      <BottomBar />
    </div>
  );
}
