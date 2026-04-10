import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { refreshUserSession } from './api/AuthApi';
import {
  clearStoredSession,
  getStoredSession,
  saveStoredSession,
  type StoredSession,
} from './AuthStorage';

type SessionInput = {
  accessToken?: string | null;
  refreshToken?: string | null;
  email?: string | null;
  expiresAt?: string | null;
};

function normalizeValue(value?: string | null) {
  const nextValue = value?.trim() ?? '';
  return nextValue.length ? nextValue : null;
}

function normalizeSession(session: SessionInput): StoredSession {
  return {
    accessToken: normalizeValue(session.accessToken),
    refreshToken: normalizeValue(session.refreshToken),
    email: normalizeValue(session.email),
    expiresAt: normalizeValue(session.expiresAt),
  };
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const email = ref<string | null>(null);
  const expiresAt = ref<string | null>(null);
  const isHydrated = ref(false);
  const isRefreshing = ref(false);

  function applySession(session: SessionInput) {
    const nextSession = normalizeSession(session);

    accessToken.value = nextSession.accessToken;
    refreshToken.value = nextSession.refreshToken;
    email.value = nextSession.email;
    expiresAt.value = nextSession.expiresAt;
  }

  function persistSession() {
    saveStoredSession({
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
      email: email.value,
      expiresAt: expiresAt.value,
    });
  }

  function setSession(session: SessionInput) {
    applySession(session);
    persistSession();
    isHydrated.value = true;
  }

  function logout() {
    applySession({});
    clearStoredSession();
    isHydrated.value = true;
  }

  function continueAsGuest() {
    setSession({
      accessToken: `guest-token-${Date.now()}`,
      email: 'guest@local',
    });
  }

  async function initialize() {
    applySession(getStoredSession());

    if (!refreshToken.value) {
      isHydrated.value = true;
      return;
    }

    isRefreshing.value = true;

    try {
      const nextSession = await refreshUserSession(refreshToken.value);
      setSession(nextSession);
    } catch {
      logout();
    } finally {
      isRefreshing.value = false;
      isHydrated.value = true;
    }
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
