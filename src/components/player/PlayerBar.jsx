import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Volume1, ChevronDown, Heart,
} from 'lucide-react';
import usePlayerStore from '../../store/usePlayerStore';
import { formatTime } from '../../utils/lyrics';
import { isFavorite, toggleFavorite } from '../../utils/localStorage';
import clsx from 'clsx';

export default function PlayerBar() {
  const {
    currentTrack, isPlaying, currentTime, duration, volume, isMuted,
    isShuffled, repeatMode, togglePlay, playNext, playPrevious,
    seekTo, setVolume, toggleMute, toggleShuffle, toggleRepeat,
  } = usePlayerStore();

  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const progressRef = useRef(null);

  // Sync liked state when track changes
  useEffect(() => {
    if (currentTrack?.id) {
      setLiked(isFavorite(currentTrack.id));
    }
  }, [currentTrack?.id]);

  const handleLike = useCallback(() => {
    if (!currentTrack) return;
    const newState = toggleFavorite(currentTrack);
    setLiked(newState);
  }, [currentTrack]);

  const handleProgressClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(pct * (duration || 0));
  }, [seekTo, duration]);

  const handleTouchMove = useCallback((e) => {
    if (!progressRef.current) return;
    const touch = e.touches[0];
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    seekTo(pct * (duration || 0));
  }, [seekTo, duration]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  if (!currentTrack) return null;

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;
  const artistName = currentTrack.artist || 'Unknown';
  const image = currentTrack.image || currentTrack.cover_url || '';

  return (
    <>
      {/* ─── Mini Player ─── */}
      <div
        className={clsx(
          'fixed left-0 right-0 z-40 transition-all duration-300',
          expanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
        style={{ bottom: '56px' }}
      >
        <div className="w-full h-[2px] bg-white/5">
          <div
            className="h-full transition-all duration-150"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
            }}
          />
        </div>

        <div className="glass-player px-3 py-2 flex items-center gap-3 safe-area-bottom">
          <div
            className="flex items-center gap-3 min-w-0 flex-1 active:opacity-80"
            onClick={() => setExpanded(true)}
          >
            {image ? (
              <img src={image} alt="" className="w-11 h-11 rounded-lg object-cover shadow-lg shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-lg gradient-card flex items-center justify-center shrink-0">
                <span className="text-lg text-text-muted">♪</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-text-primary truncate leading-tight">
                {currentTrack.name}
              </p>
              <p className="text-[11px] text-text-secondary truncate leading-tight mt-0.5">
                {artistName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={playPrevious} className="p-2 text-text-secondary active:text-white">
              <SkipBack className="w-5 h-5" fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              className="p-2.5 gradient-accent-strong rounded-full text-white active:scale-90 transition-transform mx-0.5"
              style={{ boxShadow: '0 4px 15px rgba(167, 139, 250, 0.3)' }}
            >
              {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
            </button>
            <button onClick={playNext} className="p-2 text-text-secondary active:text-white">
              <SkipForward className="w-5 h-5" fill="currentColor" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Full Player ─── */}
      <div
        className={clsx(
          'fixed inset-0 z-[60] transition-transform duration-300 ease-out',
          expanded ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ background: 'linear-gradient(180deg, #0a0a0c 0%, #131316 40%, #1c1c22 100%)' }}
      >
        <div className="flex flex-col h-full max-w-lg mx-auto px-5 pt-3 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <button onClick={() => setExpanded(false)} className="p-2 -ml-2 text-text-secondary active:text-white">
              <ChevronDown className="w-7 h-7" />
            </button>
            <span className="text-[10px] text-text-muted font-medium uppercase tracking-[0.2em]">Now Playing</span>
            <div className="w-9" />
          </div>

          {/* Album Art */}
          <div className="flex-1 flex items-center justify-center mb-5 min-h-0">
            <div className="w-full max-w-[300px] aspect-square">
              {image ? (
                <div className="relative w-full h-full">
                  <img
                    src={image}
                    alt={currentTrack.name}
                    className={clsx(
                      'w-full h-full rounded-2xl object-cover shadow-2xl transition-all duration-500',
                      isPlaying && 'animate-pulse-glow'
                    )}
                  />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-white/5" />
                  <div
                    className="absolute -inset-8 -z-10 rounded-3xl blur-3xl opacity-25"
                    style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)' }}
                  />
                </div>
              ) : (
                <div className="w-full h-full rounded-2xl gradient-card flex items-center justify-center">
                  <span className="text-6xl text-text-muted">♪</span>
                </div>
              )}
            </div>
          </div>

          {/* Track Info + Like */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="min-w-0 flex-1 mr-3">
              <h2 className="text-lg font-bold text-text-primary truncate">{currentTrack.name}</h2>
              <p className="text-sm text-text-secondary truncate">{artistName}</p>
            </div>
            <button
              onClick={handleLike}
              className="p-2 shrink-0 active:scale-110 transition-transform"
            >
              <Heart
                className={clsx('w-6 h-6 transition-colors', liked ? 'text-accent fill-accent' : 'text-text-secondary')}
              />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4 shrink-0">
            <div
              ref={progressRef}
              className="w-full h-1.5 bg-white/10 rounded-full cursor-pointer relative group"
              onClick={handleProgressClick}
              onTouchMove={handleTouchMove}
            >
              <div
                className="h-full rounded-full relative"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #a78bfa, #60a5fa)' }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-text-muted tabular-nums">{formatTime(currentTime)}</span>
              <span className="text-[10px] text-text-muted tabular-nums">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-2 mb-5 shrink-0">
            <button onClick={toggleShuffle} className={clsx('p-2', isShuffled ? 'text-accent' : 'text-text-secondary')}>
              <Shuffle className="w-5 h-5" />
            </button>
            <button onClick={playPrevious} className="p-2 text-white active:scale-90 transition-transform">
              <SkipBack className="w-8 h-8" fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              className="p-4 gradient-accent-strong rounded-full text-white active:scale-90 transition-transform shadow-xl"
              style={{ boxShadow: '0 8px 30px rgba(167, 139, 250, 0.35)' }}
            >
              {isPlaying ? <Pause className="w-8 h-8" fill="currentColor" /> : <Play className="w-8 h-8 ml-1" fill="currentColor" />}
            </button>
            <button onClick={playNext} className="p-2 text-white active:scale-90 transition-transform">
              <SkipForward className="w-8 h-8" fill="currentColor" />
            </button>
            <button onClick={toggleRepeat} className={clsx('p-2 relative', repeatMode !== 'off' ? 'text-accent' : 'text-text-secondary')}>
              <RepeatIcon className="w-5 h-5" />
              {repeatMode === 'one' && <span className="absolute -top-0.5 -right-0.5 text-[7px] font-bold text-accent">1</span>}
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 px-1 shrink-0">
            <button onClick={toggleMute} className="p-1 text-text-secondary active:text-white">
              <VolumeIcon className="w-4 h-4" />
            </button>
            <div className="flex-1 h-1 bg-white/10 rounded-full relative">
              <div className="h-full rounded-full" style={{ width: `${isMuted ? 0 : volume * 100}%`, background: 'linear-gradient(90deg, #a78bfa, #60a5fa)' }} />
              <input
                type="range" min="0" max="1" step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
