/**
 * Tiny Web Audio "ping" used when a new notification arrives. We use the
 * Web Audio API directly so we don't ship an audio asset, and so the user
 * can disable sound without us preloading anything.
 *
 * The AudioContext is lazily created on the first ping (browsers require
 * a user gesture, but the dropdown toggle / page click counts; if not
 * unlocked yet, ping() is a no-op).
 */

let ctx = null;

const getCtx = () => {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
    } catch (_e) {
      return null;
    }
  }
  return ctx;
};

/**
 * Play a short two-tone ping (~180ms). Silent if audio is unavailable.
 */
export const playNotificationPing = () => {
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === 'suspended') {
    // Browsers may suspend audio until a user gesture has happened. Try
    // to resume; if it fails, drop silently.
    audio.resume().catch(() => {});
  }

  const now = audio.currentTime;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  gain.connect(audio.destination);

  const osc1 = audio.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(880, now);
  osc1.frequency.linearRampToValueAtTime(1320, now + 0.18);
  osc1.connect(gain);
  osc1.start(now);
  osc1.stop(now + 0.22);
};
