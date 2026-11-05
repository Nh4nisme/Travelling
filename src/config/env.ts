import { Platform } from 'react-native';

// --- Cấu hình URL API và Socket ---
// Khi đổi mạng WiFi, chỉ cần cập nhật EXPO_PUBLIC_API_URL trong file .env
// (chạy ipconfig để lấy IP máy tính, ví dụ: EXPO_PUBLIC_API_URL=http://192.168.1.5:4000/api)
// socketUrl được tự động suy ra từ apiUrl (bỏ /api), không cần cấu hình riêng.

const defaultHost = Platform.select({
  android: '10.0.2.2',  // Android Emulator → host machine
  ios: 'localhost',
  default: 'localhost',
});

const defaultBaseUrl = `http://${defaultHost}:4000`;

const rawApiUrl = (process.env.EXPO_PUBLIC_API_URL?.trim() || `${defaultBaseUrl}/api`).replace(/\/+$/, '');

// Tự động suy ra socketUrl từ apiUrl (loại bỏ /api ở cuối)
const derivedSocketUrl = rawApiUrl.replace(/\/api\/?$/, '');

export const ENV = {
  apiUrl: rawApiUrl,
  socketUrl: (process.env.EXPO_PUBLIC_SOCKET_URL?.trim() || derivedSocketUrl).replace(/\/+$/, ''),
};
