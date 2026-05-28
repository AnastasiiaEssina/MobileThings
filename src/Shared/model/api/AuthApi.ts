import { API_BASE_URL } from './ApiConfig';

type AuthResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    email: string;
    name: string;
    avatar_data_url?: string | null;
  };
  error?: string;
};

export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

export type SessionPayload = {
  accessToken: string;
  refreshToken: string;
  email: string;
  name: string;
  avatarDataUrl: string | null;
  expiresAt: string;
};

async function requestAuth(path: string, body: Record<string, string> = {}): Promise<SessionPayload> {
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
    throw new AuthApiError(
      `Не удалось подключиться к API (${API_BASE_URL}). Проверьте, что сервер запущен и доступен по сети.`
    );
  }

  const data = (await response.json()) as AuthResponse;

  if (!response.ok) {
    throw new AuthApiError(data.error || 'Ошибка авторизации.', response.status);
  }

  const expiresAt = new Date(Date.now() + Number(data.expires_in ?? 0) * 1000).toISOString();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    email: data.user?.email ?? '',
    name: data.user?.name ?? '',
    avatarDataUrl: data.user?.avatar_data_url ?? null,
    expiresAt,
  };
}

export function loginUser(email: string, password: string) {
  return requestAuth('/auth/login', { email, password });
}

export function registerUser(email: string, password: string, name: string) {
  return requestAuth('/auth/register', { email, password, name });
}

export function refreshUserSession(refreshToken: string) {
  return requestAuth('/auth/refresh', { refresh_token: refreshToken });
}
