import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentPinInput } from '@/components/PaymentPinInput';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { userService } from '@/services/userService';
import { tokenStorage } from '@/services/tokenStorage';

interface PaymentPinSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
}

export function PaymentPinSheet({ visible, onClose, onSuccess }: PaymentPinSheetProps) {
  const { colors } = useTheme();
  const { t, isVietnamese } = useLanguage();
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  const isWeb = Platform.OS === 'web';
  
  const handleBackdropPress = () => {
    if (!verifying) {
      handleClose();
    }
  };
  
  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
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
  
  // Web: Simple Modal with fade animation
  if (isWeb) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable 
          style={styles.webBackdrop} 
          onPress={handleBackdropPress}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={[styles.webContent, { backgroundColor: colors.card }]}>
              <View style={styles.webHeader}>
                <Ionicons name="lock-closed" size={32} color={colors.primary} />
                <Text style={[styles.webTitle, { color: colors.text }]}>
                  {isVietnamese ? 'Xác nhận thanh toán' : 'Confirm Payment'}
                </Text>
                <Text style={[styles.webSubtitle, { color: colors.muted }]}>
                  {isVietnamese 
                    ? 'Vui lòng nhập mã PIN 6 số'
                    : 'Please enter your 6-digit PIN'}
                </Text>
              </View>
              
              <View style={styles.webPinContainer}>
                <PaymentPinInput
                  value={pin}
                  onChangeText={setPin}
                  onComplete={handlePinComplete}
                  error={error}
                  disabled={verifying}
                />
              </View>
              
              {verifying && (
                <View style={styles.webVerifying}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.webVerifyingText, { color: colors.muted }]}>
                    {isVietnamese ? 'Đang xác thực...' : 'Verifying...'}
                  </Text>
                </View>
              )}
              
              <Pressable
                onPress={handleClose}
                disabled={verifying}
                style={styles.webCancelBtn}
              >
                <Text style={[styles.webCancelText, { color: colors.primary, opacity: verifying ? 0.5 : 1 }]}>
                  {isVietnamese ? 'Hủy' : 'Cancel'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }
  
  // Native: Bottom Sheet with native driver animation
  const { useRef, Animated, Dimensions } = require('react-native');
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  
  const animationRef = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  
  useEffect(() => {
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
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Pressable 
        style={styles.nativeBackdrop} 
        onPress={handleBackdropPress}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View 
            style={[
              styles.nativeSheet,
              { 
                backgroundColor: colors.card,
                transform: [{ translateY: animationRef }],
              }
            ]}
          >
            <View style={styles.nativeHandleContainer}>
              <View style={[styles.nativeHandle, { backgroundColor: colors.border }]} />
            </View>
            
            <View style={styles.nativeHeader}>
              <View style={[styles.nativeIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="lock-closed" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.nativeTitle, { color: colors.text }]}>
                {isVietnamese ? 'Xác nhận thanh toán' : 'Confirm Payment'}
              </Text>
              <Text style={[styles.nativeSubtitle, { color: colors.muted }]}>
                {isVietnamese 
                  ? 'Vui lòng nhập mã PIN 6 số'
                  : 'Please enter your 6-digit PIN'}
              </Text>
            </View>
            
            <View style={styles.nativePinContainer}>
              <PaymentPinInput
                value={pin}
                onChangeText={setPin}
                onComplete={handlePinComplete}
                error={error}
                disabled={verifying}
              />
            </View>
            
            {verifying && (
              <View style={styles.nativeVerifying}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.nativeVerifyingText, { color: colors.muted }]}>
                  {isVietnamese ? 'Đang xác thực...' : 'Verifying...'}
                </Text>
              </View>
            )}
            
            <View style={styles.nativeActions}>
              <Pressable
                onPress={handleClose}
                disabled={verifying}
                style={styles.nativeCancelBtn}
              >
                <Text style={[styles.nativeCancelText, { color: colors.primary, opacity: verifying ? 0.5 : 1 }]}>
                  {isVietnamese ? 'Hủy' : 'Cancel'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Web styles (centered modal)
  webBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  webHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  webTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  webSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  webPinContainer: {
    marginVertical: 16,
  },
  webVerifying: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  webVerifyingText: {
    fontSize: 14,
  },
  webCancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'center',
  },
  webCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Native styles (bottom sheet)
  nativeBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  nativeSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingTop: 20,
    width: '100%',
  },
  nativeHandleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nativeHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  nativeHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  nativeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  nativeTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  nativeSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  nativePinContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  nativeVerifying: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  nativeVerifyingText: {
    fontSize: 14,
  },
  nativeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  nativeCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  nativeCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
