import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Alert,
  ScrollView,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn } from '@/components';
import { PaymentPinInput, type PaymentPinInputRef } from '@/components/PaymentPinInput';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { userService } from '@/services/userService';
import { tokenStorage } from '@/services/tokenStorage';

export function PaymentPinScreen({ navigation }: any) {
  const { user, updateUser } = useApp();
  const { colors } = useTheme();
  const { isVietnamese } = useLanguage();

  const hasPin = user?.paymentPinSet || false;

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const currentPinRef = useRef<PaymentPinInputRef>(null);
  const newPinRef = useRef<PaymentPinInputRef>(null);
  const confirmPinRef = useRef<PaymentPinInputRef>(null);

  const handleSave = async () => {
    setError('');

    // Validation
    if (hasPin && currentPin.length !== 6) {
      setError(isVietnamese ? 'Vui lòng nhập đủ 6 số mã PIN hiện tại' : 'Please enter your 6-digit current PIN');
      currentPinRef.current?.focus();
      return;
    }

    if (newPin.length !== 6) {
      setError(isVietnamese ? 'Mã PIN mới phải gồm đúng 6 chữ số' : 'New PIN must be exactly 6 digits');
      newPinRef.current?.focus();
      return;
    }

    if (newPin !== confirmPin) {
      setError(isVietnamese ? 'Mã PIN xác nhận không trùng khớp' : 'Confirmation PIN does not match');
      confirmPinRef.current?.focus();
      return;
    }

    if (hasPin && currentPin === newPin) {
      setError(
        isVietnamese
          ? 'Mã PIN mới không được trùng với mã PIN hiện tại'
          : 'New PIN cannot be identical to current PIN'
      );
      newPinRef.current?.focus();
      return;
    }

    setSaving(true);
    try {
      const token = await tokenStorage.get();
      if (!token) throw new Error('Not authenticated');

      const { user: updatedUser } = await userService.setPaymentPin(
        hasPin ? currentPin : null,
        newPin,
        token
      );

      updateUser(updatedUser);

      Alert.alert(
        isVietnamese ? 'Thành công' : 'Success',
        isVietnamese
          ? 'Mã PIN thanh toán đã được cập nhật thành công!'
          : 'Payment PIN has been updated successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      setError(err?.message || (isVietnamese ? 'Không thể cập nhật mã PIN' : 'Failed to update PIN'));
    } finally {
      setSaving(false);
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
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card giới thiệu tính năng */}
          <View
            style={[
              styles.introCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <Ionicons name="shield-checkmark" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              {hasPin
                ? isVietnamese
                  ? 'Đổi mã PIN thanh toán'
                  : 'Change Payment PIN'
                : isVietnamese
                ? 'Thiết lập mã PIN thanh toán'
                : 'Set Up Payment PIN'}
            </Text>
            <Text style={[styles.introSubtitle, { color: colors.muted }]}>
              {isVietnamese
                ? 'Mã PIN 6 số bảo vệ giao dịch, được yêu cầu xác thực mỗi khi bạn đặt phòng và thanh toán.'
                : 'Your 6-digit PIN protects transactions and is required whenever you confirm bookings.'}
            </Text>
          </View>

          {/* Ô nhập PIN hiện tại (nếu đã có PIN) */}
          {hasPin && (
            <View
              style={[
                styles.pinSectionCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons name="key-outline" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {isVietnamese ? 'Mã PIN hiện tại' : 'Current PIN'}
                </Text>
              </View>

              <PaymentPinInput
                ref={currentPinRef}
                value={currentPin}
                onChangeText={(val) => {
                  setCurrentPin(val);
                  setError('');
                }}
                autoFocus={hasPin}
                onComplete={() => {
                  setTimeout(() => {
                    newPinRef.current?.focus();
                  }, 80);
                }}
              />
            </View>
          )}

          {/* Ô nhập PIN mới */}
          <View
            style={[
              styles.pinSectionCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isVietnamese ? 'Mã PIN mới (6 chữ số)' : 'New PIN (6 digits)'}
              </Text>
            </View>

            <PaymentPinInput
              ref={newPinRef}
              value={newPin}
              onChangeText={(val) => {
                setNewPin(val);
                setError('');
              }}
              autoFocus={!hasPin}
              onComplete={() => {
                setTimeout(() => {
                  confirmPinRef.current?.focus();
                }, 80);
              }}
            />
          </View>

          {/* Ô xác nhận PIN mới */}
          <View
            style={[
              styles.pinSectionCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isVietnamese ? 'Xác nhận mã PIN mới' : 'Confirm New PIN'}
              </Text>
            </View>

            <PaymentPinInput
              ref={confirmPinRef}
              value={confirmPin}
              onChangeText={(val) => {
                setConfirmPin(val);
                setError('');
              }}
              onComplete={() => {
                Keyboard.dismiss();
              }}
            />
          </View>

          {/* Thông báo lỗi nếu có */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Nút Lưu mã PIN */}
          <Btn
            title={
              saving
                ? isVietnamese
                  ? 'Đang lưu…'
                  : 'Saving…'
                : isVietnamese
                ? 'Lưu mã PIN'
                : 'Save PIN'
            }
            onPress={handleSave}
            disabled={saving}
            style={styles.saveBtn}
          />

          {saving && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginTop: 12 }}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  introCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
  },
  pinSectionCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 14,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    flex: 1,
    fontWeight: '500',
  },
  saveBtn: {
    marginTop: 6,
    width: '100%',
  },
});
