import { Device } from '@nativescript/core';

type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    email: string;
    name: string;
  };
};

export type SessionPayload = {
  accessToken: string;
  refreshToken: string;
  email: string;
  expiresAt: string;
};

const EMULATOR_API_BASE_URL = 'http://10.0.2.2:5000';
const DEVICE_API_BASE_URL = 'http://10.63.93.86:5000';

function isAndroidEmulator() {
  const deviceInfo = `${String((Device as any).manufacturer ?? '')} ${String((Device as any).model ?? '')}`.toLowerCase();

  return (
    deviceInfo.includes('sdk') ||
    deviceInfo.includes('emulator') ||
    deviceInfo.includes('genymotion') ||
    deviceInfo.includes('x86')
  );
}

function getApiBaseUrl() {
  if (Device.os === 'Android') {
    return isAndroidEmulator() ? EMULATOR_API_BASE_URL : DEVICE_API_BASE_URL;
  }

  return DEVICE_API_BASE_URL;
}

async function requestAuth(
  path: string,
  body: Record<string, string>
): Promise<SessionPayload> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(
      `Не удалось подключиться к API (${getApiBaseUrl()}). Проверьте, что Flask-сервер запущен и телефон находится в той же сети.`
    );
  }

  const data = (await response.json()) as Partial<AuthResponse> & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка авторизации.');
  }

  const expiresIn = Number(data.expires_in ?? 0);
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    accessToken: String(data.access_token ?? ''),
    refreshToken: String(data.refresh_token ?? ''),
    email: String(data.user?.email ?? ''),
    expiresAt,
  };
}

export async function loginUser(email: string, password: string) {
  return requestAuth('/auth/login', {
    email,
    password,
  });
}

export async function refreshUserSession(refreshToken: string) {
  return requestAuth('/auth/refresh', {
    refresh_token: refreshToken,
  });
}
