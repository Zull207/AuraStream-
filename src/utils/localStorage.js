const SEARCH_HISTORY_KEY = 'aurastream_search_history';
const RECENTLY_PLAYED_KEY = 'aurastream_recently_played';
const FAVORITES_KEY = 'aurastream_favorites';
const MAX_HISTORY = 50;
const MAX_RECENT = 100;

function getFromStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    console.warn('LocalStorage penuh atau tidak tersedia');
  }
}

// ── Search History ──

export function getSearchHistory() {
  return getFromStorage(SEARCH_HISTORY_KEY);
}

export function addSearchHistory(query) {
  if (!query || !query.trim()) return;
  const history = getSearchHistory();
  const filtered = history.filter(
    (item) => item.query.toLowerCase() !== query.toLowerCase()
  );
  filtered.unshift({
    query: query.trim(),
    timestamp: Date.now(),
  });
  saveToStorage(SEARCH_HISTORY_KEY, filtered.slice(0, MAX_HISTORY));
}

export function clearSearchHistory() {
  saveToStorage(SEARCH_HISTORY_KEY, []);
}

// ── Recently Played ──

export function getRecentlyPlayed() {
  return getFromStorage(RECENTLY_PLAYED_KEY);
}

export function addRecentlyPlayed(track) {
  if (!track || !track.id) return;
  const recent = getRecentlyPlayed();
  const filtered = recent.filter((item) => item.id !== track.id);
  filtered.unshift({
    id: track.id,
    name: track.name || track.title || 'Unknown',
    artist: track.artist || track.artists || 'Unknown',
    album: track.album || track.album_name || '',
    image: track.image || track.cover_url || '',
    duration: track.duration || 0,
    timestamp: Date.now(),
  });
  saveToStorage(RECENTLY_PLAYED_KEY, filtered.slice(0, MAX_RECENT));
}

export function clearRecentlyPlayed() {
  saveToStorage(RECENTLY_PLAYED_KEY, []);
}

export function clearAllHistory() {
  clearSearchHistory();
  clearRecentlyPlayed();
}

// ── Favorites / Likes ──

export function getFavorites() {
  return getFromStorage(FAVORITES_KEY);
}

export function isFavorite(trackId) {
  const favs = getFavorites();
  return favs.some((f) => f.id === trackId);
}

export function toggleFavorite(track) {
  if (!track || !track.id) return false;
  const favs = getFavorites();
  const idx = favs.findIndex((f) => f.id === track.id);
  if (idx >= 0) {
    // Remove from favorites
    favs.splice(idx, 1);
    saveToStorage(FAVORITES_KEY, favs);
    return false;
  } else {
    // Add to favorites
    favs.unshift({
      id: track.id,
      name: track.name || track.title || 'Unknown',
      artist: track.artist || track.artists || 'Unknown',
      image: track.image || track.cover_url || '',
      audio_url: track.audio_url || track.stream_url || '',
      duration: track.duration || 0,
      timestamp: Date.now(),
    });
    saveToStorage(FAVORITES_KEY, favs);
    return true;
  }
}
