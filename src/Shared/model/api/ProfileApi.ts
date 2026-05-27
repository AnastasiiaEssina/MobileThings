import { API_BASE_URL } from './ApiConfig';

type ApiError = {
  error?: string;
};

type ProfileResponse = {
  user: {
    email: string;
    name: string;
    avatar_data_url?: string | null;
  };
};

async function requestProfile(
  path: string,
  accessToken: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers ?? {}),
    },
  });
  const data = (await response.json()) as ProfileResponse & ApiError;

  if (!response.ok) {
    throw new Error(data.error || 'Не удалось обновить профиль.');
  }

  return data.user;
}

export function updateAvatar(accessToken: string, avatarDataUrl: string) {
  return requestProfile('/users/me/avatar', accessToken, {
    method: 'PUT',
    body: JSON.stringify({ avatar_data_url: avatarDataUrl }),
  });
}

export function deleteAvatar(accessToken: string) {
  return requestProfile('/users/me/avatar', accessToken, {
    method: 'DELETE',
  });
}
