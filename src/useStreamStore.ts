import { createWithEqualityFn } from 'zustand/traditional';
import { subscribeWithSelector } from 'zustand/middleware';

interface StreamConfig {
  relayUrl: string;
  streamKey: string;
}

type StreamStatus = 'offline' | 'connecting' | 'live' | 'error';

interface StreamState {
  config: StreamConfig;
  status: StreamStatus;
  errorMessage: string | null;
  isConfigured: boolean;
  setConfig: (config: StreamConfig) => void;
  setStatus: (status: StreamStatus) => void;
  setError: (message: string) => void;
  clearConfig: () => void;
  loadConfig: () => void;
}

const STORAGE_KEY = 'solarstorm-stream-config';

function readStoredConfig(): StreamConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.relayUrl === 'string' &&
      typeof parsed.streamKey === 'string'
    ) {
      return { relayUrl: parsed.relayUrl, streamKey: parsed.streamKey };
    }
    return null;
  } catch {
    return null;
  }
}

export const useStreamStore = createWithEqualityFn<StreamState>()(
  subscribeWithSelector((set, get) => ({
    config: { relayUrl: '', streamKey: '' },
    status: 'offline',
    errorMessage: null,
    isConfigured: false,
    setConfig: (config) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      } catch {
        // silently ignore storage errors
      }
      set(() => {
        return { config, isConfigured: true };
      });
    },
    setStatus: (status) =>
      set(() => {
        const currentError = get().errorMessage;
        return { 
          status, 
          errorMessage: status === 'error' ? currentError : null 
        };
      }),
    setError: (message) => {
      const key = get().config.streamKey;
      const sanitized =
        key.length > 0 ? message.replaceAll(key, '***') : message;
      set(() => {
        return { status: 'error', errorMessage: sanitized };
      });
    },
    clearConfig: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // silently ignore storage errors
      }
      set(() => {
        return {
          config: { relayUrl: '', streamKey: '' },
          isConfigured: false,
          status: 'offline',
          errorMessage: null,
        };
      });
    },
    loadConfig: () => {
      const stored = readStoredConfig();
      if (!stored) return;
      const isConfigured =
        stored.relayUrl.length > 0 && stored.streamKey.length > 0;
      set(() => {
        return { config: stored, isConfigured };
      });
    },
  }))
);

useStreamStore.getState().loadConfig();
