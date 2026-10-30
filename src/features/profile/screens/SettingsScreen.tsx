import React, { useEffect, useState } from 'react';
import { View, Text, Alert, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingRow } from '../components/SettingRow';
import { c, S } from '@/constants/theme';
import { settingsStorage, type AppPreferences } from '@/services/settingsStorage';
import type { ThemeOption } from '../types';

const THEME_OPTIONS: { label: string; value: ThemeOption }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

const LANGUAGE_OPTIONS: { label: string; value: 'English' | 'Tiếng Việt' }[] = [
  { label: 'English (US)', value: 'English' },
  { label: 'Tiếng Việt', value: 'Tiếng Việt' },
];

export function SettingsScreen() {
  const [prefs, setPrefs] = useState<AppPreferences>({
    theme: 'system',
    language: 'English',
  });
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await settingsStorage.getPreferences();
      setPrefs(saved);
    })();
  }, []);

  const handleThemeSelect = (selectedTheme: ThemeOption) => {
    const next = { ...prefs, theme: selectedTheme };
    setPrefs(next);
    void settingsStorage.savePreferences(next);
    setShowThemeModal(false);
  };

  const handleLangSelect = (selectedLang: 'English' | 'Tiếng Việt') => {
    const next = { ...prefs, language: selectedLang };
    setPrefs(next);
    void settingsStorage.savePreferences(next);
    setShowLangModal(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[S.muted, { marginBottom: 8 }]}>PREFERENCES</Text>
        <View style={S.box}>
          <SettingRow
            label="Language"
            type="select"
            value={prefs.language}
            onPress={() => setShowLangModal(true)}
          />
          <SettingRow
            label="Theme"
            type="select"
            value={prefs.theme.charAt(0).toUpperCase() + prefs.theme.slice(1)}
            onPress={() => setShowThemeModal(true)}
          />
        </View>

        <Text style={[S.muted, { marginTop: 20, marginBottom: 8 }]}>ACCOUNT & PRIVACY</Text>
        <View style={S.box}>
          <SettingRow
            label="Privacy & Security"
            type="navigate"
            onPress={() => setShowPrivacyModal(true)}
          />
          <SettingRow
            label="Terms of Service"
            type="navigate"
            onPress={() =>
              Alert.alert(
                'Terms of Service',
                'By using Travelling App, you agree to our standard terms and community guidelines.'
              )
            }
          />
        </View>

        <Text style={[S.muted, { marginTop: 20, marginBottom: 8 }]}>ABOUT</Text>
        <View style={S.box}>
          <SettingRow
            label="App Version"
            type="select"
            value="1.0.0 (Build 2026)"
            onPress={() => Alert.alert('Travelling App', 'Version 1.0.0 (MongoDB Atlas Cloud Edition)')}
          />
        </View>
      </ScrollView>

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowThemeModal(false)}>
          <View style={styles.dialogBox}>
            <Text style={[S.h2, { marginBottom: 16, textAlign: 'center' }]}>Select Theme</Text>
            {THEME_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[S.row, styles.optionRow]}
                onPress={() => handleThemeSelect(option.value)}
              >
                <Text style={{ fontSize: 16, color: c.t }}>{option.label}</Text>
                {prefs.theme === option.value && (
                  <Ionicons name="checkmark-circle" size={20} color={c.p} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLangModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowLangModal(false)}>
          <View style={styles.dialogBox}>
            <Text style={[S.h2, { marginBottom: 16, textAlign: 'center' }]}>Select Language</Text>
            {LANGUAGE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[S.row, styles.optionRow]}
                onPress={() => handleLangSelect(option.value)}
              >
                <Text style={{ fontSize: 16, color: c.t }}>{option.label}</Text>
                {prefs.language === option.value && (
                  <Ionicons name="checkmark-circle" size={20} color={c.p} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.privacyBox}>
            <View style={[S.row, { justifyContent: 'space-between', marginBottom: 16 }]}>
              <Text style={S.h2}>Privacy & Security</Text>
              <Pressable onPress={() => setShowPrivacyModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={c.t} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[{ fontSize: 16, fontWeight: '700', color: c.t }, { marginBottom: 6 }]}>1. Dữ liệu tài khoản</Text>
              <Text style={[S.muted, { marginBottom: 14 }]}>
                Thông tin cá nhân (họ tên, email, số điện thoại) và mật khẩu được mã hóa an toàn bằng bcrypt trước khi lưu trên MongoDB Atlas.
              </Text>

              <Text style={[{ fontSize: 16, fontWeight: '700', color: c.t }, { marginBottom: 6 }]}>2. Tin nhắn & Hội thoại</Text>
              <Text style={[S.muted, { marginBottom: 14 }]}>
                Hội thoại trao đổi giữa Chủ nhà (Host) và Khách thuê (Renter) được truyền qua kênh WebSocket Socket.io mã hóa và chỉ hiển thị cho 2 bên liên quan.
              </Text>

              <Text style={[{ fontSize: 16, fontWeight: '700', color: c.t }, { marginBottom: 6 }]}>3. Thanh toán & Giao dịch</Text>
              <Text style={[S.muted, { marginBottom: 14 }]}>
                Dữ liệu hóa đơn, mã đặt phòng và chi phí được đối soát trực tiếp theo quy định bảo mật giao dịch, không chia sẻ cho bên thứ ba.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '82%',
    maxWidth: 320,
  },
  optionRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: c.soft,
    justifyContent: 'space-between',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  privacyBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
});
