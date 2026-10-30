import { Platform } from 'react-native';

const defaultApiHost = Platform.select({
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost',
});

const defaultBaseUrl = `http://${defaultApiHost}:4000`;

export const ENV = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL?.trim() || `${defaultBaseUrl}/api`).replace(/\/+$/, ''),
  socketUrl: (process.env.EXPO_PUBLIC_SOCKET_URL?.trim() || defaultBaseUrl).replace(/\/+$/, ''),
};
