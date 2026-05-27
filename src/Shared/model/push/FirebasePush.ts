import { Application, ApplicationSettings, isAndroid } from '@nativescript/core';
import { firebase } from '@nativescript/firebase-core';
import { AuthorizationStatus } from '@nativescript/firebase-messaging-core';

const PUSH_TOKEN_KEY = 'push.firebaseToken';
const ANDROID_NOTIFICATION_PERMISSION_REQUEST_CODE = 4801;

let initializationPromise: Promise<string | null> | null = null;
let firebaseInitialized = false;
let tokenListenerRegistered = false;

function requestAndroidNotificationPermission() {
  if (!isAndroid || android.os.Build.VERSION.SDK_INT < 33) {
    return;
  }

  const activity = Application.android.foregroundActivity ?? Application.android.startActivity;
  const permission = 'android.permission.POST_NOTIFICATIONS';

  if (
    !activity ||
    activity.checkSelfPermission(permission) ===
      android.content.pm.PackageManager.PERMISSION_GRANTED
  ) {
    return;
  }

  activity.requestPermissions([permission], ANDROID_NOTIFICATION_PERMISSION_REQUEST_CODE);
}

function saveFirebasePushToken(token: string | null) {
  if (!token) {
    ApplicationSettings.remove(PUSH_TOKEN_KEY);
    return;
  }

  ApplicationSettings.setString(PUSH_TOKEN_KEY, token);
}

export function getStoredFirebasePushToken() {
  return ApplicationSettings.getString(PUSH_TOKEN_KEY, '');
}

export async function prepareFirebasePushNotifications() {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      if (!firebaseInitialized) {
        await firebase().initializeApp();
        firebaseInitialized = true;
      }

      const messaging = firebase().messaging();
      messaging.showNotificationsWhenInForeground = true;

      requestAndroidNotificationPermission();

      const authorizationStatus = await messaging.requestPermission({
        ios: {
          alert: true,
          badge: true,
          sound: true,
        },
      });

      const canReceiveNotifications =
        isAndroid ||
        authorizationStatus === AuthorizationStatus.AUTHORIZED ||
        authorizationStatus === AuthorizationStatus.PROVISIONAL;

      if (!canReceiveNotifications) {
        return null;
      }

      await messaging.registerDeviceForRemoteMessages();

      if (!tokenListenerRegistered) {
        messaging.onToken((token) => saveFirebasePushToken(token));
        tokenListenerRegistered = true;
      }

      const token = await messaging.getToken();
      saveFirebasePushToken(token);

      return token;
    } catch (error) {
      console.warn('Firebase push notifications are not ready yet.', error);
      return null;
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

export async function deleteFirebasePushToken() {
  saveFirebasePushToken(null);

  try {
    await firebase().messaging().deleteToken();
  } catch (error) {
    console.warn('Firebase push token could not be deleted.', error);
  }
}
