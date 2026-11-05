import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentPinInput } from '@/components/PaymentPinInput';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { userService } from '@/services/userService';
import { tokenStorage } from '@/services/tokenStorage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface PaymentPinSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
}

export function PaymentPinSheet({ visible, onClose, onSuccess }: PaymentPinSheetProps) {
  const { colors } = useTheme();
  const { isVietnamese } = useLanguage();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // ✅ Hook luôn được gọi vô điều kiện - không vi phạm Rules of Hooks
  const animationRef = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (isWeb) return; // animation chỉ cần trên native
    if (visible) {
      Animated.spring(animationRef, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
    } else {
      Animated.timing(animationRef, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  const handleBackdropPress = () => {
    if (!verifying) handleClose();
  };

  const handlePinComplete = async (completedPin: string) => {
    setError('');
    setVerifying(true);
    try {
      const token = await tokenStorage.get();
      if (!token) throw new Error('Not authenticated');
      await userService.verifyPaymentPin(completedPin, token);
      onSuccess(completedPin);
      setPin('');
      handleClose();
    } catch (err: any) {
      setError(err?.message || (isVietnamese ? 'Mã PIN không đúng' : 'Incorrect PIN'));
      setPin('');
    } finally {
      setVerifying(false);
    }
  };

  const sheetContent = (
    <View style={[styles.sheet, { backgroundColor: colors.card }]}>
      {/* Handle bar - chỉ hiện trên native */}
      {!isWeb && (
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>
      )}

      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="lock-closed" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          {isVietnamese ? 'Xác nhận thanh toán' : 'Confirm Payment'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {isVietnamese ? 'Vui lòng nhập mã PIN 6 số' : 'Please enter your 6-digit PIN'}
        </Text>
      </View>

      <View style={styles.pinContainer}>
        <PaymentPinInput
          value={pin}
          onChangeText={setPin}
          onComplete={handlePinComplete}
          error={error}
          disabled={verifying}
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

      <Pressable onPress={handleClose} disabled={verifying} style={styles.cancelBtn}>
        <Text style={[styles.cancelText, { color: colors.primary, opacity: verifying ? 0.5 : 1 }]}>
          {isVietnamese ? 'Hủy' : 'Cancel'}
        </Text>
      </Pressable>
    </View>
  );

  if (isWeb) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <Pressable style={styles.webBackdrop} onPress={handleBackdropPress}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            {sheetContent}
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Pressable style={styles.nativeBackdrop} onPress={handleBackdropPress}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View style={{ transform: [{ translateY: animationRef }] }}>
            {sheetContent}
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  webBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nativeBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingTop: 12,
    width: '100%',
    // Web: override shape thành rounded box
    ...(isWeb && {
      borderRadius: 20,
      width: undefined,
      minWidth: 320,
      maxWidth: 400,
      paddingTop: 24,
      paddingHorizontal: 8,
    }),
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  pinContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  verifying: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  verifyingText: {
    fontSize: 14,
  },
  cancelBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
