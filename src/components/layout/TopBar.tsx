import { useUIStore } from '../../stores/ui-store';
import { SearchBar } from '../search/SearchBar';
import { NavigationControls } from '../navigation/NavigationControls';

interface TopBarProps {
  isAutoPlaying: boolean;
  onToggleAutoPlay: () => void;
}

export function TopBar({ isAutoPlaying, onToggleAutoPlay }: TopBarProps) {
  const toggleTextPanel = useUIStore(s => s.toggleTextPanel);

  return (
    <div className="flex items-center h-12 px-3 bg-gray-900 border-b border-white/10 gap-3 shrink-0">
      <h1 className="text-base font-bold text-white tracking-wide shrink-0">BibleMap</h1>
      <SearchBar />
      <div className="ml-auto flex items-center gap-2">
        <NavigationControls />
        <button
          onClick={onToggleAutoPlay}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors shrink-0 ${
            isAutoPlaying
              ? 'bg-amber-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Auto-play (Space)"
        >
          {isAutoPlaying ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="2" y="1" width="3" height="10" rx="0.5" />
              <rect x="7" y="1" width="3" height="10" rx="0.5" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 1.5v9l8.5-4.5L2 1.5z" />
            </svg>
          )}
        </button>
        <button
          onClick={toggleTextPanel}
          className="text-white/70 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors text-xs"
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
