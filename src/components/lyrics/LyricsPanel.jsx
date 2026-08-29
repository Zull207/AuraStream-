import { useRef, useEffect, useState } from 'react';
import { Mic2, ChevronDown } from 'lucide-react';
import usePlayerStore from '../../store/usePlayerStore';
import clsx from 'clsx';

export default function LyricsPanel() {
  const {
    currentTrack,
    lyrics,
    currentLyricIndex,
    seekTo,
    currentTime,
    duration,
  } = usePlayerStore();

  const [showLyrics, setShowLyrics] = useState(false);
  const containerRef = useRef(null);
  const activeRef = useRef(null);
  const isAutoScrolling = useRef(false);

  // Auto-scroll to active lyric
  useEffect(() => {
    if (!activeRef.current || !containerRef.current || !showLyrics) return;
    if (isAutoScrolling.current) return; // prevent scroll conflicts

    const container = containerRef.current;
    const active = activeRef.current;

    isAutoScrolling.current = true;
    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const offset = activeRect.top - containerRect.top - containerRect.height / 2 + activeRect.height / 2;

    container.scrollTo({
      top: container.scrollTop + offset,
      behavior: 'smooth',
    });

    setTimeout(() => { isAutoScrolling.current = false; }, 400);
  }, [currentLyricIndex, showLyrics]);

  // Don't render if no track or no lyrics
  if (!currentTrack || lyrics.length === 0) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setShowLyrics(true)}
        className="fixed bottom-[140px] right-4 z-50 p-3 gradient-accent-strong rounded-full text-white active:scale-95 transition-all shadow-xl md:bottom-[160px]"
        style={{ boxShadow: '0 4px 20px rgba(167, 139, 250, 0.3)' }}
      >
        <Mic2 className="w-5 h-5" />
      </button>

      {/* Full Screen Lyrics Overlay */}
      <div
        className={clsx(
          'fixed inset-0 z-[70] transition-transform duration-300 ease-out',
          showLyrics ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ background: 'linear-gradient(180deg, #0a0a0c 0%, #131316 50%, #1c1c22 100%)' }}
      >
        <div className="flex flex-col h-full max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-safe-area-top pt-4 pb-2 shrink-0">
            <button
              onClick={() => setShowLyrics(false)}
              className="p-2 -ml-2 text-text-secondary active:text-accent"
            >
              <ChevronDown className="w-7 h-7" />
            </button>
            <div className="text-center min-w-0 flex-1 mx-2">
              <p className="text-xs text-text-muted font-medium uppercase tracking-wider">
                Lirik
              </p>
            </div>
            <div className="w-9" /> {/* spacer */}
          </div>

          {/* Track Info */}
          <div className="text-center px-6 pb-3 shrink-0">
            <p className="text-sm font-bold text-text-primary truncate">
              {currentTrack.name}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {currentTrack.artist || 'Unknown'}
            </p>
          </div>

          {/* Progress mini bar */}
          <div className="px-6 pb-3 shrink-0">
            <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
                }}
              />
            </div>
          </div>

          {/* Lyrics Content */}
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-5 pb-24 scrollbar-hide"
          >
            <div className="py-12 space-y-1">
              {lyrics.map((line, index) => {
                const isActive = index === currentLyricIndex;
                const isPast = index < currentLyricIndex;

                return (
                  <button
                    key={index}
                    ref={isActive ? activeRef : null}
                    onClick={() => seekTo(line.time)}
                    className={clsx(
                      'block w-full text-left py-3 px-3 rounded-xl transition-all duration-400 select-none',
                      isActive
                        ? 'text-lg font-bold text-text-primary scale-[1.02]'
                        : isPast
                        ? 'text-base text-text-muted/40'
                        : 'text-base text-text-muted/70 active:text-text-primary active:text-base'
                    )}
                    style={isActive ? {
                      textShadow: '0 0 30px rgba(167, 139, 250, 0.4), 0 0 60px rgba(167, 139, 250, 0.15)',
                    } : {}}
                  >
                    {line.text}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
