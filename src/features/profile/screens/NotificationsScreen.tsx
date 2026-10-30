import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SettingRow } from '../components/SettingRow';
import { c, S } from '@/constants/theme';
import { settingsStorage, type NotificationSettings } from '@/services/settingsStorage';

export function NotificationsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>({
    bookingUpdates: true,
    promotions: false,
    messages: true,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await settingsStorage.getNotifications();
      setSettings(saved);
      setLoaded(true);
    })();
  }, []);

  const handleToggle = (key: keyof NotificationSettings) => (value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    void settingsStorage.saveNotifications(updated);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={[S.pad, { flex: 1 }]}>
        <Text style={[S.muted, { marginVertical: 14 }]}>
          Choose the notifications you want to receive on this device.
        </Text>

        <View style={S.box}>
          <SettingRow
            label="Booking updates"
            type="toggle"
            isToggled={settings.bookingUpdates}
            onToggle={handleToggle('bookingUpdates')}
          />
          <SettingRow
            label="Messages & Inquiries"
            type="toggle"
            isToggled={settings.messages}
            onToggle={handleToggle('messages')}
          />
          <SettingRow
            label="Promotions & Deals"
            type="toggle"
            isToggled={settings.promotions}
            onToggle={handleToggle('promotions')}
          />
        </View>

        <Text style={[S.muted, { fontSize: 13, marginTop: 12, paddingHorizontal: 4 }]}>
          Booking updates include check-in reminders, schedule changes, and host confirmations.
        </Text>
      </View>
    </View>
  );
}
