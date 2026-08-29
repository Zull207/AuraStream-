/**
 * AuraStream API Service — Spotify via justlann proxy
 *
 * Verified API format:
 * - Home:      { data: [{ section, items: [{ id, type, title, cover_url, stream_url }] }] }
 * - Search:    { data: [{ id, title, artists (string), album, duration ("4:55"), cover_url, stream_url }] }
 * - Album:     { data: { id, title, artists, cover_url, tracks: [{ id, title, artists, duration, stream_url }] } }
 * - Artist:    { data: { artist: { id, name, avatar_url }, top_tracks: [...] } }
 * - Lyrics:    { data: { lrc_format (LRC string), lines: [{ startTimeMs, words }] } }
 */

const BASE = window.location.hostname === 'localhost'
  ? '/api/music/spotify'
  : 'https://api.justlann.my.id/api/music/spotify';

async function fetchJSON(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === false) throw new Error(data.message || 'API error');
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timeout');
    throw err;
  }
}

// ── Duration parser: "4:55" → 295 ───────────────────────────

function parseDuration(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const parts = String(str).split(':');
  if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }
  return parseInt(str, 10) || 0;
}

// ── Normalizers ──────────────────────────────────────────────

function normalizeTrack(t, albumCover = '') {
  const cover = t.cover_url || albumCover || '';
  return {
    id: t.id,
    title: t.title || t.name || '',
    name: t.title || t.name || '',
    artist: t.artists || 'Unknown',
    artist_id: t.artist_id || '',
    album: t.album || '',
    album_id: t.album_id || '',
    image: cover,
    cover_url: cover,
    audio_url: t.stream_url || t.play_url || '',
    duration: parseDuration(t.duration),
    duration_raw: t.duration || '',
    explicit: t.is_explicit || false,
    track_number: t.track_number || 0,
    spotify_url: t.spotify_url || '',
  };
}

function normalizeArtist(a) {
  return {
    id: a.id,
    name: a.name || 'Unknown',
    image: a.avatar_url || a.cover_url || '',
    avatar_url: a.avatar_url || a.cover_url || '',
    followers: a.followers || 0,
    verified: a.verified || false,
    spotify_url: a.spotify_url || '',
  };
}

function normalizeAlbum(a) {
  return {
    id: a.id,
    title: a.title || a.name || 'Unknown',
    name: a.title || a.name || 'Unknown',
    artist: a.artists || 'Unknown',
    artist_id: a.artist_id || '',
    image: a.cover_url || '',
    cover_url: a.cover_url || '',
    total_tracks: a.total_tracks || 0,
    release_date: a.release_date || '',
    spotify_url: a.spotify_url || '',
  };
}

// ── Public API ───────────────────────────────────────────────

