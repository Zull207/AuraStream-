import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import TrackCard from '../components/home/TrackCard';
import usePlayerStore from '../store/usePlayerStore';

export default function Album({ albumData }) {
  const [albumInfo, setAlbumInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setActiveView } = usePlayerStore();

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const data = await api.getAlbum(albumData.id);
        setAlbumInfo(data);
      } catch (err) {
        console.error('Gagal memuat data album:', err);
      } finally {
        setLoading(false);
      }
    };

    if (albumData?.id) {
      fetchAlbum();
    }
  }, [albumData?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!albumInfo) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary">Data album tidak ditemukan</p>
        <button
          onClick={() => setActiveView('home')}
          className="mt-4 text-sm text-accent hover:underline"
        >
          Kembali ke Home
        </button>
      </div>
    );
  }

  const image = albumInfo.image || albumInfo.images?.[0]?.url || '';
  const tracks = albumInfo.tracks || [];
  const artistName = albumInfo.artist || albumInfo.artists?.[0]?.name || 'Unknown';

  return (
    <div className="pb-8">
      {/* Hero Section */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden">
        {image && (
          <img
            src={image}
            alt={albumInfo.name}
            className="w-full h-full object-cover"
          />
        )}
        {/* Enhanced gradient overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,10,12,0.3) 0%, rgba(10,10,12,0.7) 50%, #0a0a0c 100%)' }} />

        {/* Back button */}
        <button
          onClick={() => setActiveView('home')}
          className="absolute top-4 left-4 p-2 glass rounded-full text-white active:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Album Info */}
        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-xs text-accent uppercase tracking-widest font-medium mb-1">
            Album
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-2 drop-shadow-lg">
            {albumInfo.name}
          </h1>
          <p className="text-text-secondary">
            {artistName}
            {tracks.length > 0 && (
              <>
                <span className="mx-1">·</span>
                {tracks.length} lagu
              </>
            )}
          </p>
        </div>
      </div>

      {/* Tracks */}
      <div className="px-4 md:px-8 mt-6">
        {tracks.length > 0 && (
          <div className="space-y-1">
            {tracks.map((track, idx) => (
              <TrackCard
                key={track.id || idx}
                track={{
                  ...track,
                  album_name: albumInfo.name,
                  image: image,
                  artist: artistName,
                }}
                trackList={tracks.map((t) => ({
                  ...t,
                  album_name: albumInfo.name,
                  image: image,
                  artist: artistName,
                }))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
