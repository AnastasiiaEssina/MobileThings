import type { Clothing, Outfit } from '../Wardrobe';
import { API_BASE_URL } from './ApiConfig';

type ApiError = {
  error?: string;
};

export type PublicationItem = {
  id: number;
  name: string;
  image_url?: string | null;
  emoji?: string | null;
  fill_color?: string | null;
};

export type FeedPublication = {
  id: number;
  source_outfit_id: string;
  name: string;
  style: Outfit['style'];
  season: Outfit['season'];
  color_scheme: Outfit['colorScheme'];
  views: number;
  created_at: string;
  author: {
    id: number;
    name: string;
  };
  is_following: boolean;
  is_own_author: boolean;
  items: PublicationItem[];
};

type FeedResponse = {
  publications: FeedPublication[];
};

function validToken(accessToken?: string | null) {
  const token = accessToken?.trim() ?? '';
  return token;
}

async function requestJson<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null
) {
  const token = validToken(accessToken);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const data = (await response.json()) as T & ApiError;

  if (!response.ok) {
    throw new Error(data.error || 'Не удалось выполнить запрос к API.');
  }

  return data;
}

function requireUserToken(accessToken?: string | null) {
  const token = validToken(accessToken);
  if (!token) {
    throw new Error('Войдите в аккаунт, чтобы продолжить.');
  }

  return token;
}

export async function getFeed(accessToken?: string | null) {
  const result = await requestJson<FeedResponse>('/feed', {}, accessToken);
  return result.publications;
}

export function publishOutfit(
  accessToken: string | null | undefined,
  outfit: Outfit,
  items: Clothing[]
) {
  return requestJson<FeedPublication>(
    '/publications',
    {
      method: 'POST',
      body: JSON.stringify({
        source_outfit_id: outfit.id,
        name: outfit.name,
        style: outfit.style,
        season: outfit.season,
        color_scheme: outfit.colorScheme,
        items: items.map((item) => ({
          name: item.name,
          image_url: item.imageUrl,
          emoji: item.emoji,
          fill_color: item.fillColor,
        })),
      }),
    },
    requireUserToken(accessToken)
  );
}

export async function countPublicationView(
  publicationId: number,
  accessToken: string | null | undefined
) {
  return requestJson<{ views: number; counted: boolean }>(
    `/publications/${publicationId}/view`,
    {
      method: 'POST',
    },
    requireUserToken(accessToken)
  );
}

export async function setAuthorFollowed(
  accessToken: string | null | undefined,
  authorId: number,
  followed: boolean
) {
  return requestJson<{ following: boolean }>(
    `/authors/${authorId}/follow`,
    {
      method: followed ? 'DELETE' : 'POST',
    },
    requireUserToken(accessToken)
  );
}
