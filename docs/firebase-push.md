# Firebase push notifications

The mobile app prepares Firebase Cloud Messaging after the user is authenticated.
The current FCM token is stored locally under `push.firebaseToken` and is refreshed
when Firebase rotates the device token.

## Firebase project files

Add the Firebase configuration files before testing real push delivery:

- Android: `App_Resources/Android/src/google-services.json`
- iOS: `App_Resources/iOS/GoogleService-Info.plist`

Use the NativeScript app id from `nativescript.config.ts` when registering the
Android and iOS apps in Firebase.

## API handoff

The mobile client must send the FCM token to the backend after the push-token
endpoint exists. The backend should keep all active tokens for each user because
one user can sign in on more than one device.

The server-side Firebase Admin helper is prepared in
`server/push/sendPushToUser.ts`. It accepts a token store, loads tokens for one
user, sends a Firebase multicast notification, and asks the token store to remove
tokens Firebase reports as invalid.

The API service that imports this helper must install and initialize
`firebase-admin` with service credentials. Do not put Firebase Admin credentials
inside the mobile app.
