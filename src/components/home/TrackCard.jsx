import { Play, Pause } from 'lucide-react';
import usePlayerStore from '../../store/usePlayerStore';
import clsx from 'clsx';

export default function TrackCard({ track, trackList = [], index }) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const isCurrentTrack = currentTrack?.id === track.id;

  const handleClick = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track, trackList.length > 0 ? trackList : [track]);
    }
  };

  // Handle ALL possible field formats
  const artistName = track.artist || track.artists || track.artists?.[0]?.name || 'Unknown';
  const image = track.image || track.cover_url || track.album?.cover || track.album?.cover_medium || '';
  const duration = track.duration || 0;
  const mins = Math.floor(duration / 60);
  const secs = (duration % 60).toString().padStart(2, '0');

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'group flex items-center gap-3 w-full px-2 py-2 rounded-lg transition-all text-left active:scale-[0.98]',
        isCurrentTrack
          ? 'bg-white/10'
          : 'active:bg-white/[0.03]'
      )}
    >
      {/* Chart number or cover */}
      {index ? (
        <div className="w-7 text-center shrink-0">
          {isCurrentTrack && isPlaying ? (
            <div className="flex items-end justify-center gap-[2px] h-3.5">
              {[0.6, 0.4, 0.8, 0.3].map((h, i) => (
                <div
                  key={i}
                  className="w-[2px] rounded-full"
                  style={{
                    height: `${h * 14}px`,
                    background: 'linear-gradient(to top, #a78bfa, #60a5fa)',
                    animation: `pulse 0.${4 + i}s ease-in-out infinite alternate`,
                  }}
                />
              ))}
            </div>
          ) : (
            <span className="text-[11px] text-text-muted">{index}</span>
          )}
        </div>
      ) : (
        <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0 shadow-md">
          {image ? (
            <img
              src={image}
              alt={track.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : null}
          {!image && (
            <div className="w-full h-full gradient-card flex items-center justify-center">
              <span className="text-sm text-text-muted">♪</span>
            </div>
          )}
          <div
            className={clsx(
              'absolute inset-0 flex items-center justify-center transition-opacity',
              isCurrentTrack && isPlaying
                ? 'bg-accent/30 opacity-100'
                : 'bg-black/50 opacity-0 group-active:opacity-100'
            )}
          >
            {isCurrentTrack && isPlaying ? (
              <Pause className="w-4 h-4 text-white" fill="white" />
            ) : (
              <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className={clsx(
          'text-[13px] font-medium truncate leading-tight',
          isCurrentTrack ? 'text-white' : 'text-white/90'
        )}>
          {track.name || track.title || 'Unknown'}
        </p>
        <p className="text-[11px] text-text-secondary truncate leading-tight mt-0.5">
          {artistName}
        </p>
      </div>

      {/* Duration */}
      {!index && duration > 0 && (
        <span className="text-[10px] text-text-muted tabular-nums shrink-0">
          {mins}:{secs}
        </span>
      )}
    </button>
  );
}
