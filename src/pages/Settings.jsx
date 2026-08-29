import { useState } from 'react';
import {
  Clock,
  Music,
  Search,
  Trash2,
  Bug,
  Mail,
  Bell,
  Info,
  AlertCircle,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import {
  getSearchHistory,
  getRecentlyPlayed,
  clearSearchHistory,
  clearRecentlyPlayed,
  clearAllHistory,
} from '../utils/localStorage';
import clsx from 'clsx';

const notifications = [
  {
    id: 1,
    type: 'info',
    title: 'Selamat Datang!',
    message: 'Nikmati musik gratis dengan desain monokromatik minimalis.',
    time: 'Baru saja',
  },
  {
    id: 2,
    type: 'info',
    title: 'Tips: Lirik Interaktif',
    message: 'Ketuk ikon mic di mini player untuk melihat lirik. Ketuk baris lirik untuk loncat ke bagian lagu.',
    time: 'Tips',
  },
  {
    id: 3,
    type: 'info',
    title: 'Tips: Antrean Musik',
    message: 'Lagu otomatis lanjut ke berikutnya. Aktifkan shuffle untuk urutan acak.',
    time: 'Tips',
  },
  {
    id: 4,
    type: 'update',
    title: 'Pembaruan',
    message: 'Pencarian lagu, artis, dan album dengan tab yang rapi.',
    time: 'Update',
  },
  {
    id: 5,
    type: 'info',
    title: 'Privasi',
    message: 'Semua riwayat tersimpan di browser kamu. Tidak ada data yang dikirim ke server.',
    time: 'Privasi',
  },
];

export default function Settings() {
  const [searchHistory, setSearchHistory] = useState(() => getSearchHistory());
  const [recentPlayed, setRecentPlayed] = useState(() => getRecentlyPlayed());
  const [activeSection, setActiveSection] = useState('history');

  const sections = [
    { id: 'history', label: 'Riwayat', icon: Clock, count: searchHistory.length + recentPlayed.length },
    { id: 'notifications', label: 'Pemberitahuan', icon: Bell, count: notifications.length },
    { id: 'support', label: 'Support', icon: Mail, count: null },
  ];

  return (
    <div className="px-4 pt-5 pb-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-5 tracking-tight">Pengaturan</h1>

      {/* Section Tabs - Accent gradient active */}
      <div className="flex gap-1 mb-5 gradient-card rounded-xl p-1 border border-white/[0.03]">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200',
                isActive
                  ? 'gradient-accent-strong text-white shadow-lg'
                  : 'text-text-secondary active:text-text-primary'
              )}
              style={isActive ? { boxShadow: '0 4px 15px rgba(167, 139, 250, 0.2)' } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* History Section */}
      {activeSection === 'history' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Recently Played */}
          <div className="gradient-card rounded-xl border border-white/[0.04] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-text-primary">Terakhir Diputar</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full gradient-accent text-accent font-medium">
                  {recentPlayed.length}
                </span>
              </div>
              {recentPlayed.length > 0 && (
                <button
                  onClick={() => {
                    clearRecentlyPlayed();
                    setRecentPlayed([]);
                  }}
                  className="text-[10px] text-text-muted active:text-accent transition-colors"
                >
                  Hapus
                </button>
              )}
            </div>

            {recentPlayed.length > 0 ? (
              <div className="max-h-[250px] overflow-y-auto">
                {recentPlayed.map((track, idx) => (
                  <div
                    key={track.id || idx}
                    className="flex items-center gap-3 px-4 py-2.5 active:bg-white/[0.03] transition-colors"
                  >
                    {track.image ? (
                      <img src={track.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg gradient-card flex items-center justify-center shrink-0">
                        <span className="text-xs text-text-muted">♪</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary truncate">{track.name}</p>
                      <p className="text-[11px] text-text-secondary truncate">{track.artist}</p>
                    </div>
                    <span className="text-[9px] text-text-muted shrink-0">
                      {new Date(track.timestamp).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-xs text-text-muted">Belum ada lagu diputar</p>
              </div>
            )}
          </div>

          {/* Search History */}
          <div className="gradient-card rounded-xl border border-white/[0.04] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-text-primary">Riwayat Cari</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full gradient-accent text-accent font-medium">
                  {searchHistory.length}
                </span>
              </div>
              {searchHistory.length > 0 && (
                <button
                  onClick={() => {
                    clearSearchHistory();
                    setSearchHistory([]);
                  }}
                  className="text-[10px] text-text-muted active:text-accent transition-colors"
                >
                  Hapus
                </button>
              )}
            </div>

            {searchHistory.length > 0 ? (
              <div className="max-h-[250px] overflow-y-auto">
                {searchHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-4 py-2.5 active:bg-white/[0.03] transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 text-accent/60 shrink-0" />
                    <span className="text-sm text-text-primary flex-1 truncate">{item.query}</span>
                    <span className="text-[9px] text-text-muted shrink-0">
                      {new Date(item.timestamp).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-xs text-text-muted">Belum ada riwayat</p>
              </div>
            )}
          </div>

          {/* Clear All */}
          {(recentPlayed.length > 0 || searchHistory.length > 0) && (
            <button
              onClick={() => {
                clearAllHistory();
                setRecentPlayed([]);
                setSearchHistory([]);
              }}
              className="flex items-center justify-center gap-2 w-full py-3 text-sm text-red-400 active:text-red-300 active:bg-red-400/10 rounded-xl transition-all border border-red-400/15 hover:border-red-400/25"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Semua Riwayat
            </button>
          )}
        </div>
      )}

      {/* Notifications Section */}
      {activeSection === 'notifications' && (
        <div className="gradient-card rounded-xl border border-white/[0.04] overflow-hidden animate-fade-in-up">
          {notifications.map((notif, idx) => {
            const iconMap = { info: Info, update: CheckCircle, warning: AlertCircle };
            const Icon = iconMap[notif.type] || Info;
            return (
              <div
                key={notif.id}
                className={clsx(
                  'flex items-start gap-3 px-4 py-3',
                  idx < notifications.length - 1 && 'border-b border-white/[0.04]'
                )}
              >
                <div className="p-1 rounded-md gradient-accent shrink-0 mt-0.5">
                  <Icon className="w-3 h-3 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary">{notif.title}</p>
                    <span className="text-[9px] text-text-muted">{notif.time}</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">{notif.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Support Section */}
      {activeSection === 'support' && (
        <div className="space-y-3 animate-fade-in-up">
          <button
            onClick={() => {
              window.location.href =
                'mailto:supportaurastream@gmail.com?subject=Bug%20AuraStream&body=Halo%20Tim%20AuraStream%2C%20saya%20ingin%20melaporkan%20bug...';
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 gradient-card rounded-xl border border-white/[0.04] active:bg-white/[0.03] transition-colors"
          >
            <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary">Kirim Email Support</p>
              <p className="text-[11px] text-text-secondary">supportaurastream@gmail.com</p>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
          </button>

          <button
            onClick={() => {
              window.location.href =
                'mailto:supportaurastream@gmail.com?subject=Bug%20Report%20AuraStream&body=Halo%20Tim%20AuraStream%2C%0A%0ASaya%20ingin%20melaporkan%20bug%3A%0A%0A1.%20Deskripsi%3A%0A2.%20Langkah%3A%0A3.%20Harapan%3A%0A4.%20Terjadi%3A';
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 gradient-card rounded-xl border border-white/[0.04] active:bg-white/[0.03] transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-red-400/10 flex items-center justify-center shrink-0">
              <Bug className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary">Laporkan Bug</p>
              <p className="text-[11px] text-text-secondary">Bantu kami perbaiki AuraStream</p>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
          </button>
        </div>
      )}
    </div>
  );
}
