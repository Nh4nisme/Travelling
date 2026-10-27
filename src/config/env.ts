/**
 * Địa chỉ backend. Đặt trong file .env ở thư mục gốc project Expo:
 *   EXPO_PUBLIC_API_URL=http://192.168.1.10:4000/api
 * (Điện thoại thật phải dùng IP LAN của máy tính, KHÔNG dùng localhost.)
 */
export const ENV = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, ''),
};
