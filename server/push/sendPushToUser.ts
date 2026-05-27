import { getMessaging, type MulticastMessage } from 'firebase-admin/messaging';

export type UserPushTokenStore = {
  getTokensForUser(userId: string): Promise<string[]>;
  removeTokensForUser?(userId: string, tokens: string[]): Promise<void>;
};

export type UserPushMessage = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

export async function sendPushToUser(
  tokenStore: UserPushTokenStore,
  userId: string,
  push: UserPushMessage
) {
  const tokens = [...new Set(await tokenStore.getTokensForUser(userId))].filter(Boolean);

  if (!tokens.length) {
    return {
      successCount: 0,
      failureCount: 0,
      responses: [],
    };
  }

  const message: MulticastMessage = {
    tokens,
    notification: {
      title: push.title,
      body: push.body,
    },
    data: push.data,
    android: {
      priority: 'high',
    },
    apns: {
      headers: {
        'apns-priority': '10',
      },
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
  };

  const response = await getMessaging().sendEachForMulticast(message);
  const invalidTokens = response.responses
    .map((result, index) => (INVALID_TOKEN_CODES.has(result.error?.code ?? '') ? tokens[index] : null))
    .filter((token): token is string => Boolean(token));

  if (invalidTokens.length) {
    await tokenStore.removeTokensForUser?.(userId, invalidTokens);
  }

  return response;
}
