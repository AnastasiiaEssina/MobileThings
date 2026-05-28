import { API_BASE_URL } from './ApiConfig';

type PushTokenPayload = {
  token: string;
  platform: 'android' | 'ios';
};

async function requestPushToken(
  path: string,
  accessToken: string,
  options: RequestInit
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers ?? {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new Error(data.error || 'Не удалось обновить push-токен.');
  }

  return data;
}

export function registerPushToken(accessToken: string, payload: PushTokenPayload) {
  return requestPushToken('/users/me/push-token', accessToken, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deletePushToken(accessToken: string, token: string) {
  return requestPushToken('/users/me/push-token', accessToken, {
    method: 'DELETE',
    body: JSON.stringify({ token }),
  });
}
