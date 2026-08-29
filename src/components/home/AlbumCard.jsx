import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import usePlayerStore from '../../store/usePlayerStore';
import { api } from '../../services/api';

export default function AlbumCard({ album }) {
  const { playTrack } = usePlayerStore();
  const [loading, setLoading] = useState(false);

  // Handle ALL possible field formats
  const albumName = album.title || album.name || 'Unknown';
  const artistName = album.artist || album.artists || '';
  const image = album.cover_url || album.image || album.cover || '';

  const handleClick = async (e) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const data = await api.getAlbum(album.id);
      const tracks = (data.tracks || []).filter((t) => t.audio_url);
      if (tracks.length > 0) {
        playTrack(tracks[0], tracks);
      }
    } catch (err) {
      console.error('Gagal memuat album:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="group w-full text-left active:scale-95 transition-all"
    >
      <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-lg mb-2.5 gradient-card">
        {image ? (
          <img
            src={image}
            alt={albumName}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : null}
        {!image && (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl text-text-muted">♪</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-active:opacity-100 transition-opacity duration-200" />
        <div className="absolute bottom-2.5 right-2.5 opacity-0 group-active:opacity-100 transition-all duration-200">
          <div
            className="w-10 h-10 gradient-accent-strong rounded-full flex items-center justify-center shadow-xl"
            style={{ boxShadow: '0 4px 15px rgba(167, 139, 250, 0.4)' }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
            )}
          </div>
        </div>
      </div>
      <p className="text-[12px] font-medium text-text-primary truncate">{albumName}</p>
      {artistName && <p className="text-[10px] text-text-secondary truncate">{artistName}</p>}
    </button>
  );
}
