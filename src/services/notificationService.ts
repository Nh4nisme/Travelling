/**
 * notificationService.ts
 * Local notification service — dùng expo-notifications (không cần push server).
 * Mọi thông báo đều được kiểm tra cài đặt từ settingsStorage trước khi gửi.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { settingsStorage } from './settingsStorage';

// Key lưu mapping bookingId -> notificationId trong SecureStore
const SCHEDULED_KEY = 'scheduled_notifications_v1';

// Cấu hình cách hiển thị notification khi app đang foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Helpers storage ────────────────────────────────────────────────────────

type ScheduledMap = Record<string, string>; // bookingId -> notificationId

async function readScheduledMap(): Promise<ScheduledMap> {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      raw = globalThis.localStorage?.getItem(SCHEDULED_KEY) ?? null;
    } else {
      raw = await SecureStore.getItemAsync(SCHEDULED_KEY);
    }
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function writeScheduledMap(map: ScheduledMap): Promise<void> {
  try {
    const raw = JSON.stringify(map);
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(SCHEDULED_KEY, raw);
    } else {
      await SecureStore.setItemAsync(SCHEDULED_KEY, raw);
    }
  } catch {}
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const notificationService = {
  /**
   * Xin quyền hiển thị notification (cần gọi trước khi schedule).
   * Trả về true nếu được cấp phép.
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      if (existing === 'granted') return true;
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  },

  /**
   * Gửi local notification ngay lập tức (hoặc sau `seconds` giây).
   * Kiểm tra category setting trước khi gửi.
   * @param category - 'bookingUpdates' | 'messages' | 'promotions'
   */
  async scheduleLocal(
    title: string,
    body: string,
    options: {
      category?: keyof Awaited<ReturnType<typeof settingsStorage.getNotifications>>;
      seconds?: number;
      data?: Record<string, unknown>;
    } = {}
  ): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    try {
      const { category, seconds = 1, data = {} } = options;

      // Kiểm tra setting nếu có category
      if (category) {
        const settings = await settingsStorage.getNotifications();
        if (!settings[category]) return null;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: seconds <= 1
          ? null // ngay lập tức
          : { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
      });
      return id;
    } catch {
      return null;
    }
  },

  /**
   * Lên lịch nhắc check-in cho booking, lưu notificationId vào SecureStore.
   * Gọi sau khi đặt phòng thành công.
   */
  async scheduleCheckInReminder(
    bookingId: string,
    listingTitle: string,
    checkInDate: string, // 'YYYY-MM-DD'
    isVietnamese: boolean
  ): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      const settings = await settingsStorage.getNotifications();
      if (!settings.bookingUpdates) return;

      // Tính thời điểm nhắc = 1 ngày trước check-in lúc 9:00 sáng
      const checkIn = new Date(checkInDate + 'T09:00:00');
      const reminderDate = new Date(checkIn.getTime() - 24 * 60 * 60 * 1000);

      // Chỉ schedule nếu còn trong tương lai (hơn 2 phút nữa)
      if (reminderDate.getTime() - Date.now() < 2 * 60 * 1000) return;

      const secondsFromNow = Math.floor((reminderDate.getTime() - Date.now()) / 1000);

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: isVietnamese ? '🏨 Nhắc nhở nhận phòng' : '🏨 Check-in Reminder',
          body: isVietnamese
            ? `Nhận phòng tại ${listingTitle} vào ngày mai. Chúc bạn chuyến đi vui vẻ!`
            : `Check-in at ${listingTitle} is tomorrow. Have a great trip!`,
          data: { bookingId, type: 'checkin_reminder' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsFromNow,
        },
      });

      // Lưu mapping bookingId -> notificationId
      const map = await readScheduledMap();
      map[bookingId] = id;
      await writeScheduledMap(map);
    } catch {}
  },

  /**
   * Huỷ scheduled check-in reminder của booking.
   * Gọi khi user hủy booking.
   */
  async cancelCheckInReminder(bookingId: string): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      const map = await readScheduledMap();
      const notifId = map[bookingId];
      if (notifId) {
        await Notifications.cancelScheduledNotificationAsync(notifId);
        delete map[bookingId];
        await writeScheduledMap(map);
      }
    } catch {}
  },

  /**
   * Huỷ TẤT CẢ scheduled notifications (khi user tắt bookingUpdates).
   */
  async cancelAllScheduled(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await writeScheduledMap({});
    } catch {}
  },
};
