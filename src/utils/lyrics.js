/**
 * Parse LRC format lyrics into structured array
 * Format: [mm:ss.xx] Lyric text
 * Also handles: [mm:ss.xxx] and plain [mm:ss] formats
 */
export function parseLRC(lrcString) {
  if (!lrcString || typeof lrcString !== 'string') return [];

  const lines = lrcString.split('\n');
  const result = [];

  for (const line of lines) {
    // Match [mm:ss.xx] or [mm:ss.xxx] or [mm:ss]
    const match = line.match(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fracStr = match[3] || '0';
      // Normalize fractional part to seconds
      let frac = 0;
      if (fracStr.length === 1) frac = parseInt(fracStr, 10) / 10;      // 0.1s precision
      else if (fracStr.length === 2) frac = parseInt(fracStr, 10) / 100; // 0.01s precision
      else if (fracStr.length === 3) frac = parseInt(fracStr, 10) / 1000; // 0.001s precision

      const time = minutes * 60 + seconds + frac;
      const text = match[4].trim();
      if (text) {
        result.push({ time, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

/**
 * Find the current lyric line index based on playback time.
 * Returns the index of the line whose time is <= currentTime.
 */
export function findCurrentLine(lyrics, currentTime) {
  if (!lyrics || lyrics.length === 0) return -1;

  let low = 0;
  let high = lyrics.length - 1;

  // If before first lyric, return -1
  if (currentTime < lyrics[0].time) return -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lyrics[mid].time <= currentTime) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return high;
}

/**
 * Format seconds to mm:ss
 */
export function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
