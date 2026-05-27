const API_BASE_URL = 'http://185.195.25.111:5000';

// Объявляем структуры данных для отправки, полностью совпадающие с вашей SQLite БД
export type ClothesSyncPayload = {
  id: string;
  remote_id: string | null;
  name: string;
  category: string;
  season: string;
  color_scheme: string;
  image_url: string | null;
  emoji: string | null;
  fill_color: string | null;
  source: 'user' | 'standard';
  is_in_wardrobe: number;
  is_deleted: number;
  sort_order: number;
  updated_at: string;
};

export type OutfitsSyncPayload = {
  id: string;
  remote_id: string | null;
  name: string;
  style: string;
  season: string;
  color_scheme: string;
  image_url: string;
  views: number;
  is_deleted: number;
  sort_order: number;
  updated_at: string;
};

// Структура тела запроса к вашему будущему бэкенду
export type SyncRequestPayload = {
  clothes: ClothesSyncPayload[];
  outfits: OutfitsSyncPayload[];
};

// Ответ от сервера
type SyncResponse = {
  success: boolean;
  // Сервер может вернуть обновленные remote_id или новые данные от других устройств
  message?: string;
  error?: string;
};

/**
 * Отправка локальных изменений гардероба на сервер
 */
export async function sendWardrobeSync(
  accessToken: string,
  payload: SyncRequestPayload
): Promise<SyncResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/sync/wardrobe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`, // JWT токен из авторизации
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      `Не удалось подключиться к серверу синхронизации. Проверьте сеть.`
    );
  }

  const data = (await response.json()) as SyncResponse;

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка в процессе синхронизации данных.');
  }

  return data;
}
