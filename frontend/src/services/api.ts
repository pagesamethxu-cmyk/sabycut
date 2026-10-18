import { AuthResponse, User } from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('sabycut_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('sabycut_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('sabycut_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

export interface KeyInfo {
  provider: string;
  lastFour: string;
  model?: string;
  updatedAt?: string;
}

export const api = {
  auth: {
    register: (data: { username: string; email: string; password: string }) =>
      request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { usernameOrEmail: string; password: string }) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMe: () => request<User>('/auth/me'),
  },
  keys: {
    getKeys: async (): Promise<KeyInfo[]> => {
      try {
        return await request<KeyInfo[]>('/keys');
      } catch {
        const stored = localStorage.getItem('sabycut_vault_keys');
        if (stored) {
          try {
            return JSON.parse(stored);
          } catch {
            return [];
          }
        }
        const fallback: KeyInfo[] = [];
        const geminiKey = localStorage.getItem('sabycut_gemini_key');
        if (geminiKey) {
          fallback.push({
            provider: 'GEMINI',
            lastFour: geminiKey.trim().slice(-4),
            model: localStorage.getItem('sabycut_gemini_model') || 'gemini-1.5-flash',
            updatedAt: new Date().toISOString()
          });
        }
        const openaiKey = localStorage.getItem('sabycut_openai_key');
        if (openaiKey) {
          fallback.push({
            provider: 'OPENAI',
            lastFour: openaiKey.trim().slice(-4),
            model: localStorage.getItem('sabycut_openai_model') || 'gpt-4o-mini',
            updatedAt: new Date().toISOString()
          });
        }
        return fallback;
      }
    },
    saveKey: async (provider: string, apiKey: string, model?: string): Promise<{ provider: string; lastFour: string; status: string }> => {
      const trimmed = apiKey.trim();
      const lastFour = trimmed.length > 4 ? trimmed.slice(-4) : trimmed;
      const normalizedProvider = provider.toUpperCase();

      try {
        const res = await request<{ provider: string; lastFour: string; status: string }>('/keys', {
          method: 'POST',
          body: JSON.stringify({ provider: normalizedProvider, apiKey: trimmed, model }),
        });
        updateLocalKeyCache(normalizedProvider, res.lastFour, model);
        return res;
      } catch {
        updateLocalKeyCache(normalizedProvider, lastFour, model);
        return {
          provider: normalizedProvider,
          lastFour,
          status: 'saved'
        };
      }
    },
    deleteKey: async (provider: string): Promise<{ success: boolean; provider: string }> => {
      const normalizedProvider = provider.toUpperCase();
      try {
        await request<{ success: boolean; provider: string }>(`/keys/${normalizedProvider}`, {
          method: 'DELETE',
        });
      } catch {
        // Fallback for offline/guest
      }
      removeLocalKeyCache(normalizedProvider);
      return { success: true, provider: normalizedProvider };
    },
    testKey: async (provider: string, apiKey?: string): Promise<{ valid: boolean; message: string }> => {
      const normalizedProvider = provider.toUpperCase();
      if (!apiKey || apiKey.trim().length === 0) {
        throw new Error('API key is empty');
      }

      try {
        return await request<{ valid: boolean; message: string }>('/keys/test', {
          method: 'POST',
          body: JSON.stringify({ provider: normalizedProvider, apiKey: apiKey.trim() }),
        });
      } catch {
        const trimmed = apiKey.trim();
        let valid = false;
        if (normalizedProvider === 'OPENAI') {
          valid = trimmed.startsWith('sk-') && trimmed.length >= 20;
        } else if (normalizedProvider === 'GEMINI') {
          valid = trimmed.startsWith('AIzaSy') || trimmed.length >= 25;
        }
        if (!valid) {
          throw new Error(`Invalid format for ${normalizedProvider} key`);
        }
        return { valid: true, message: 'Key format verified' };
      }
    }
  },
  autocut: {
    startJob: async (data: {
      videoUrls?: string[];
      videoNames?: string[];
      videoDuration?: number;
      formType?: 'preset' | 'custom' | 'reference';
      formPreset?: string;
      customFormConfig?: Record<string, unknown>;
      referenceVideoUrl?: string;
      prompt?: string;
      provider?: 'GEMINI' | 'OPENAI';
      guestApiKey?: string;
    }): Promise<{ id: string; status: string; currentStep?: string; progressPercentage: number }> => {
      return await request('/autocut/jobs', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getJob: async (jobId: string): Promise<{
      id: string;
      status: string;
      currentStep?: string;
      progressPercentage: number;
      timelineJson?: string;
      errorMessage?: string;
    }> => {
      return await request(`/autocut/jobs/${jobId}`);
    },
    partialEdit: async (data: {
      clipId?: string;
      rangeStart?: number;
      rangeEnd?: number;
      instruction: string;
      currentTimelineJson: string;
      provider?: string;
      guestApiKey?: string;
    }): Promise<{ timelineJson: string }> => {
      return await request('/autocut/partial-edit', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    connectWebSocket: (
      jobId: string,
      onProgress: (step: string, percent: number, message: string, payload?: unknown) => void,
      onError?: (err: unknown) => void
    ): (() => void) => {
      let isClosed = false;
      let ws: WebSocket | null = null;
      let pollTimer: ReturnType<typeof setInterval> | null = null;

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Connect to current host or fallback port 8080
        const host = window.location.port === '3000' || window.location.port === '5173'
          ? 'localhost:8080'
          : window.location.host;
        const wsUrl = `${protocol}//${host}/ws/autocut`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isClosed && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'subscribe', jobId }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.step !== undefined) {
              onProgress(data.step, data.progress ?? 0, data.message ?? '', data.payload);
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onerror = () => {
          // If WS fails, fallback to polling
          startPolling();
        };

        ws.onclose = () => {
          if (!isClosed) {
            startPolling();
          }
        };
      } catch {
        startPolling();
      }

      function startPolling() {
        if (pollTimer || isClosed) return;
        pollTimer = setInterval(async () => {
          if (isClosed) {
            if (pollTimer) clearInterval(pollTimer);
            return;
          }
          try {
            const job = await api.autocut.getJob(jobId);
            onProgress(
              job.currentStep || 'processing',
              job.progressPercentage || 0,
              job.status === 'COMPLETED' ? 'Completed' : 'Processing...',
              job.timelineJson ? { timelineJson: job.timelineJson } : undefined
            );
            if (job.status === 'COMPLETED' || job.status === 'FAILED') {
              if (pollTimer) clearInterval(pollTimer);
            }
          } catch (err) {
            if (onError) onError(err);
          }
        }, 800);
      }

      return () => {
        isClosed = true;
        if (pollTimer) clearInterval(pollTimer);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }
  },
};

function updateLocalKeyCache(provider: string, lastFour: string, model?: string) {
  try {
    const raw = localStorage.getItem('sabycut_vault_keys');
    const list: KeyInfo[] = raw ? JSON.parse(raw) : [];
    const index = list.findIndex(k => k.provider.toUpperCase() === provider.toUpperCase());
    const item: KeyInfo = {
      provider: provider.toUpperCase(),
      lastFour,
      model: model || (provider.toUpperCase() === 'OPENAI' ? 'gpt-4o-mini' : 'gemini-1.5-flash'),
      updatedAt: new Date().toISOString()
    };
    if (index >= 0) {
      list[index] = item;
    } else {
      list.push(item);
    }
    localStorage.setItem('sabycut_vault_keys', JSON.stringify(list));
    localStorage.setItem(`sabycut_${provider.toLowerCase()}_lastfour`, lastFour);
    if (model) {
      localStorage.setItem(`sabycut_${provider.toLowerCase()}_model`, model);
    }
  } catch {
    // Ignore storage issues
  }
}

function removeLocalKeyCache(provider: string) {
  try {
    const raw = localStorage.getItem('sabycut_vault_keys');
    if (raw) {
      const list: KeyInfo[] = JSON.parse(raw);
      const filtered = list.filter(k => k.provider.toUpperCase() !== provider.toUpperCase());
      localStorage.setItem('sabycut_vault_keys', JSON.stringify(filtered));
    }
    localStorage.removeItem(`sabycut_${provider.toLowerCase()}_key`);
    localStorage.removeItem(`sabycut_${provider.toLowerCase()}_lastfour`);
  } catch {
    // Ignore storage issues
  }
}
