import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, RefreshCw, Play, ListMusic, Music, Sparkles } from 'lucide-react';
import logoImg from '../assets/logo.png';
import { api } from '../services/api';
import TrackCard from '../components/home/TrackCard';
import AlbumCard from '../components/home/AlbumCard';
import ArtistCard from '../components/home/ArtistCard';
import usePlayerStore from '../store/usePlayerStore';
import { getRecentlyPlayed } from '../utils/localStorage';

export default function Home() {
  const [homeData, setHomeData] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [recentTracks] = useState(() => getRecentlyPlayed().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { playTrack } = usePlayerStore();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHome();
      setHomeData(data);
    } catch (err) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePlaylistClick = async (item) => {
    setSelectedPlaylist(item);
    setLoadingPlaylist(true);
    try {
      const { tracks } = await api.getPlaylistTracks(item.id);
      setPlaylistTracks(tracks);
    } catch (err) {
      console.error('Gagal memuat playlist:', err);
    } finally {
      setLoadingPlaylist(false);
    }
  };

  const handlePlayAll = () => {
    const playable = playlistTracks.filter((t) => t.audio_url);
    if (playable.length > 0) playTrack(playable[0], playable);
  };

  const playlists = homeData?.playlists || [];
  const albums = homeData?.albums || [];
  const newAlbums = homeData?.newAlbums || [];
  const artists = homeData?.artists || [];

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-5 pb-3" style={{ background: 'linear-gradient(180deg, #09090b 0%, #09090b 70%, transparent 100%)' }}>
        <div className="flex items-center gap-2.5">
          <img src={logoImg} alt="AuraStream" className="w-9 h-9 rounded-lg object-cover shadow-lg" />
          <h1 className="text-xl font-bold text-text-primary tracking-tight">AuraStream</h1>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-xs text-text-secondary">Memuat musik...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="py-20 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-text-primary font-medium mb-1">Gagal memuat</p>
          <p className="text-xs text-text-secondary mb-4">{error}</p>
          <button onClick={fetchData} className="btn-accent flex items-center gap-2 px-5 py-2.5 rounded-full text-sm mx-auto">
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Recently Played */}
          {recentTracks.length > 0 && (
            <section className="mb-5">
              <h2 className="text-[15px] font-bold text-text-primary px-4 mb-2.5">Terakhir Diputar</h2>
              <div className="flex gap-2.5 px-4 overflow-x-auto pb-2 scrollbar-hide">
                {recentTracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => playTrack(track, recentTracks)}
                    className="shrink-0 w-[115px] text-left active:scale-[0.97] transition-all"
                  >
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-lg mb-2 gradient-card">
                      {track.image ? (
                        <img src={track.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Music className="w-5 h-5 text-text-muted/30" /></div>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-text-primary truncate">{track.name}</p>
                    <p className="text-[10px] text-text-secondary truncate">{track.artist}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Rekomendasi Untukmu */}
          {playlists.length > 0 && (
            <section className="mb-5">
              <div className="flex items-center gap-2 px-4 mb-2.5">
                <Sparkles className="w-4 h-4 text-accent" />
                <h2 className="text-[15px] font-bold text-text-primary">Rekomendasi Untukmu</h2>
              </div>
              <div className="flex gap-2.5 px-4 overflow-x-auto pb-2 scrollbar-hide">
                {playlists.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handlePlaylistClick(item)}
                    className={`shrink-0 w-[125px] text-left active:scale-[0.97] transition-all rounded-xl p-2 border ${
                      selectedPlaylist?.id === item.id
                        ? 'gradient-accent border-accent/20'
                        : 'gradient-card border-white/[0.03]'
                    }`}
                  >
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2 shadow-md">
                      {item.cover_url ? (
                        <img src={item.cover_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full gradient-card flex items-center justify-center">
                          <ListMusic className="w-5 h-5 text-text-muted/30" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-text-primary truncate">{item.title}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Selected Playlist Tracks */}
          {selectedPlaylist && (
            <section className="mb-5">
              <div className="flex items-center justify-between px-4 mb-2">
                <h2 className="text-[15px] font-bold text-text-primary truncate flex-1">{selectedPlaylist.title}</h2>
                {playlistTracks.length > 0 && (
                  <button
                    onClick={handlePlayAll}
                    className="flex items-center gap-1 px-3 py-1.5 gradient-accent-strong rounded-full text-[11px] font-medium text-white active:scale-95 transition-transform shrink-0 ml-2"
                  >
                    <Play className="w-3 h-3" fill="white" /> Putar
                  </button>
                )}
              </div>
              {loadingPlaylist ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="px-1">
                  {playlistTracks.length > 0 ? (
                    playlistTracks.map((track, index) => (
                      <TrackCard key={track.id} track={track} trackList={playlistTracks} index={index + 1} />
                    ))
                  ) : (
                    <p className="text-center text-text-muted text-xs py-8">Tidak ada lagu</p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Album Populer */}
          {albums.length > 0 && (
            <section className="mb-5">
              <h2 className="text-[15px] font-bold text-text-primary px-4 mb-2.5">Album Populer</h2>
              <div className="flex gap-2.5 px-4 overflow-x-auto pb-2 scrollbar-hide">
                {albums.map((item) => (
                  <div key={item.id} className="shrink-0 w-[135px]">
                    <AlbumCard album={item} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Album Baru */}
          {newAlbums.length > 0 && (
            <section className="mb-5">
              <h2 className="text-[15px] font-bold text-text-primary px-4 mb-2.5">Album Baru</h2>
              <div className="flex gap-2.5 px-4 overflow-x-auto pb-2 scrollbar-hide">
                {newAlbums.map((item) => (
                  <div key={item.id} className="shrink-0 w-[135px]">
                    <AlbumCard album={item} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Artis Populer */}
          {artists.length > 0 && (
            <section className="mb-5">
              <h2 className="text-[15px] font-bold text-text-primary px-4 mb-2.5">Artis Populer</h2>
              <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide">
                {artists.map((item) => (
                  <div key={item.id} className="shrink-0">
                    <ArtistCard artist={{
                      id: item.id,
                      name: item.title || item.name || 'Unknown',
                      avatar_url: item.cover_url || '',
                      image: item.cover_url || '',
                      cover_url: item.cover_url || '',
                    }} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty */}
          {!playlists.length && !albums.length && !artists.length && (
            <div className="py-20 text-center px-6">
              <div className="w-20 h-20 rounded-full gradient-accent flex items-center justify-center mx-auto mb-4 opacity-50">
                <TrendingUp className="w-10 h-10 text-accent/60" />
              </div>
              <p className="text-text-primary font-medium mb-1">Tidak ada data</p>
              <p className="text-xs text-text-secondary mb-4">Server sedang tidak tersedia</p>
              <button onClick={fetchData} className="btn-accent flex items-center gap-2 px-5 py-2.5 rounded-full text-sm mx-auto">
                <RefreshCw className="w-4 h-4" /> Muat Ulang
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
