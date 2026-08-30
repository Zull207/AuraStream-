/**
 * AuraStream API Service — JustLann (primary) + YouTube Music (fallback)
 *
 * Strategy:
 * - Try JustLann first (Spotify quality)
 * - If JustLann fails → auto-switch to YouTube Music search + audio
 * - No conflicts: fallback only triggers when primary fails
 */

// ── Config ──────────────────────────────────────────────────

const JUSTLANN_BASE = 'https://api.justlann.my.id/api/music/spotify';
const INVIDIOUS_INSTANCES = [
  'https://invidious.privacyredirect.com',
  'https://iv.ggtyler.dev',
  'https://inv.tux.pizza',
  'https://yewtu.be',
  'https://invidious.protokolla.fi',
];

// Global state — justlann status
let _justlannOk = null; // null = unknown, true = working, false = down
let _checkedAt = 0;
const CHECK_INTERVAL = 5 * 60 * 1000; // re-check every 5 min

// ── Helpers ─────────────────────────────────────────────────

async function fetchJSON(url, timeout = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Request timeout');
    throw err;
  }
}

function parseDuration(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const parts = String(str).split(':');
  if (parts.length === 2) return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  return parseInt(str, 10) || 0;
}

// ── JustLann health check ──────────────────────────────────

async function checkJustLann() {
  const now = Date.now();
  if (_justlannOk !== null && now - _checkedAt < CHECK_INTERVAL) return _justlannOk;

  try {
    const data = await fetchJSON(`${JUSTLANN_BASE}/home`, 10000);
    _justlannOk = data && data.status !== false;
  } catch {
    _justlannOk = false;
  }
  _checkedAt = now;
  return _justlannOk;
}

// ── Invidious (YouTube) helpers ─────────────────────────────

let _activeInvidious = null;

async function findWorkingInvidious() {
  if (_activeInvidious) {
    try {
      await fetchJSON(`${_activeInvidious}/api/v1/search?q=test&type=video`, 5000);
      return _activeInvidious;
    } catch {
      _activeInvidious = null;
    }
  }

  for (const inst of INVIDIOUS_INSTANCES) {
    try {
      const data = await fetchJSON(`${inst}/api/v1/search?q=test&type=video`, 6000);
      if (Array.isArray(data)) {
        _activeInvidious = inst;
        return inst;
      }
    } catch { /* try next */ }
  }
  return null;
}

function getInvidiousStreamUrl(videoId) {
  const inst = _activeInvidious || INVIDIOUS_INSTANCES[0];
  return `${inst}/latest_version?id=${videoId}&itag=140`; // 140 = m4a audio
}

// ── Normalizers ─────────────────────────────────────────────

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

// ── JustLann API calls ─────────────────────────────────────

async function justlannGetHome() {
  const data = await fetchJSON(`${JUSTLANN_BASE}/home`);
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
      case 'Featured Charts': result.charts = items; break;
      case 'Popular albums and singles': result.albums = items; break;
      case 'New releases for you': result.newAlbums = items; break;
      case 'Popular artists': result.artists = items; break;
      case 'Recommended for you': result.playlists = items; break;
      case 'Popular radio': result.radios = items; break;
    }
  }
  return result;
}

async function justlannGetPlaylistTracks(playlistId) {
  const data = await fetchJSON(`${JUSTLANN_BASE}/playlist/${playlistId}`);
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
}

async function justlannSearchTracks(query, limit = 20) {
  const data = await fetchJSON(`${JUSTLANN_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  return (data.data || []).map(normalizeTrack);
}

async function justlannSearchArtists(query, limit = 10) {
  const data = await fetchJSON(`${JUSTLANN_BASE}/search-artist?q=${encodeURIComponent(query)}&limit=${limit}`);
  return (data.data || []).map(normalizeArtist);
}

async function justlannSearchAlbums(query, limit = 10) {
  const data = await fetchJSON(`${JUSTLANN_BASE}/search-album?q=${encodeURIComponent(query)}&limit=${limit}`);
  return (data.data || []).map(normalizeAlbum);
}

async function justlannGetArtist(id) {
  const data = await fetchJSON(`${JUSTLANN_BASE}/artist/${id}`);
  const raw = data.data || data;
  const artistRaw = raw.artist || raw;
  const artist = normalizeArtist(artistRaw);
  const tracks = (raw.top_tracks || raw.tracks || []).map((t) => normalizeTrack(t, artist.image || ''));
  return { ...artist, top_tracks: tracks };
}

async function justlannGetAlbum(id) {
  const data = await fetchJSON(`${JUSTLANN_BASE}/album/${id}`);
  const d = data.data || data;
  const album = normalizeAlbum(d);
  const cover = album.cover_url || album.image || '';
  const tracks = (d.tracks || []).map((t) => ({
    ...normalizeTrack(t, cover),
    album: album.name || album.title || '',
    album_id: album.id,
  }));
  return { ...album, tracks };
}

async function justlannGetLyrics(trackId) {
  const data = await fetchJSON(`${JUSTLANN_BASE}/lyrics/${trackId}`);
  const d = data.data || data;
  if (d.lrc_format) return d.lrc_format;
  if (d.lines && Array.isArray(d.lines)) {
    return d.lines.map((line) => {
      const ms = line.startTimeMs || 0;
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      const centis = Math.floor((ms % 1000) / 10);
      return `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}] ${line.words || ''}`;
    }).join('\n');
  }
  return '';
}

// ── YouTube fallback API calls ──────────────────────────────

async function ytFallbackSearchTracks(query, limit = 20) {
  const inst = await findWorkingInvidious();
  if (!inst) throw new Error('YouTube fallback tidak tersedia');

  const data = await fetchJSON(
    `${inst}/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
    10000
  );

  if (!Array.isArray(data)) return [];

  return data
    .filter((v) => v.type === 'video')
    .slice(0, limit)
    .map((v) => ({
      id: v.videoId,
      title: v.title || '',
      name: v.title || '',
      artist: v.author || 'Unknown',
      image: v.videoThumbnails?.find((t) => t.quality === 'medium')?.url
        || `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
      audio_url: getInvidiousStreamUrl(v.videoId),
      duration: parseInt(v.lengthSeconds, 10) || 0,
      cover_url: `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
      source: 'youtube',
    }));
}

