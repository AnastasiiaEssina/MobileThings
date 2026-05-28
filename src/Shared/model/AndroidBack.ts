import {
  Application,
  type AndroidActivityBackPressedEventData,
} from '@nativescript/core';

export type AndroidBackHandler = (args: AndroidActivityBackPressedEventData) => void;

export function createAndroidBackListener(handler: AndroidBackHandler) {
  let isListening = false;

  function start() {
    if (!Application.android || isListening) {
      return;
    }

    Application.android.on(Application.android.activityBackPressedEvent, handler);
    isListening = true;
  }

  function stop() {
    if (!Application.android || !isListening) {
      return;
    }

    Application.android.off(Application.android.activityBackPressedEvent, handler);
    isListening = false;
  }

  return {
    start,
    stop,
  };
}
