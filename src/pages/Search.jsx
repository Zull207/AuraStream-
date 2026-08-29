import { useState, useCallback } from 'react';
import { Search as SearchIcon, X, Music, User, Disc, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import TrackCard from '../components/home/TrackCard';
import ArtistCard from '../components/home/ArtistCard';
import AlbumCard from '../components/home/AlbumCard';
import { addSearchHistory, getSearchHistory, clearSearchHistory } from '../utils/localStorage';
import clsx from 'clsx';

const tabs = [
  { id: 'tracks', label: 'Lagu', icon: Music },
  { id: 'artists', label: 'Artis', icon: User },
  { id: 'albums', label: 'Album', icon: Disc },
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('tracks');
  const [results, setResults] = useState({ tracks: [], artists: [], albums: [] });
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => getSearchHistory());
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setHasSearched(true);
    setError(null);
    addSearchHistory(searchQuery);
    setSearchHistory(getSearchHistory());

    try {
      const [tracks, artists, albums] = await Promise.allSettled([
        api.searchTracks(searchQuery),
        api.searchArtists(searchQuery),
        api.searchAlbums(searchQuery),
      ]);

      setResults({
        tracks: tracks.status === 'fulfilled' ? tracks.value : [],
        artists: artists.status === 'fulfilled' ? artists.value : [],
        albums: albums.status === 'fulfilled' ? albums.value : [],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header */}
      <h1 className="text-xl font-bold text-text-primary mb-4 tracking-tight">Cari</h1>

      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="relative mb-4">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <SearchIcon className="w-4 h-4 text-text-muted" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Lagu, artis, atau album..."
          className="w-full pl-10 pr-10 py-3 bg-bg-card text-text-primary rounded-xl text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/30 border border-white/[0.03]"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setHasSearched(false); setResults({ tracks: [], artists: [], albums: [] }); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted active:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Search History */}
      {!hasSearched && searchHistory.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-text-primary">Riwayat</h2>
            <button
              onClick={() => { clearSearchHistory(); setSearchHistory([]); }}
              className="text-[11px] text-text-muted active:text-accent"
            >
              Hapus
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.slice(0, 8).map((item, idx) => (
              <button
                key={idx}
                onClick={() => { setQuery(item.query); performSearch(item.query); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card rounded-full text-xs text-text-secondary active:text-accent border border-white/[0.03]"
              >
                <SearchIcon className="w-3 h-3" />
                {item.query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      {hasSearched && (
        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all',
                  activeTab === tab.id
                    ? 'gradient-accent-strong text-white shadow-lg'
                    : 'bg-bg-card text-text-secondary active:bg-bg-hover border border-white/[0.03]'
                )}
                style={activeTab === tab.id ? { boxShadow: '0 4px 15px rgba(167, 139, 250, 0.25)' } : {}}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="py-16 text-center">
          <AlertTriangle className="w-7 h-7 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-text-secondary mb-3">{error}</p>
          <button
            onClick={() => performSearch(query)}
            className="flex items-center gap-1.5 px-4 py-2 gradient-card text-white rounded-full text-xs active:scale-95 mx-auto border border-white/[0.05]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
          </button>
        </div>
      )}

      {/* Results */}
      {!loading && !error && hasSearched && (
        <div>
          {activeTab === 'tracks' && (
            results.tracks.length > 0 ? (
              <div>{results.tracks.map((t, i) => <TrackCard key={t.id} track={t} trackList={results.tracks} index={i + 1} />)}</div>
            ) : <EmptyState />
          )}
          {activeTab === 'artists' && (
            results.artists.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">{results.artists.map((a) => <ArtistCard key={a.id} artist={a} />)}</div>
            ) : <EmptyState />
          )}
          {activeTab === 'albums' && (
            results.albums.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">{results.albums.map((a) => <AlbumCard key={a.id} album={a} />)}</div>
            ) : <EmptyState />
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasSearched && searchHistory.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-3 opacity-50">
            <SearchIcon className="w-8 h-8 text-accent/60" />
          </div>
          <p className="text-sm text-text-secondary">Cari lagu favoritmu</p>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <Music className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
      <p className="text-xs text-text-muted">Tidak ada hasil</p>
    </div>
  );
}
