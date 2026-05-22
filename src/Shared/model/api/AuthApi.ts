type AuthResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    email: string;
  };
  error?: string;
};

import { API_BASE_URL } from './ApiConfig';

export type SessionPayload = {
  accessToken: string;
  refreshToken: string;
  email: string;
  expiresAt: string;
};

async function requestAuth(path: string, body: Record<string, string>): Promise<SessionPayload> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      `Не удалось подключиться к API (${API_BASE_URL}). Проверьте, что сервер запущен и доступен по сети.`
    );
  }

  const data = (await response.json()) as AuthResponse;

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка авторизации.');
  }

  const expiresAt = new Date(Date.now() + Number(data.expires_in ?? 0) * 1000).toISOString();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    email: data.user?.email ?? '',
    expiresAt,
  };
}

export function loginUser(email: string, password: string) {
  return requestAuth('/auth/login', { email, password });
}

export function refreshUserSession(refreshToken: string) {
  return requestAuth('/auth/refresh', { refresh_token: refreshToken });
}