async function ytFallbackSearchArtists(query, limit = 10) {
  const results = await ytFallbackSearchTracks(query, limit);
  // Dedupe by artist name
  const seen = new Set();
  return results
    .filter((r) => {
      if (seen.has(r.artist)) return false;
      seen.add(r.artist);
      return true;
    })
    .map((r) => ({
      id: r.artist,
      name: r.artist,
      image: r.image,
      avatar_url: r.image,
    }));
}

async function ytFallbackSearchAlbums(query, limit = 10) {
  const inst = await findWorkingInvidious();
  if (!inst) return [];

  const data = await fetchJSON(
    `${inst}/api/v1/search?q=${encodeURIComponent(query)} album&type=video`,
    10000
  );

  if (!Array.isArray(data)) return [];

  const seen = new Set();
  return data
    .filter((v) => v.type === 'video')
    .slice(0, limit * 2)
    .filter((v) => {
      const key = v.title?.substring(0, 30);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map((v) => ({
      id: v.videoId,
      title: v.title || '',
      name: v.title || '',
      artist: v.author || 'Unknown',
      image: `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
      cover_url: `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
      total_tracks: 1,
      source: 'youtube',
    }));
}

// ── Public API ──────────────────────────────────────────────

export const api = {
  /** Check if JustLann is available */
  isJustLannOk: () => _justlannOk,

  /** Force re-check JustLann status */
  refreshStatus: async () => {
    _justlannOk = null;
    _checkedAt = 0;
    return checkJustLann();
  },

  /** Get current fallback source */
  getSource: () => {
    if (_justlannOk === false) return 'youtube';
    return 'justlann';
  },

  /** Home feed */
  getHome: async () => {
    const ok = await checkJustLann();
    if (ok) {
      try { return await justlannGetHome(); } catch { /* fall through */ }
    }
    // Fallback: YouTube trending-style search
    try {
      const tracks = await ytFallbackSearchTracks('top hits 2025', 20);
      return {
        charts: [],
        albums: [],
        newAlbums: [],
        artists: [],
        playlists: [{ id: 'yt-trending', title: 'Top Hits (YouTube)', cover_url: '', items: tracks }],
        radios: [],
        source: 'youtube',
      };
    } catch {
      return { charts: [], albums: [], newAlbums: [], artists: [], playlists: [], radios: [] };
    }
  },

  /** Get playlist tracks */
  getPlaylistTracks: async (playlistId) => {
    if (_justlannOk !== false) {
      try { return await justlannGetPlaylistTracks(playlistId); } catch { /* fall through */ }
    }
    throw new Error('Playlist tidak tersedia');
  },

  /** Search tracks */
  searchTracks: async (query, limit = 20) => {
    const ok = await checkJustLann();
    if (ok) {
      try { return await justlannSearchTracks(query, limit); } catch { /* fall through */ }
    }
    return ytFallbackSearchTracks(query, limit);
  },

  /** Search artists */
  searchArtists: async (query, limit = 10) => {
    const ok = await checkJustLann();
    if (ok) {
      try { return await justlannSearchArtists(query, limit); } catch { /* fall through */ }
    }
    return ytFallbackSearchArtists(query, limit);
  },

  /** Search albums */
  searchAlbums: async (query, limit = 10) => {
    const ok = await checkJustLann();
    if (ok) {
      try { return await justlannSearchAlbums(query, limit); } catch { /* fall through */ }
    }
    return ytFallbackSearchAlbums(query, limit);
  },

  /** Get artist detail */
  getArtist: async (id) => {
    if (_justlannOk !== false) {
      try { return await justlannGetArtist(id); } catch { /* fall through */ }
    }
    // YouTube fallback: search by artist name
    const results = await ytFallbackSearchTracks(id, 10);
    return {
      id,
      name: id,
      image: results[0]?.image || '',
      top_tracks: results,
    };
  },

  /** Get album detail */
  getAlbum: async (id) => {
    if (_justlannOk !== false) {
      try { return await justlannGetAlbum(id); } catch { /* fall through */ }
    }
    throw new Error('Album tidak tersedia');
  },

  /** Get audio URL */
  getAudioUrl: async (id) => {
    if (_justlannOk !== false) {
      try {
        const data = await fetchJSON(`${JUSTLANN_BASE}/audio/${id}?json=true`);
        return data.url || data.data?.url || '';
      } catch { /* fall through */ }
    }
    return getInvidiousStreamUrl(id);
  },

  /** Get lyrics */
  getLyricsById: async (trackId) => {
    if (_justlannOk !== false) {
      try { return await justlannGetLyrics(trackId); } catch { return ''; }
    }
    return '';
  },

  getLyrics: async (trackTitle, artistName) => {
    if (_justlannOk !== false) {
      try {
        const query = `${trackTitle} ${artistName}`.trim();
        const data = await fetchJSON(`${JUSTLANN_BASE}/lyrics?q=${encodeURIComponent(query)}`);
        const d = data.data || data;
        if (d.lrc_format) return d.lrc_format;
        return '';
      } catch { return ''; }
    }
    return '';
  },
};
