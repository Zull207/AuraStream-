import { Home, Search, Settings, ListMusic } from 'lucide-react';
import usePlayerStore from '../../store/usePlayerStore';
import clsx from 'clsx';

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Cari', icon: Search },
  { id: 'terms', label: 'Tentang', icon: ListMusic },
  { id: 'settings', label: 'Atur', icon: Settings },
];

export default function MobileNav() {
  const { activeView, setActiveView } = usePlayerStore();
  const currentViewId = typeof activeView === 'object' ? activeView.id || 'home' : activeView;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/[0.05]">
      <div className="flex items-center justify-around px-1 py-1 max-w-lg mx-auto safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentViewId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={clsx(
                'relative flex flex-col items-center gap-px px-3 py-1.5 rounded-lg transition-all duration-200 min-w-[56px]',
                isActive ? 'text-white' : 'text-text-muted active:text-text-secondary'
              )}
            >
              {isActive && (
                <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full gradient-accent-strong" />
              )}
              <Icon
                className={clsx('w-5 h-5', isActive && 'drop-shadow-[0_0_6px_rgba(167,139,250,0.4)]')}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={clsx('text-[9px]', isActive ? 'font-semibold' : 'font-normal')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
