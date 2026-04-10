import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  clearStoredSession,
  getStoredSession,
  saveStoredSession,
} from './AuthStorage';

function normalizeStoredValue(value: string | null) {
  const nextValue = value?.trim() ?? '';
  return nextValue.length ? nextValue : null;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null);
  const email = ref<string | null>(null);
  const isHydrated = ref(false);

  function initialize() {
    const session = getStoredSession();
    token.value = normalizeStoredValue(session.token);
    email.value = normalizeStoredValue(session.email);
    isHydrated.value = true;
  }

  function setSession(payload: { token: string; email?: string | null }) {
    token.value = payload.token;
    email.value = normalizeStoredValue(payload.email ?? null);
    saveStoredSession({
      token: payload.token,
      email: email.value,
    });
    isHydrated.value = true;
  }

  function continueAsGuest() {
    setSession({
      token: `guest-token-${Date.now()}`,
      email: 'guest@local',
    });
  }

  function logout() {
    token.value = null;
    email.value = null;
    clearStoredSession();
    isHydrated.value = true;
  }

  return {
    token,
    email,
    isHydrated,
    isAuthenticated: computed(() => Boolean(token.value)),
    initialize,
    setSession,
    continueAsGuest,
    logout,
  };
});
