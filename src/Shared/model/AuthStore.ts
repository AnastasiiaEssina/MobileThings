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
  name?: string | null;
  isGuest?: boolean | null;
  avatarDataUrl?: string | null;
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
    name: normalizeValue(session.name),
    isGuest: Boolean(session.isGuest),
    avatarDataUrl: normalizeValue(session.avatarDataUrl),
    expiresAt: normalizeValue(session.expiresAt),
  };
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const email = ref<string | null>(null);
  const name = ref<string | null>(null);
  const isGuest = ref(false);
  const avatarDataUrl = ref<string | null>(null);
  const expiresAt = ref<string | null>(null);
  const isHydrated = ref(false);
  const isRefreshing = ref(false);

  function applySession(session: SessionInput) {
    const nextSession = normalizeSession(session);

    accessToken.value = nextSession.accessToken;
    refreshToken.value = nextSession.refreshToken;
    email.value = nextSession.email;
    name.value = nextSession.name;
    isGuest.value = nextSession.isGuest;
    avatarDataUrl.value = nextSession.avatarDataUrl;
    expiresAt.value = nextSession.expiresAt;
  }

  function persistSession() {
    saveStoredSession({
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
      email: email.value,
      name: name.value,
      isGuest: isGuest.value,
      avatarDataUrl: avatarDataUrl.value,
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
      name: 'Гость',
      isGuest: true,
    });
  }

  function updateStoredProfile(profile: { email?: string | null; name?: string | null; avatar_data_url?: string | null }) {
    setSession({
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
      email: profile.email ?? email.value,
      name: profile.name ?? name.value,
      isGuest: false,
      avatarDataUrl: profile.avatar_data_url ?? null,
      expiresAt: expiresAt.value,
    });
  }

  async function initialize() {
    applySession(getStoredSession());

    if (isGuest.value) {
      applySession({
        name: name.value || 'Гость',
        isGuest: true,
      });
      persistSession();
      isHydrated.value = true;
      return;
    }

    if (!refreshToken.value) {
      if (accessToken.value) {
        logout();
        return;
      }

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
    name,
    isGuest,
    avatarDataUrl,
    expiresAt,
    isHydrated,
    isRefreshing,
    isAuthenticated: computed(() => Boolean(accessToken.value) || isGuest.value),
    isServerUser: computed(() => Boolean(accessToken.value) && !isGuest.value),
    initialize,
    setSession,
    updateStoredProfile,
    continueAsGuest,
    logout,
  };
});
