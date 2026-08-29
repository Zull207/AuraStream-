import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import TrackCard from '../components/home/TrackCard';
import usePlayerStore from '../store/usePlayerStore';

export default function Artist({ artistData }) {
  const [artistInfo, setArtistInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setActiveView } = usePlayerStore();

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const data = await api.getArtist(artistData.id);
        setArtistInfo(data);
      } catch (err) {
        console.error('Gagal memuat data artis:', err);
      } finally {
        setLoading(false);
      }
    };

    if (artistData?.id) {
      fetchArtist();
    }
  }, [artistData?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!artistInfo) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary">Data artis tidak ditemukan</p>
        <button
          onClick={() => setActiveView('home')}
          className="mt-4 text-sm text-accent hover:underline"
        >
          Kembali ke Home
        </button>
      </div>
    );
  }

  const image = artistInfo.image || artistInfo.images?.[0]?.url || '';
  const topTracks = artistInfo.top_tracks || artistInfo.tracks || [];

  return (
    <div className="pb-8">
      {/* Hero Section */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden">
        {image && (
          <img
            src={image}
            alt={artistInfo.name}
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

        {/* Artist Info */}
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-2 drop-shadow-lg">
            {artistInfo.name}
          </h1>
          <p className="text-text-secondary">
            {topTracks.length > 0 && `${topTracks.length} lagu`}
            {artistInfo.followers && (
              <>
                <span className="mx-1">·</span>
                <span className="text-accent">{artistInfo.followers.toLocaleString()}</span> followers
              </>
            )}
          </p>
        </div>
      </div>

      {/* Top Tracks */}
      <div className="px-4 md:px-8 mt-6">
        {topTracks.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-4">Top Tracks</h2>
            <div className="space-y-1">
              {topTracks.map((track, idx) => (
                <TrackCard
                  key={track.id || idx}
                  track={track}
                  trackList={topTracks}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
