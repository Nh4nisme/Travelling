import React, { useRef } from 'react';
import { View, TextInput, StyleSheet, Text, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface PaymentPinInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onComplete?: (pin: string) => void;
  error?: string;
  disabled?: boolean;
}

export function PaymentPinInput({ value, onChangeText, onComplete, error, disabled = false }: PaymentPinInputProps) {
  const { colors } = useTheme();
  const inputRefs = useRef<(React.ElementRef<typeof TextInput> | null)[]>([]);
  
  const handleChange = (text: string, index: number) => {
    // Chỉ cho phép số
    const digit = text.replace(/[^0-9]/g, '');
    if (digit.length > 1) return;
    
    const newValue = value.split('');
    newValue[index] = digit;
    const newPin = newValue.join('');
    
    onChangeText(newPin);
    
    // Auto-focus next input
    if (digit && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Trigger onComplete khi đủ 6 số
    if (newPin.length === 6 && onComplete && !disabled) {
      onComplete(newPin);
    }
  };
  
  const handleKeyPress = (e: any, index: number) => {
    // Backspace → focus previous input
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.inputsRow}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[
              styles.input,
              { 
                backgroundColor: colors.card, 
                borderColor: error ? '#ef4444' : colors.border,
                color: colors.text,
              }
            ]}
            value={value[index] || ''}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            secureTextEntry  // Hiển thị dấu •
            selectTextOnFocus
            editable={!disabled}
            autoFocus={index === 0}
            placeholder="•"
            placeholderTextColor={colors.muted}
          />
        ))}
      </View>
      {error && (
        <Text style={[styles.error, { color: '#ef4444' }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  input: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    ...(Platform.OS === 'android' ? { textAlignVertical: 'center' } : {}),
  },
  error: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
  },
});
