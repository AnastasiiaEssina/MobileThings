import { ApplicationSettings, isAndroid, isIOS } from '@nativescript/core';
import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-messaging';
import { AuthorizationStatus } from '@nativescript/firebase-messaging';
import { deletePushToken, registerPushToken } from './api/PushApi';

let isInitialized = false;
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

async function ensureFirebaseMessaging() {
  if (!isInitialized) {
    await firebase().initializeApp();
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
  }

  return firebase().messaging();
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
    const permissionStatus = await messaging.requestPermission({
      ios: {
        alert: true,
        badge: true,
        sound: true,
      },
    });

    if (!isAndroid && !isPermissionAllowed(permissionStatus)) {
      return;
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
