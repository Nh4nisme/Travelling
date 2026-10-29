import { Platform } from 'react-native';

const defaultApiHost = Platform.select({
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost',
});

export const ENV = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL?.trim() || `http://${defaultApiHost}:4000/api`).replace(/\/+$/, ''),
};
