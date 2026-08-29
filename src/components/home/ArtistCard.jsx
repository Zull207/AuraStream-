import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import usePlayerStore from '../../store/usePlayerStore';
import { api } from '../../services/api';

export default function ArtistCard({ artist }) {
  const { setActiveView } = usePlayerStore();
  const [loading, setLoading] = useState(false);

  // Handle ALL possible field formats from different API responses
  const artistName = artist.name || artist.title || 'Unknown';
  const image = artist.avatar_url || artist.image || artist.cover_url || artist.picture_medium || '';

  const handleClick = async (e) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const artistData = await api.getArtist(artist.id);
      setActiveView({ id: 'artist', data: artistData });
    } catch (err) {
      console.error('Gagal memuat artis:', err);
      setActiveView({ id: 'artist', data: { ...artist, name: artistName, image, top_tracks: [] } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="group flex flex-col items-center gap-2 active:scale-95 transition-all"
    >
      <div className="relative">
        <div className="w-[100px] h-[100px] rounded-full overflow-hidden shadow-lg bg-bg-card">
          {image ? (
            <img
              src={image}
              alt={artistName}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : null}
          {!image && (
            <div className="w-full h-full flex items-center justify-center gradient-card">
              <span className="text-2xl text-text-muted">♪</span>
            </div>
          )}
        </div>
        <div className="absolute inset-0 rounded-full ring-2 ring-accent/0 group-active:ring-accent/40 transition-all duration-300" />
        {loading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
      </div>
      <p className="text-[11px] font-medium text-text-primary truncate max-w-[100px] text-center">
        {artistName}
      </p>
    </button>
  );
}
