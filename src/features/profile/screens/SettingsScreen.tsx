import React, { useState } from 'react';
import { View, Text, Alert, Modal, Pressable } from 'react-native';

import { SettingRow } from '../components/SettingRow';
import { c, S } from '@/constants/theme';
import type { ThemeOption } from '../types';

const THEME_OPTIONS: { label: string; value: ThemeOption }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

const THEME_LABELS: Record<ThemeOption, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export function SettingsScreen() {
  const [theme, setTheme] = useState<ThemeOption>('system');
  const [showThemeModal, setShowThemeModal] = useState(false);

  const handleThemeSelect = (selectedTheme: ThemeOption) => {
    setTheme(selectedTheme);
    setShowThemeModal(false);

    // Dark and System themes are placeholders
    if (selectedTheme === 'dark') {
      Alert.alert('Coming Soon', 'Dark theme will be available in a future update.');
    } else if (selectedTheme === 'system') {
      Alert.alert('Coming Soon', 'System theme will follow your device settings in a future update.');
    }
  };

  const handlePrivacyPress = () => {
    Alert.alert('Coming Soon', 'Privacy settings will be available in a future update.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>


      <View style={[S.pad, { flex: 1 }]}>
        <Text style={[S.muted, { marginVertical: 12 }]}>PREFERENCES</Text>

        <View style={S.box}>
          <SettingRow
            label="Language"
            type="select"
            value="English"
            onPress={() => Alert.alert('Coming Soon', 'Language selection will be available in a future update.')}
          />
          <SettingRow
            label="Theme"
            type="select"
            value={THEME_LABELS[theme]}
            onPress={() => setShowThemeModal(true)}
          />
        </View>

        <Text style={[S.muted, { marginVertical: 12 }]}>ACCOUNT</Text>

        <View style={S.box}>
          <SettingRow
            label="Privacy"
            type="navigate"
            onPress={handlePrivacyPress}
          />
        </View>
      </View>

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setShowThemeModal(false)}
        >
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '80%', maxWidth: 300 }}>
            <Text style={[S.h2, { marginBottom: 16, textAlign: 'center' }]}>Select Theme</Text>
            {THEME_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  S.row,
                  {
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderColor: c.soft,
                    justifyContent: 'space-between',
                  },
                ]}
                onPress={() => handleThemeSelect(option.value)}
              >
                <Text style={{ fontSize: 16, color: c.t }}>{option.label}</Text>
                {theme === option.value && (
                  <Text style={{ color: c.p, fontWeight: '600' }}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
