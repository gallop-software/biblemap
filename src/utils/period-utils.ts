import type { HistoricalPeriod } from '../types/period';

export function resolvePeriodForYear(
  periods: HistoricalPeriod[],
  year: number
): HistoricalPeriod | null {
  for (const period of periods) {
    if (year >= period.startYear && year <= period.endYear) {
      return period;
    }
  }
  return null;
}

export function formatYear(year: number): string {
  if (year < 0) return `~${Math.abs(year)} BC`;
  if (year === 0) return '~1 BC';
  return `~${year} AD`;
}
