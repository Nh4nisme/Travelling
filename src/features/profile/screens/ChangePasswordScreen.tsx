import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn } from '@/components';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { userService } from '@/services/userService';
import { tokenStorage } from '@/services/tokenStorage';

export function ChangePasswordScreen({ navigation }: any) {
  const { user } = useApp();
  const { colors } = useTheme();
  const { t, isVietnamese } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const newPassRef = useRef<any>(null);
  const confirmPassRef = useRef<any>(null);

  const handleSubmit = async () => {
    setError('');

    if (!currentPassword) {
      setError(t.settings.enterCurrentPassword);
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError(t.settings.passwordRequirements);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.settings.passwordMismatch);
      return;
    }

    if (currentPassword === newPassword) {
      setError(
        isVietnamese
          ? 'Mật khẩu mới không được trùng với mật khẩu hiện tại'
          : 'New password cannot be identical to current password'
      );
      return;
    }

    setSubmitting(true);
    try {
      const token = await tokenStorage.get();
      if (!token) throw new Error('Not authenticated');

      await userService.changePassword(currentPassword, newPassword, token);

      Alert.alert(
        isVietnamese ? 'Thành công' : 'Success',
        t.settings.changePasswordSuccess,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      setError(err?.message || t.settings.changePasswordFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.description, { color: colors.muted }]}>
            {isVietnamese
              ? 'Để bảo mật tài khoản, vui lòng nhập mật khẩu hiện tại trước khi đặt mật khẩu mới.'
              : 'For security, please enter your current password before setting a new one.'}
          </Text>

          {/* Current Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t.settings.currentPassword}
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.card,
                  borderColor: error && !currentPassword ? '#ef4444' : colors.border,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.muted}
                style={styles.leadingIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t.settings.enterCurrentPassword}
                placeholderTextColor={colors.muted}
                secureTextEntry={!showCurrent}
                value={currentPassword}
                onChangeText={(val) => {
                  setCurrentPassword(val);
                  setError('');
                }}
                returnKeyType="next"
                onSubmitEditing={() => newPassRef.current?.focus()}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => setShowCurrent((prev) => !prev)}
                hitSlop={8}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            </View>
          </View>

          {/* New Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t.settings.newPassword}
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.card,
                  borderColor: error && (!newPassword || newPassword.length < 6) ? '#ef4444' : colors.border,
                },
              ]}
            >
              <Ionicons
                name="key-outline"
                size={20}
                color={colors.muted}
                style={styles.leadingIcon}
              />
              <TextInput
                ref={newPassRef}
                style={[styles.input, { color: colors.text }]}
                placeholder={t.settings.enterNewPassword}
                placeholderTextColor={colors.muted}
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={(val) => {
                  setNewPassword(val);
                  setError('');
                }}
                returnKeyType="next"
                onSubmitEditing={() => confirmPassRef.current?.focus()}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => setShowNew((prev) => !prev)}
                hitSlop={8}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showNew ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            </View>
            <Text style={[styles.hint, { color: colors.muted }]}>
              {t.settings.passwordRequirements}
            </Text>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t.settings.confirmNewPassword}
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.card,
                  borderColor: error && newPassword !== confirmPassword ? '#ef4444' : colors.border,
                },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={colors.muted}
                style={styles.leadingIcon}
              />
              <TextInput
                ref={confirmPassRef}
                style={[styles.input, { color: colors.text }]}
                placeholder={t.settings.enterConfirmPassword}
                placeholderTextColor={colors.muted}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  setError('');
                }}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => setShowConfirm((prev) => !prev)}
                hitSlop={8}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            </View>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <Btn
            title={submitting ? t.settings.savingPassword : t.settings.savePassword}
            onPress={handleSubmit}
            disabled={submitting}
            style={styles.submitBtn}
          />

          {submitting && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginTop: 14 }}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
  },
  leadingIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    flex: 1,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 8,
  },
});
