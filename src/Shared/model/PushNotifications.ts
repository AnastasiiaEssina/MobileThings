import { Application, ApplicationSettings, isAndroid, isIOS } from '@nativescript/core';
import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-messaging';
import { AuthorizationStatus } from '@nativescript/firebase-messaging';
import { deletePushToken, registerPushToken } from './api/PushApi';

let isInitialized = false;
let initializationPromise: Promise<ReturnType<ReturnType<typeof firebase>['messaging']>> | null =
  null;
const STORED_PUSH_TOKEN_KEY = 'push.lastRegisteredToken';
let lastRegisteredToken: string | null =
  ApplicationSettings.getString(STORED_PUSH_TOKEN_KEY, '') || null;
let activeAccessToken: string | null = null;

function isPermissionAllowed(status: AuthorizationStatus) {
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
}

function platformName() {
  return isIOS ? 'ios' : 'android';
}

function ensureFeedNotificationChannel() {
  if (!isAndroid || !Application.android?.context) {
    return;
  }

  if (android.os.Build.VERSION.SDK_INT < 26) {
    return;
  }

  const context = Application.android.context;
  const channel = new android.app.NotificationChannel(
    'feed',
    'Лента',
    android.app.NotificationManager.IMPORTANCE_DEFAULT
  );
  channel.setDescription('Новые посты авторов, на которых вы подписаны');

  const manager = context.getSystemService(
    android.content.Context.NOTIFICATION_SERVICE
  ) as android.app.NotificationManager;
  manager.createNotificationChannel(channel);
}

function rememberRegisteredToken(token: string | null) {
  lastRegisteredToken = token;
  if (token) {
    ApplicationSettings.setString(STORED_PUSH_TOKEN_KEY, token);
  } else {
    ApplicationSettings.remove(STORED_PUSH_TOKEN_KEY);
  }
}

async function registerCurrentPushToken(accessToken: string, pushToken: string) {
  await registerPushToken(accessToken, {
    token: pushToken,
    platform: platformName(),
  });
  rememberRegisteredToken(pushToken);
  console.log('Push token registered');
}

async function ensureFirebaseApp() {
  try {
    firebase().app();
    return;
  } catch {
    // Native Firebase can already be initialized by FirebaseInitProvider on Android.
  }

  try {
    await firebase().initializeApp();
  } catch (error) {
    try {
      firebase().app();
      return;
    } catch {
      throw error;
    }
  }
}

async function ensureFirebaseMessaging() {
  if (isInitialized) {
    return firebase().messaging();
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
      await ensureFirebaseApp();
      ensureFeedNotificationChannel();
      const messaging = firebase().messaging();
      messaging.showNotificationsWhenInForeground = true;
      messaging.onMessage((message) => {
        console.log('Push received', JSON.stringify(message));
      });
      messaging.onNotificationTap((message) => {
        console.log('Push tapped', JSON.stringify(message));
      });
      messaging.onToken((token) => {
        rememberRegisteredToken(null);
        console.log('Push token refreshed', token ? 'available' : 'empty');
        if (token && activeAccessToken) {
          void registerCurrentPushToken(activeAccessToken, token).catch((error) => {
            console.log('Push token refresh registration failed', error);
          });
        }
      });
      isInitialized = true;
      return messaging;
    })().finally(() => {
      initializationPromise = null;
    });
  }

  return initializationPromise;
}

export async function syncPushTokenForUser(accessToken?: string | null) {
  const token = accessToken?.trim();
  if (!token) {
    activeAccessToken = null;
    return;
  }

  activeAccessToken = token;

  try {
    const messaging = await ensureFirebaseMessaging();
    if (isAndroid) {
      try {
        await messaging.requestPermission();
      } catch (error) {
        console.log('Android notification permission request finished', error);
      }
    } else {
      const permissionStatus = await messaging.requestPermission({
        ios: {
          alert: true,
          badge: true,
          sound: true,
        },
      });

      if (!isPermissionAllowed(permissionStatus)) {
        return;
      }
    }

    await messaging.registerDeviceForRemoteMessages();
    const pushToken = await messaging.getToken();
    if (!pushToken || pushToken === lastRegisteredToken) {
      return;
    }

    await registerCurrentPushToken(token, pushToken);
  } catch (error) {
    console.log('Push setup failed', error);
  }
}

export async function removePushTokenForUser(accessToken?: string | null) {
  activeAccessToken = null;
  const token = accessToken?.trim();
  if (!token || !lastRegisteredToken) {
    return;
  }

  try {
    await deletePushToken(token, lastRegisteredToken);
    const messaging = await ensureFirebaseMessaging();
    await messaging.deleteToken();
    rememberRegisteredToken(null);
    console.log('Push token removed');
  } catch (error) {
    console.log('Push token removal failed', error);
  }
}
