import { Home, Search, Settings, ListMusic } from 'lucide-react';
import usePlayerStore from '../../store/usePlayerStore';
import clsx from 'clsx';
import logoImg from '../../assets/logo.png';

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { activeView, setActiveView } = usePlayerStore();

  return (
    <aside className="hidden lg:flex flex-col w-[280px] h-full glass border-r border-white/[0.04] shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <img src={logoImg} alt="AuraStream" className="w-9 h-9 rounded-lg object-cover shadow-lg" style={{ boxShadow: '0 4px 15px rgba(167, 139, 250, 0.3)' }} />
        <span className="text-xl font-bold tracking-tight text-text-primary">
          AuraStream
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium',
                  isActive
                    ? 'gradient-accent text-white shadow-lg'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
                )}
                style={isActive ? { boxShadow: '0 4px 15px rgba(167, 139, 250, 0.15)' } : {}}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-white/[0.06]" />

        {/* Library section */}
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Library
          </h3>
        </div>

        <button
          onClick={() => setActiveView('terms')}
          className={clsx(
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium',
            activeView === 'terms'
              ? 'gradient-accent text-white shadow-lg'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
          )}
          style={activeView === 'terms' ? { boxShadow: '0 4px 15px rgba(167, 139, 250, 0.15)' } : {}}
        >
          <ListMusic className="w-5 h-5" />
          About & Terms
        </button>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/[0.06]">
        <p className="text-[11px] text-text-muted">
          &copy; 2026 AuraStream
        </p>
        <p className="text-[10px] text-text-muted/60 mt-0.5">
          Streaming aggregated via legal APIs
        </p>
      </div>
    </aside>
  );
}
