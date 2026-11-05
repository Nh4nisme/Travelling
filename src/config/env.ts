import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Auto-detect IP từ Metro bundler qua Constants.expoConfig.hostUri
 * Không cần config EXPO_PUBLIC_API_URL trong .env nữa!
 * 
 * Cách hoạt động:
 * - Metro bundler expose hostUri (vd: "192.168.1.5:8081")
 * - Lấy IP từ hostUri.split(":")[0]
 * - Fallback: Android Emulator → 10.0.2.2, iOS/Web → localhost
 */

function resolveHost(): string {
  const hostUri = Constants.expoConfig?.hostUri; // vd "192.168.1.5:8081"
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    console.log('[env.ts] Auto-detected IP from Metro:', ip);
    return ip;
  }
  
  // Fallback cho emulator/simulator
  const fallback = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  console.log('[env.ts] Using fallback host:', fallback);
  return fallback;
}

const host = resolveHost();
const port = 4000; // Backend port

const baseUrl = `http://${host}:${port}`;

export const ENV = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? `${baseUrl}/api`,
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL ?? baseUrl,
};

console.log('[env.ts] API URL:', ENV.apiUrl);
console.log('[env.ts] Socket URL:', ENV.socketUrl);
