import { create } from 'zustand';
import { api } from '../services/api';
import { addRecentlyPlayed } from '../utils/localStorage';
import { parseLRC, findCurrentLine } from '../utils/lyrics';

const audio = typeof Audio !== 'undefined' ? new Audio() : null;
let _rafId = null;
let _hasEnded = false;

function startLyricLoop(get, set) {
  if (_rafId) cancelAnimationFrame(_rafId);
  const tick = () => {
    const state = get();
    if (!state.isPlaying || !audio) { _rafId = null; return; }
    const ct = audio.currentTime;
    const dur = audio.duration || 0;
    let idx = state.currentLyricIndex;
    if (state.lyrics.length > 0) {
      idx = findCurrentLine(state.lyrics, ct);
    }
    // Only set if changed to avoid extra renders
    if (ct !== state.currentTime || dur !== state.duration || idx !== state.currentLyricIndex) {
      set({ currentTime: ct, duration: dur, currentLyricIndex: idx });
    }
    _rafId = requestAnimationFrame(tick);
  };
  _rafId = requestAnimationFrame(tick);
}

const usePlayerStore = create((set, get) => ({
  currentTrack: null,
  currentTrackIndex: -1,
  queue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  previousVolume: 0.8,
  isShuffled: false,
  repeatMode: 'off',
  lyrics: [],
  currentLyricIndex: -1,
  activeView: 'home',
  isLoading: false,
  error: null,
  audio,

  initAudio: () => {
    if (!audio || audio._aurastreamInit) return;
    audio._aurastreamInit = true;

    audio.addEventListener('timeupdate', () => {
      // Fallback for browsers that don't fire RAF well
      const state = get();
      if (!state.isPlaying) {
        set({ currentTime: audio.currentTime, duration: audio.duration || 0 });
      }
    });

    audio.addEventListener('play', () => {
      _hasEnded = false;
      set({ isPlaying: true });
      startLyricLoop(get, set);
    });

    audio.addEventListener('pause', () => {
      set({ isPlaying: false });
      if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
    });

    audio.addEventListener('ended', () => {
      if (_hasEnded) return; // prevent double-fire
      _hasEnded = true;
      if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }

      const state = get();
      if (state.repeatMode === 'one') {
        audio.currentTime = 0;
        _hasEnded = false;
        audio.play().catch(() => {});
        return;
      }

      const nextIndex = state.currentTrackIndex + 1;
      if (nextIndex < state.queue.length) {
        get().playTrack(state.queue[nextIndex]);
      } else if (state.repeatMode === 'all') {
        get().playTrack(state.queue[0]);
      } else {
        set({ isPlaying: false, currentTime: 0 });
      }
    });

    audio.addEventListener('error', (e) => {
      if (e.target?.error?.code !== MediaError.MEDIA_ERR_ABORTED) {
        console.error('[AuraStream] Audio error:', e);
        set({ error: 'Gagal memuat audio. Coba lagu lain.', isLoading: false });
      }
    });

    audio.volume = 0.8;
    audio.preload = 'auto';
  },

  playTrack: async (track, trackList = []) => {
    const state = get();
    set({ isLoading: true, error: null });
    _hasEnded = false;

    try {
      let audioUrl = track.audio_url || track.stream_url || '';
      if (!audioUrl && track.id) {
        audioUrl = await api.getAudioUrl(track.id);
      }
      if (!audioUrl) throw new Error('Audio tidak tersedia');

      // Build queue
      let newQueue = state.queue;
      let trackIndex = 0;
      if (trackList.length > 0) {
        newQueue = trackList.filter((t) => t.audio_url || t.stream_url);
        trackIndex = newQueue.findIndex((t) => t.id === track.id);
        if (trackIndex === -1) trackIndex = 0;
      }

      // Fetch lyrics
      let lyrics = [];
      try {
        let lrcString = '';
        if (track.id) lrcString = await api.getLyricsById(track.id);
        if (!lrcString) lrcString = await api.getLyrics(track.name || track.title || '', track.artist || '');
        if (lrcString && typeof lrcString === 'string') lyrics = parseLRC(lrcString);
      } catch { lyrics = []; }

      // Stop old playback
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.src = audioUrl;
        audio.load();
      }

      set({
        currentTrack: { ...track, audio_url: audioUrl },
        currentTrackIndex: trackIndex,
        queue: newQueue,
        lyrics,
        currentLyricIndex: -1,
        currentTime: 0,
        duration: 0,
        isLoading: false,
      });

      if (audio) {
        await audio.play();
        set({ isPlaying: true });
      }

      addRecentlyPlayed(track);
    } catch (err) {
      console.error('[AuraStream] playTrack error:', err);
      set({ isLoading: false, error: err.message });
    }
  },

  togglePlay: () => {
    const state = get();
    if (!audio || !state.currentTrack) return;
    if (state.isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  },

  playNext: () => {
    const state = get();
    if (state.queue.length === 0) return;

    let nextIndex = state.currentTrackIndex + 1;
    if (state.isShuffled) {
      nextIndex = Math.floor(Math.random() * state.queue.length);
    }

    if (nextIndex >= state.queue.length) {
      if (state.repeatMode === 'all') {
        nextIndex = 0;
      } else {
        set({ isPlaying: false });
        if (audio) audio.pause();
        return;
      }
    }

    const nextTrack = state.queue[nextIndex];
    if (nextTrack) get().playTrack(nextTrack);
  },

  playPrevious: () => {
    const state = get();
    if (state.queue.length === 0) return;

    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      set({ currentTime: 0 });
      return;
    }

    let prevIndex = state.currentTrackIndex - 1;
    if (prevIndex < 0) {
      prevIndex = state.repeatMode === 'all' ? state.queue.length - 1 : 0;
    }

    const prevTrack = state.queue[prevIndex];
    if (prevTrack) get().playTrack(prevTrack);
  },

  seekTo: (time) => {
    if (audio) {
      audio.currentTime = time;
      set({ currentTime: time });
      const state = get();
      if (state.lyrics.length > 0) {
        set({ currentLyricIndex: findCurrentLine(state.lyrics, time) });
      }
    }
  },

  setVolume: (vol) => {
    if (audio) audio.volume = vol;
    set({ volume: vol, isMuted: vol === 0 });
  },

  toggleMute: () => {
    const state = get();
    if (!audio) return;
    if (state.isMuted) {
      audio.volume = state.previousVolume || 0.8;
      set({ isMuted: false, volume: state.previousVolume || 0.8 });
    } else {
      set({ previousVolume: state.volume, isMuted: true, volume: 0 });
      audio.volume = 0;
    }
  },

  toggleShuffle: () => set((s) => ({ isShuffled: !s.isShuffled })),

  toggleRepeat: () => set((s) => {
    const modes = ['off', 'all', 'one'];
    return { repeatMode: modes[(modes.indexOf(s.repeatMode) + 1) % modes.length] };
  }),

  setActiveView: (view) => set({ activeView: view }),
  setError: (error) => set({ error }),
  addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),
}));

export default usePlayerStore;
