import { ApplicationSettings } from '@nativescript/core';

const ACCESS_TOKEN_KEY = 'auth.accessToken';
const REFRESH_TOKEN_KEY = 'auth.refreshToken';
const AUTH_EMAIL_KEY = 'auth.email';
const EXPIRES_AT_KEY = 'auth.expiresAt';

export type StoredSession = {
  accessToken: string | null;
  refreshToken: string | null;
  email: string | null;
  expiresAt: string | null;
};

export function getStoredSession(): StoredSession {
  return {
    accessToken: ApplicationSettings.getString(ACCESS_TOKEN_KEY, ''),
    refreshToken: ApplicationSettings.getString(REFRESH_TOKEN_KEY, ''),
    email: ApplicationSettings.getString(AUTH_EMAIL_KEY, ''),
    expiresAt: ApplicationSettings.getString(EXPIRES_AT_KEY, ''),
  };
}

export function saveStoredSession(session: StoredSession) {
  ApplicationSettings.setString(ACCESS_TOKEN_KEY, session.accessToken ?? '');
  ApplicationSettings.setString(REFRESH_TOKEN_KEY, session.refreshToken ?? '');
  ApplicationSettings.setString(AUTH_EMAIL_KEY, session.email ?? '');
  ApplicationSettings.setString(EXPIRES_AT_KEY, session.expiresAt ?? '');
}

export function clearStoredSession() {
  ApplicationSettings.remove(ACCESS_TOKEN_KEY);
  ApplicationSettings.remove(REFRESH_TOKEN_KEY);
  ApplicationSettings.remove(AUTH_EMAIL_KEY);
  ApplicationSettings.remove(EXPIRES_AT_KEY);
}
