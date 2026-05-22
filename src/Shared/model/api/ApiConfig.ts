declare const __DEV__: boolean;

const LOCAL_ANDROID_API_URL = 'http://10.0.2.2:5000';
const DEPLOYED_API_URL = 'http://185.195.25.111:5000';

export const API_BASE_URL =
  typeof __DEV__ !== 'undefined' && __DEV__ ? LOCAL_ANDROID_API_URL : DEPLOYED_API_URL;
