import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SettingRow } from '../components/SettingRow';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { settingsStorage, type NotificationSettings } from '@/services/settingsStorage';

export function NotificationsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16, flex: 1 }}>
        <Text style={{ fontSize: 14, color: colors.muted, marginVertical: 14 }}>
          {t.notifications.subtitle}
        </Text>

        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16 }}>
          <SettingRow
            label={t.notifications.bookingUpdates}
            type="toggle"
            isToggled={settings.bookingUpdates}
            onToggle={handleToggle('bookingUpdates')}
          />
          <SettingRow
            label={t.notifications.messages}
            type="toggle"
            isToggled={settings.messages}
            onToggle={handleToggle('messages')}
          />
          <SettingRow
            label={t.notifications.promotions}
            type="toggle"
            isToggled={settings.promotions}
            onToggle={handleToggle('promotions')}
          />
        </View>

        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 12, paddingHorizontal: 4 }}>
          {t.notifications.description}
        </Text>
      </View>
    </View>
  );
}
