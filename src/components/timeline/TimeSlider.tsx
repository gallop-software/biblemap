import { useRef, useCallback, useEffect, useState } from 'react';
import { usePeriodStore } from '../../stores/period-store';
import { formatYear } from '../../utils/period-utils';

export function TimeSlider() {
  const periods = usePeriodStore(s => s.periods);
  const activeYear = usePeriodStore(s => s.activeYear);
  const setYearAndLoad = usePeriodStore(s => s.setYearAndLoad);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const [dragYear, setDragYear] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingYearRef = useRef<number | null>(null);

  const minYear = periods.length > 0 ? periods[0].startYear : -2100;
  const maxYear = periods.length > 0 ? periods[periods.length - 1].endYear : 100;
  const totalSpan = maxYear - minYear;

  const yearToPercent = useCallback((year: number) => {
    return ((year - minYear) / totalSpan) * 100;
  }, [minYear, totalSpan]);

  const percentToYear = useCallback((percent: number) => {
    return Math.round(minYear + (percent / 100) * totalSpan);
  }, [minYear, totalSpan]);

  const getYearFromEvent = useCallback((clientX: number) => {
    if (!trackRef.current) return minYear;
    const rect = trackRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    return percentToYear(percent);
  }, [percentToYear, minYear]);

  const scheduleYearUpdate = useCallback((year: number) => {
    pendingYearRef.current = year;
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (pendingYearRef.current !== null) {
          setYearAndLoad(pendingYearRef.current);
        }
      });
    }
  }, [setYearAndLoad]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const year = getYearFromEvent(e.clientX);
    setDragYear(year);
    scheduleYearUpdate(year);
  }, [getYearFromEvent, scheduleYearUpdate]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const year = getYearFromEvent(e.clientX);
    setHoverYear(year);
    if (isDragging) {
      setDragYear(year);
      scheduleYearUpdate(year);
    }
  }, [isDragging, getYearFromEvent, scheduleYearUpdate]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDragYear(null);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setHoverYear(null);
    if (isDragging) {
      setIsDragging(false);
      setDragYear(null);
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
      return () => { document.body.style.userSelect = ''; };
    }
  }, [isDragging]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (periods.length === 0) return null;

  const thumbPercent = dragYear !== null
    ? yearToPercent(dragYear)
    : activeYear !== null
      ? yearToPercent(activeYear)
      : 0;

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <span className="text-[9px] text-gray-500 font-mono shrink-0 w-14 text-right">
        {formatYear(minYear)}
      </span>

      <div
        ref={trackRef}
        className="relative flex-1 h-6 cursor-pointer select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        {/* Background track */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-full bg-white/10" />

        {/* Period segments — absolutely positioned by year */}
        {periods.map((period, i) => {
          const left = yearToPercent(period.startYear);
          const width = yearToPercent(period.endYear) - left;
          const isFirst = i === 0;
          const isLast = i === periods.length - 1;
          return (
            <div
              key={period.id}
              className="absolute top-1/2 -translate-y-1/2 h-2"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: period.color,
                opacity: 0.6,
                borderRadius: isFirst && isLast ? '9999px'
                  : isFirst ? '9999px 0 0 9999px'
                  : isLast ? '0 9999px 9999px 0'
                  : undefined,
              }}
              title={`${period.name} (${formatYear(period.startYear)} – ${formatYear(period.endYear)})`}
            />
          );
        })}

        {/* Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white bg-white shadow-lg z-10 ${isDragging ? '' : 'transition-[left] duration-300'}`}
          style={{ left: `${thumbPercent}%` }}
        />

        {/* Hover tooltip */}
        {hoverYear !== null && !isDragging && (
          <div
            className="absolute -top-6 -translate-x-1/2 text-[9px] text-gray-300 bg-gray-800 px-1.5 py-0.5 rounded pointer-events-none"
            style={{ left: `${yearToPercent(hoverYear)}%` }}
          >
            {formatYear(hoverYear)}
          </div>
        )}
      </div>

      <span className="text-[9px] text-gray-500 font-mono shrink-0 w-12">
        {formatYear(maxYear)}
      </span>
    </div>
  );
}
