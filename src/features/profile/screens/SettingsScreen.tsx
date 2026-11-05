import React, { useState } from 'react';
import { View, Text, Alert, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingRow } from '../components/SettingRow';
import { useTheme, type ThemeMode } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import type { Language } from '@/constants/translations';

export function SettingsScreen({ navigation }: any) {
  const { colors, themeMode, setThemeMode } = useTheme();
  const { language, setLanguage, t, isVietnamese } = useLanguage();

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: t.settings.light, value: 'light' },
    { label: t.settings.dark, value: 'dark' },
    { label: t.settings.system, value: 'system' },
  ];

  const languageOptions: { label: string; value: Language }[] = [
    { label: 'English (US)', value: 'English' },
    { label: 'Tiếng Việt', value: 'Tiếng Việt' },
  ];

  const handleThemeSelect = (selectedTheme: ThemeMode) => {
    void setThemeMode(selectedTheme);
    setShowThemeModal(false);
  };

  const handleLangSelect = (selectedLang: Language) => {
    void setLanguage(selectedLang);
    setShowLangModal(false);
  };

  const getThemeDisplayValue = () => {
    switch (themeMode) {
      case 'light':
        return t.settings.light;
      case 'dark':
        return t.settings.dark;
      case 'system':
      default:
        return t.settings.system;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted, marginBottom: 8, letterSpacing: 0.5 }}>
          {t.settings.preferences}
        </Text>
        <View
          style={[
            styles.cardBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <SettingRow
            label={t.settings.language}
            type="select"
            value={language}
            onPress={() => setShowLangModal(true)}
          />
          <SettingRow
            label={t.settings.theme}
            type="select"
            value={getThemeDisplayValue()}
            onPress={() => setShowThemeModal(true)}
          />
        </View>

        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 22, marginBottom: 8, letterSpacing: 0.5 }}>
          {t.settings.accountPrivacy}
        </Text>
        <View
          style={[
            styles.cardBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <SettingRow
            label={isVietnamese ? 'Mã PIN thanh toán' : 'Payment PIN'}
            type="navigate"
            onPress={() => navigation.navigate('PaymentPin')}
          />
          <SettingRow
            label={t.settings.privacySecurity}
            type="navigate"
            onPress={() => setShowPrivacyModal(true)}
          />
          <SettingRow
            label={t.settings.termsOfService}
            type="navigate"
            onPress={() =>
              Alert.alert(
                t.settings.termsOfService,
                t.settings.termsMessage
              )
            }
          />
        </View>

        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 22, marginBottom: 8, letterSpacing: 0.5 }}>
          {t.settings.about}
        </Text>
        <View
          style={[
            styles.cardBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <SettingRow
            label={t.settings.appVersion}
            type="select"
            value="1.0.0 (Build 2026)"
            onPress={() => Alert.alert('Travelling App', t.settings.appEdition)}
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
          <View style={[styles.dialogBox, { backgroundColor: colors.dialogBg }]}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16, textAlign: 'center' }}>
              {t.settings.selectTheme}
            </Text>
            {themeOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.optionRow, { borderColor: colors.soft }]}
                onPress={() => handleThemeSelect(option.value)}
              >
                <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>
                  {option.label}
                </Text>
                {themeMode === option.value && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
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
          <View style={[styles.dialogBox, { backgroundColor: colors.dialogBg }]}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16, textAlign: 'center' }}>
              {t.settings.selectLang}
            </Text>
            {languageOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.optionRow, { borderColor: colors.soft }]}
                onPress={() => handleLangSelect(option.value)}
              >
                <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>
                  {option.label}
                </Text>
                {language === option.value && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
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
          <View style={[styles.privacyBox, { backgroundColor: colors.dialogBg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                {t.settings.privacyTitle}
              </Text>
              <Pressable onPress={() => setShowPrivacyModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                {t.settings.privacy1Title}
              </Text>
              <Text style={{ color: colors.muted, lineHeight: 22, marginBottom: 14 }}>
                {t.settings.privacy1Desc}
              </Text>

              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                {t.settings.privacy2Title}
              </Text>
              <Text style={{ color: colors.muted, lineHeight: 22, marginBottom: 14 }}>
                {t.settings.privacy2Desc}
              </Text>

              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                {t.settings.privacy3Title}
              </Text>
              <Text style={{ color: colors.muted, lineHeight: 22, marginBottom: 14 }}>
                {t.settings.privacy3Desc}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cardBox: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogBox: {
    borderRadius: 16,
    padding: 20,
    width: '84%',
    maxWidth: 320,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  privacyBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
});
