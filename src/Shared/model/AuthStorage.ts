import { ApplicationSettings } from '@nativescript/core';

const AUTH_TOKEN_KEY = 'auth.token';
const AUTH_EMAIL_KEY = 'auth.email';

export type StoredSession = {
  token: string | null;
  email: string | null;
};

export function getStoredSession(): StoredSession {
  return {
    token: ApplicationSettings.getString(AUTH_TOKEN_KEY, ''),
    email: ApplicationSettings.getString(AUTH_EMAIL_KEY, ''),
  };
}

export function saveStoredSession(session: { token: string; email?: string | null }) {
  ApplicationSettings.setString(AUTH_TOKEN_KEY, session.token);
  ApplicationSettings.setString(AUTH_EMAIL_KEY, session.email ?? '');
}

export function clearStoredSession() {
  ApplicationSettings.remove(AUTH_TOKEN_KEY);
  ApplicationSettings.remove(AUTH_EMAIL_KEY);
}
