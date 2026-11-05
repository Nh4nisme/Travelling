import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentPinInput } from '@/components/PaymentPinInput';
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
  const { t, isVietnamese } = useLanguage();
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  
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
    } finally {
      setVerifying(false);
    }
  };
  
  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable 
          style={[styles.content, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Ionicons name="lock-closed" size={32} color={colors.primary} />
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
              value={pin}
              onChangeText={setPin}
              onComplete={handlePinComplete}
              error={error}
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
  },
  content: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  pinContainer: {
    marginVertical: 16,
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
    marginTop: 16,
  },
});
