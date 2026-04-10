import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  clearStoredSession,
  getStoredSession,
  saveStoredSession,
  type StoredSession,
} from './AuthStorage';
import { refreshUserSession } from './api/AuthApi';

function normalizeStoredValue(value: string | null) {
  const nextValue = value?.trim() ?? '';
  return nextValue.length ? nextValue : null;
}

function normalizeSession(session: StoredSession): StoredSession {
  return {
    accessToken: normalizeStoredValue(session.accessToken),
    refreshToken: normalizeStoredValue(session.refreshToken),
    email: normalizeStoredValue(session.email),
    expiresAt: normalizeStoredValue(session.expiresAt),
  };
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const email = ref<string | null>(null);
  const expiresAt = ref<string | null>(null);
  const isHydrated = ref(false);
  const isRefreshing = ref(false);

  function applySession(session: StoredSession) {
    accessToken.value = normalizeStoredValue(session.accessToken);
    refreshToken.value = normalizeStoredValue(session.refreshToken);
    email.value = normalizeStoredValue(session.email);
    expiresAt.value = normalizeStoredValue(session.expiresAt);
  }

  function persistCurrentSession() {
    saveStoredSession({
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
      email: email.value,
      expiresAt: expiresAt.value,
    });
  }

  async function initialize() {
    const storedSession = normalizeSession(getStoredSession());
    applySession(storedSession);

    if (storedSession.refreshToken) {
      isRefreshing.value = true;

      try {
        const nextSession = await refreshUserSession(storedSession.refreshToken);
        setSession(nextSession);
      } catch {
        logout();
      } finally {
        isRefreshing.value = false;
      }
    }

    isHydrated.value = true;
  }

  function setSession(payload: {
    accessToken: string;
    refreshToken?: string | null;
    email?: string | null;
    expiresAt?: string | null;
  }) {
    accessToken.value = payload.accessToken;
    refreshToken.value = normalizeStoredValue(payload.refreshToken ?? null);
    email.value = normalizeStoredValue(payload.email ?? null);
    expiresAt.value = normalizeStoredValue(payload.expiresAt ?? null);
    persistCurrentSession();
    isHydrated.value = true;
  }

  function continueAsGuest() {
    setSession({
      accessToken: `guest-token-${Date.now()}`,
      refreshToken: null,
      email: 'guest@local',
      expiresAt: null,
    });
  }

  function logout() {
    accessToken.value = null;
    refreshToken.value = null;
    email.value = null;
    expiresAt.value = null;
    clearStoredSession();
    isHydrated.value = true;
  }

  return {
    accessToken,
    refreshToken,
    email,
    expiresAt,
    isHydrated,
    isRefreshing,
    isAuthenticated: computed(() => Boolean(accessToken.value)),
    initialize,
    setSession,
    continueAsGuest,
    logout,
  };
});
