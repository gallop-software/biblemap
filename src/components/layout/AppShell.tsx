import { useEffect, useState, useCallback, useRef } from 'react';
import { TopBar } from './TopBar';
import { BottomBar } from './BottomBar';
import { MapContainer } from '../map/MapContainer';
import { VerseTextPanel } from '../map/VerseTextPanel';
import { useUIStore } from '../../stores/ui-store';
import { useVerseStore } from '../../stores/verse-store';
import { useMapStore } from '../../stores/map-store';
import { usePlaces } from '../../hooks/use-places';
import { useRouteAnimation, type RouteAnimationState } from '../../hooks/use-route-animation';
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
  const currentChapter = useVerseStore(s => s.currentChapter);
  const currentVerse = useVerseStore(s => s.currentVerse);
  const initPeriods = usePeriodStore(s => s.initPeriods);
  const setYearAndLoad = usePeriodStore(s => s.setYearAndLoad);
  const periods = usePeriodStore(s => s.periods);
  const initSearch = useSearchStore(s => s.initSearch);

  const { animate, cancel } = useRouteAnimation();
  const [routeAnimState, setRouteAnimState] = useState<RouteAnimationState | null>(null);
  const [fullRouteCoords, setFullRouteCoords] = useState<[number, number][] | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPlayActiveRef = useRef(false);
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
  }, [currentBook, currentChapter, currentVerse, periods, setYearAndLoad]);

  const clearAutoPlayTimer = useCallback(() => {
    if (autoPlayRef.current !== null) {
      clearTimeout(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  const scheduleNextVerse = useCallback((delay: number = 3000) => {
    clearAutoPlayTimer();
    if (!autoPlayActiveRef.current) return;
    autoPlayRef.current = setTimeout(() => {
      if (autoPlayActiveRef.current) {
        useVerseStore.getState().nextVerse();
      }
    }, delay);
  }, [clearAutoPlayTimer]);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => {
      const next = !prev;
      autoPlayActiveRef.current = next;
      if (next) {
        scheduleNextVerse(1500);
      } else {
        clearAutoPlayTimer();
      }
      return next;
    });
  }, [scheduleNextVerse, clearAutoPlayTimer]);

  useEffect(() => {
    if (!currentLocation || !places) return;

    const locationKey = currentLocation.type === 'point'
      ? currentLocation.placeId
      : currentLocation.type === 'route'
        ? currentLocation.ref
        : null;

    if (locationKey && locationKey === prevLocationRef.current) {
      if (autoPlayActiveRef.current) scheduleNextVerse();
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
      if (autoPlayActiveRef.current) scheduleNextVerse();
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
        () => {
          if (autoPlayActiveRef.current) scheduleNextVerse(1500);
        },
      );
    }
  }, [currentLocation, places, flyToPlace, mapRef, animate, cancel, scheduleNextVerse]);

  useEffect(() => {
    return () => {
      clearAutoPlayTimer();
      cancel();
    };
  }, [clearAutoPlayTimer, cancel]);

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
          if (routeAnimState?.isAnimating) {
            cancel();
            setRouteAnimState(null);
          } else {
            toggleAutoPlay();
          }
          break;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [routeAnimState, cancel, toggleAutoPlay]);

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-950">
      <TopBar isAutoPlaying={isAutoPlaying} onToggleAutoPlay={toggleAutoPlay} />
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          <MapContainer
            routeAnimationState={routeAnimState}
            fullRouteCoords={fullRouteCoords}
          />
        </div>
        {textPanelOpen && (
          <div className="w-72">
            <VerseTextPanel />
          </div>
        )}
      </div>
      <BottomBar />
    </div>
  );
}