export const api = {
  /** Home feed: sections of playlists, albums, artists, charts */
  getHome: async () => {
    const data = await fetchJSON(`${BASE}/home`);
    const raw = data.data || [];
    const result = { charts: [], albums: [], newAlbums: [], artists: [], playlists: [], radios: [] };

    for (const sec of raw) {
      const items = (sec.items || []).map((item) => ({
        id: item.id,
        type: item.type || 'playlist',
        title: item.title || '',
        description: item.description || '',
        cover_url: item.cover_url || '',
        stream_url: item.stream_url || '',
        play_url: item.play_url || '',
        spotify_url: item.spotify_url || '',
      }));

      switch (sec.section) {
        case 'Featured Charts':
          result.charts = items;
          break;
        case 'Popular albums and singles':
          result.albums = items;
          break;
        case 'New releases for you':
          result.newAlbums = items;
          break;
        case 'Popular artists':
          result.artists = items;
          break;
        case 'Recommended for you':
          result.playlists = items;
          break;
        case 'Popular radio':
          result.radios = items;
          break;
      }
    }

    return result;
  },

  /** Get tracks inside a playlist */
  getPlaylistTracks: async (playlistId) => {
    const data = await fetchJSON(`${BASE}/playlist/${playlistId}`);
    const d = data.data || data;
    const info = {
      id: d.id || playlistId,
      title: d.title || d.name || '',
      description: d.description || '',
      cover_url: d.cover_url || '',
      total_tracks: d.total_tracks || 0,
    };
    const tracks = (d.tracks || d.data || []).map((t) => normalizeTrack(t, d.cover_url || ''));
    return { info, tracks };
  },

  /** Get playlist (alias) */
  getPlaylist: async (id) => api.getPlaylistTracks(id),

  /** Search tracks */
  searchTracks: async (query, limit = 20) => {
    const data = await fetchJSON(`${BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return (data.data || []).map(normalizeTrack);
  },

  /** Search artists */
  searchArtists: async (query, limit = 10) => {
    const data = await fetchJSON(`${BASE}/search-artist?q=${encodeURIComponent(query)}&limit=${limit}`);
    return (data.data || []).map(normalizeArtist);
  },

  /** Search albums */
  searchAlbums: async (query, limit = 10) => {
    const data = await fetchJSON(`${BASE}/search-album?q=${encodeURIComponent(query)}&limit=${limit}`);
    return (data.data || []).map(normalizeAlbum);
  },

  /** Single track detail */
  getTrack: async (id) => {
    const data = await fetchJSON(`${BASE}/track/${id}`);
    return normalizeTrack(data.data || data);
  },

  /** Artist overview + top tracks */
  getArtist: async (id) => {
    const data = await fetchJSON(`${BASE}/artist/${id}`);
    const raw = data.data || data;
    const artistRaw = raw.artist || raw;
    const artist = normalizeArtist(artistRaw);
    const tracks = (raw.top_tracks || raw.tracks || []).map((t) =>
      normalizeTrack(t, artist.image || '')
    );
    return { ...artist, top_tracks: tracks };
  },

  /** Album tracks — passes album cover to every track */
  getAlbum: async (id) => {
    const data = await fetchJSON(`${BASE}/album/${id}`);
    const d = data.data || data;
    const album = normalizeAlbum(d);
    const cover = album.cover_url || album.image || '';
    const tracks = (d.tracks || []).map((t) => ({
      ...normalizeTrack(t, cover),
      album: album.name || album.title || '',
      album_id: album.id,
    }));
    return { ...album, tracks };
  },

  /** Get audio stream URL (fallback) */
  getAudioUrl: async (id) => {
    try {
      const data = await fetchJSON(`${BASE}/audio/${id}?json=true`);
      return data.url || data.data?.url || '';
    } catch {
      return `${BASE}/audio/${id}`;
    }
  },

  /** Get synced lyrics by track ID */
  getLyricsById: async (trackId) => {
    try {
      const data = await fetchJSON(`${BASE}/lyrics/${trackId}`);
      const d = data.data || data;
      if (d.lrc_format) return d.lrc_format;
      if (d.lines && Array.isArray(d.lines)) {
        return d.lines
          .map((line) => {
            const ms = line.startTimeMs || 0;
            const mins = Math.floor(ms / 60000);
            const secs = Math.floor((ms % 60000) / 1000);
            const centis = Math.floor((ms % 1000) / 10);
            return `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}] ${line.words || ''}`;
          })
          .join('\n');
      }
      return '';
    } catch {
      return '';
    }
  },

  /** Get lyrics by query */
  getLyrics: async (trackTitle, artistName) => {
    try {
      const query = `${trackTitle} ${artistName}`.trim();
      const data = await fetchJSON(`${BASE}/lyrics?q=${encodeURIComponent(query)}`);
      const d = data.data || data;
      if (d.lrc_format) return d.lrc_format;
      if (d.lines && Array.isArray(d.lines)) {
        return d.lines
          .map((line) => {
            const ms = line.startTimeMs || 0;
            const mins = Math.floor(ms / 60000);
            const secs = Math.floor((ms % 60000) / 1000);
            const centis = Math.floor((ms % 1000) / 10);
            return `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}] ${line.words || ''}`;
          })
          .join('\n');
      }
      return '';
    } catch {
      return '';
    }
  },
};
