import { usePeriodStore } from '../../stores/period-store';
import { TimeSlider } from '../timeline/TimeSlider';

function PeriodBadge() {
  const activePeriod = usePeriodStore(s => s.activePeriod);
  return (
    <div
      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 w-[170px] text-center"
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
    <div className="flex items-center h-10 px-3 bg-gray-900 border-t border-white/10 shrink-0 gap-3">
      <TimeSlider />
      <div className="w-px h-5 bg-white/10 shrink-0" />
      <PeriodBadge />
    </div>
  );
}
