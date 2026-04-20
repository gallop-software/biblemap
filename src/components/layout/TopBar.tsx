import { useUIStore } from '../../stores/ui-store';
import { SearchBar } from '../search/SearchBar';
import { NavigationControls } from '../navigation/NavigationControls';

export function TopBar() {
  const toggleTextPanel = useUIStore(s => s.toggleTextPanel);

  return (
    <div className="flex items-center h-11 md:h-12 px-2 md:px-3 bg-gray-900 border-b border-white/10 gap-2 md:gap-3 shrink-0">
      <h1 className="hidden md:block text-base font-bold text-white tracking-wide shrink-0">BibleMap</h1>
      <SearchBar />
      <div className="ml-auto flex items-center gap-1 md:gap-2">
        <NavigationControls />
        <button
          onClick={toggleTextPanel}
          className="text-white/70 hover:text-white p-2 md:p-1.5 rounded hover:bg-white/10 transition-colors"
          title="Toggle verse text"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="2" y="3" width="14" height="12" rx="1" />
            <line x1="5" y1="6" x2="13" y2="6" />
            <line x1="5" y1="9" x2="13" y2="9" />
            <line x1="5" y1="12" x2="10" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
