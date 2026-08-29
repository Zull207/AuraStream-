import { useState } from 'react';
import { ChevronDown, Music, Shield, Headphones, List, Info } from 'lucide-react';
import clsx from 'clsx';

const sections = [
  {
    id: 'how-it-works',
    icon: Music,
    title: 'Cara Kerja',
    content: `AuraStream adalah pemutar musik web yang mengintegrasikan API eksternal legal untuk streaming gratis. Kami tidak menyimpan file musik di server kami.

Semua data diambil langsung dari browser kamu menggunakan REST API publik.`,
  },
  {
    id: 'features',
    icon: Headphones,
    title: 'Fitur',
    content: `🎵 Pemutar Musik - Kontrol Play, Pause, Skip, Shuffle, Repeat di bagian bawah.

⏭️ Antrean - Lagu otomatis lanjut dengan crossfade 3 detik.

🎤 Lirik Interaktif - Ketuk ikon mic di mini player. Ketuk baris lirik untuk loncat ke bagian lagu.

🔍 Pencarian - Cari lagu, artis, atau album dengan tab terpisah.

⚙️ Pengaturan - Kelola riwayat pencarian dan lagu diputar.`,
  },
  {
    id: 'privacy',
    icon: Shield,
    title: 'Privasi',
    content: `📦 Penyimpanan Lokal
Semua data (riwayat pencarian, lagu diputar) tersimpan di browser kamu menggunakan localStorage. Tidak pernah dikirim ke server.

🚫 Tidak Ada Akun
Tidak perlu registrasi atau login.

🔒 Tidak Ada Tracking
Tidak ada cookie tracking atau analytics pihak ketiga.`,
  },
  {
    id: 'queue',
    icon: List,
    title: 'Antrean & Crossfade',
    content: `• Lagu otomatis lanjut ke berikutnya
• Crossfade 3 detik untuk transisi mulus
• Mode Shuffle untuk urutan acak
• Mode Repeat: Off, All (ulang semua), One (ulang lagu ini)`,
  },
  {
    id: 'about',
    icon: Info,
    title: 'Tentang',
    content: `AuraStream - Desain monokromatik minimalis.

Tech Stack:
• React.js + Vite
• Tailwind CSS
• Zustand (state management)
• Glassmorphism effects`,
  },
];

export default function Terms() {
  const [openSections, setOpenSections] = useState(['how-it-works']);

  const toggleSection = (id) => {
    setOpenSections((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="px-4 pt-5 pb-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-1 tracking-tight">Tentang</h1>
      <p className="text-xs text-text-secondary mb-5">Pelajari tentang AuraStream</p>

      <div className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isOpen = openSections.includes(section.id);

          return (
            <div
              key={section.id}
              className={clsx(
                'rounded-xl border overflow-hidden transition-all duration-200',
                isOpen ? 'gradient-card border-accent/10' : 'gradient-card border-white/[0.04]'
              )}
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/[0.03] transition-colors"
              >
                <div className={clsx(
                  'p-1 rounded-md transition-colors',
                  isOpen ? 'gradient-accent' : 'bg-white/[0.03]'
                )}>
                  <Icon className={clsx('w-3.5 h-3.5', isOpen ? 'text-accent' : 'text-text-secondary')} />
                </div>
                <span className="flex-1 text-sm font-semibold text-text-primary">
                  {section.title}
                </span>
                <ChevronDown
                  className={clsx(
                    'w-4 h-4 text-text-secondary transition-transform duration-300 shrink-0',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>

              <div
                className={clsx(
                  'overflow-hidden transition-all duration-300',
                  isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                )}
              >
                <div className="px-4 pb-4 text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
