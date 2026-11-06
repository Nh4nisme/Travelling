import React, { useState, useRef } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentPinInput, type PaymentPinInputRef } from '@/components/PaymentPinInput';
import { Btn } from '@/components';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { userService } from '@/services/userService';
import { tokenStorage } from '@/services/tokenStorage';

interface PaymentPinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
}

export function PaymentPinModal({ visible, onClose, onSuccess }: PaymentPinModalProps) {
  const { colors } = useTheme();
  const { isVietnamese } = useLanguage();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const pinInputRef = useRef<PaymentPinInputRef>(null);

  const handlePinComplete = async (completedPin: string) => {
    setError('');
    setVerifying(true);

    try {
      const token = await tokenStorage.get();
      if (!token) throw new Error('Not authenticated');

      await userService.verifyPaymentPin(completedPin, token);

      // PIN đúng → callback success
      onSuccess(completedPin);
      setPin('');
      onClose();
    } catch (err: any) {
      setError(err?.message || (isVietnamese ? 'Mã PIN không đúng' : 'Incorrect PIN'));
      setPin('');
      pinInputRef.current?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  const handleModalShow = () => {
    // Đảm bảo bàn phím tự động hiển thị mượt mà trên thiết bị di động sau khi modal hiện ra
    setTimeout(() => {
      pinInputRef.current?.focus();
    }, 150);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      onShow={handleModalShow}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={[styles.content, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
              }}
            >
              <Ionicons name="lock-closed" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {isVietnamese ? 'Nhập mã PIN thanh toán' : 'Enter Payment PIN'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {isVietnamese
                ? 'Vui lòng nhập mã PIN 6 số để xác nhận thanh toán'
                : 'Please enter your 6-digit PIN to confirm payment'}
            </Text>
          </View>

          <View style={styles.pinContainer}>
            <PaymentPinInput
              ref={pinInputRef}
              value={pin}
              onChangeText={setPin}
              onComplete={handlePinComplete}
              error={error}
              autoFocus={true}
            />
          </View>

          {verifying && (
            <View style={styles.verifying}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.verifyingText, { color: colors.muted }]}>
                {isVietnamese ? 'Đang xác thực...' : 'Verifying...'}
              </Text>
            </View>
          )}

          <Btn
            title={isVietnamese ? 'Hủy' : 'Cancel'}
            outline
            onPress={handleClose}
            style={styles.cancelBtn}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  pinContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  verifying: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  verifyingText: {
    fontSize: 14,
  },
  cancelBtn: {
    marginTop: 18,
    width: '100%',
  },
});
