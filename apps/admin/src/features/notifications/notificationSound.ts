import { useSyncExternalStore } from 'react';

const SOUND_URL = '/sounds/notification.mp3';
const MUTE_STORAGE_KEY = 'parfumbox.admin.notificationSound.muted';

let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!audio) {
    audio = new Audio(SOUND_URL);
    audio.preload = 'auto';
    audio.volume = 0.6;
  }
  return audio;
}

function readMutedFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

let muted = readMutedFromStorage();
const muteListeners = new Set<() => void>();

function notifyMuteListeners(): void {
  for (const listener of muteListeners) listener();
}

export function isNotificationSoundMuted(): boolean {
  return muted;
}

export function setNotificationSoundMuted(next: boolean): void {
  if (muted === next) return;
  muted = next;
  if (typeof window !== 'undefined') {
    try {
      if (next) {
        window.localStorage.setItem(MUTE_STORAGE_KEY, '1');
      } else {
        window.localStorage.removeItem(MUTE_STORAGE_KEY);
      }
    } catch {
      // ignore quota/security errors
    }
  }
  notifyMuteListeners();
}

function subscribeNotificationSoundMute(listener: () => void): () => void {
  muteListeners.add(listener);
  return () => {
    muteListeners.delete(listener);
  };
}

/**
 * Plays the admin notification chime. Safe to call rapidly: each call resets
 * playback so consecutive notifications retrigger the sound. Silently ignores
 * browser autoplay rejections (no prior user gesture, tab muted by OS, etc.).
 */
export function playNotificationSound(): void {
  if (muted) return;
  const el = getAudio();
  if (!el) return;
  try {
    el.currentTime = 0;
  } catch {
    // some browsers throw if metadata isn't loaded yet; ignore
  }
  const result = el.play();
  if (result && typeof result.catch === 'function') {
    result.catch(() => {
      // Autoplay blocked or transient playback error — non-fatal.
    });
  }
}

export function useNotificationSoundMuted(): boolean {
  return useSyncExternalStore(
    subscribeNotificationSoundMute,
    isNotificationSoundMuted,
    isNotificationSoundMuted,
  );
}
