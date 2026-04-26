import { usePeriodStore } from '../../stores/period-store';
import { TimeSlider } from '../timeline/TimeSlider';

function PeriodBadge() {
  const activePeriod = usePeriodStore(s => s.activePeriod);
  return (
    <div
      className="text-xs md:text-sm font-semibold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 hidden sm:block sm:w-[180px] md:w-[230px] text-center whitespace-nowrap"
      style={activePeriod
        ? { backgroundColor: activePeriod.color + '33', color: activePeriod.color }
        : { backgroundColor: 'transparent', color: 'transparent' }
      }
    >
      {activePeriod?.name ?? '\u00A0'}
    </div>
  );
}

export function BottomBar() {
  return (
    <div className="flex items-center h-11 md:h-10 px-2 md:px-3 bg-gray-900 border-t border-white/10 shrink-0 gap-2 md:gap-3 pb-[env(safe-area-inset-bottom)]">
      <TimeSlider />
      <div className="w-px h-5 bg-white/10 shrink-0 hidden sm:block" />
      <PeriodBadge />
    </div>
  );
}
