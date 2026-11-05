import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, StyleSheet } from 'react-native';
import { Screen, Header, Btn } from '@/components';
import { PaymentPinInput } from '@/components/PaymentPinInput';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { userService } from '@/services/userService';
import { tokenStorage } from '@/services/tokenStorage';

export function PaymentPinScreen({ navigation }: any) {
  const { user, updateUser } = useApp();
  const { colors } = useTheme();
  const { t, isVietnamese } = useLanguage();
  
  const hasPin = user?.paymentPinSet || false;
  
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  
  const handleSave = async () => {
    setError('');
    
    // Validation
    if (hasPin && currentPin.length !== 6) {
      setError(isVietnamese ? 'Vui lòng nhập mã PIN hiện tại' : 'Please enter current PIN');
      return;
    }
    
    if (newPin.length !== 6) {
      setError(isVietnamese ? 'Mã PIN mới phải là 6 số' : 'New PIN must be 6 digits');
      return;
    }
    
    if (newPin !== confirmPin) {
      setError(isVietnamese ? 'Mã PIN xác nhận không khớp' : 'Confirmation PIN does not match');
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
          ? 'Mã PIN thanh toán đã được cập nhật'
          : 'Payment PIN has been updated',
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
      <Header title={isVietnamese ? 'Mã PIN thanh toán' : 'Payment PIN'} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.description, { color: colors.muted }]}>
          {isVietnamese
            ? 'Mã PIN 6 số này sẽ được yêu cầu khi bạn thực hiện thanh toán để bảo vệ tài khoản của bạn.'
            : 'This 6-digit PIN will be required when making payments to protect your account.'}
        </Text>
        
        {hasPin && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              {isVietnamese ? 'Mã PIN hiện tại' : 'Current PIN'}
            </Text>
            <PaymentPinInput
              value={currentPin}
              onChangeText={setCurrentPin}
            />
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            {isVietnamese ? 'Mã PIN mới' : 'New PIN'}
          </Text>
          <PaymentPinInput
            value={newPin}
            onChangeText={setNewPin}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            {isVietnamese ? 'Xác nhận mã PIN' : 'Confirm PIN'}
          </Text>
          <PaymentPinInput
            value={confirmPin}
            onChangeText={setConfirmPin}
            error={error}
          />
        </View>
        
        <Btn
          title={saving ? (isVietnamese ? 'Đang lưu...' : 'Saving...') : (isVietnamese ? 'Lưu mã PIN' : 'Save PIN')}
          onPress={handleSave}
          disabled={saving}
          style={styles.saveBtn}
        />
      </ScrollView>
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  saveBtn: {
    marginTop: 16,
  },
});
