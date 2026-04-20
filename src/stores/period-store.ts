import { create } from 'zustand';
import type { HistoricalPeriod } from '../types/period';
import { loadPeriods, loadBoundaries, loadCities } from '../utils/data-loader';
import { resolvePeriodForYear } from '../utils/period-utils';

interface PeriodState {
  periods: HistoricalPeriod[];
  activePeriod: HistoricalPeriod | null;
  activeYear: number | null;
  boundaries: GeoJSON.FeatureCollection | null;
  cities: GeoJSON.FeatureCollection | null;
  isLoading: boolean;

  initPeriods: () => Promise<void>;
  setYearAndLoad: (year: number) => Promise<void>;
  loadPeriodById: (periodId: string) => Promise<void>;
  loadPeriodData: (period: HistoricalPeriod) => Promise<void>;
}

export const usePeriodStore = create<PeriodState>((set, get) => ({
  periods: [],
  activePeriod: null,
  activeYear: null,
  boundaries: null,
  cities: null,
  isLoading: false,

  initPeriods: async () => {
    const periods = await loadPeriods();
    set({ periods });
  },

  setYearAndLoad: async (year: number) => {
    const { periods, activePeriod, activeYear } = get();
    if (periods.length === 0) return;
    if (year === activeYear) return;

    const resolved = resolvePeriodForYear(periods, year);

    if (!resolved) {
      if (activePeriod) {
        set({ activeYear: year, activePeriod: null, boundaries: null, cities: null });
      } else {
        set({ activeYear: year });
      }
      return;
    }

    set({ activeYear: year });

    if (resolved.id === activePeriod?.id) return;

    await get().loadPeriodData(resolved);
  },

  loadPeriodById: async (periodId: string) => {
    const { periods, activePeriod } = get();
    if (activePeriod?.id === periodId) return;
    const period = periods.find(p => p.id === periodId);
    if (period) {
      set({ activeYear: period.startYear });
      await get().loadPeriodData(period);
    }
  },

  loadPeriodData: async (period: HistoricalPeriod) => {
    set({ isLoading: true, activePeriod: period });

    try {
      const [boundaries, cities] = await Promise.all([
        loadBoundaries(period.folder),
        loadCities(period.folder),
      ]);
      set({ boundaries: boundaries ?? null, cities: cities ?? null, isLoading: false });
    } catch {
      set({ boundaries: null, cities: null, isLoading: false });
    }
  },
}));
