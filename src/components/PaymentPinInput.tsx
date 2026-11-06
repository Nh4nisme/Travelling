import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, TextInput, StyleSheet, Text, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export interface PaymentPinInputRef {
  focus: (index?: number) => void;
  clear: () => void;
}

interface PaymentPinInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onComplete?: (pin: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const PaymentPinInput = forwardRef<PaymentPinInputRef, PaymentPinInputProps>(
  ({ value, onChangeText, onComplete, error, disabled = false, autoFocus = false }, ref) => {
    const { colors } = useTheme();
    const inputRefs = useRef<(React.ElementRef<typeof TextInput> | null)[]>([]);

    useImperativeHandle(ref, () => ({
      focus: (index = 0) => {
        const target = inputRefs.current[index] || inputRefs.current[0];
        target?.focus();
      },
      clear: () => {
        onChangeText('');
        inputRefs.current[0]?.focus();
      },
    }));

    const handleChange = (text: string, index: number) => {
      // Chỉ cho phép số
      const digits = text.replace(/[^0-9]/g, '');

      // Hỗ trợ paste chuỗi nhiều số
      if (digits.length > 1) {
        const pasted = digits.slice(0, 6);
        onChangeText(pasted);
        if (pasted.length === 6) {
          inputRefs.current[5]?.focus();
          if (onComplete && !disabled) {
            onComplete(pasted);
          }
        } else {
          inputRefs.current[Math.min(pasted.length, 5)]?.focus();
        }
        return;
      }

      const digit = digits;
      const chars = value.split('');
      chars[index] = digit;
      const newPin = chars.slice(0, 6).join('');

      onChangeText(newPin);

      // Auto-focus ô kế tiếp trong cùng hàng PIN
      if (digit && index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }

      // Trigger onComplete khi vừa đủ 6 số
      if (newPin.length === 6 && onComplete && !disabled) {
        onComplete(newPin);
      }
    };

    const handleKeyPress = (e: any, index: number) => {
      // Backspace → focus ô trước đó khi ô hiện tại rỗng
      if (e.nativeEvent.key === 'Backspace') {
        if ((!value[index] || value[index] === '') && index > 0 && inputRefs.current[index - 1]) {
          inputRefs.current[index - 1]?.focus();
        }
      }
    };

    return (
      <View style={styles.container}>
        <View style={styles.inputsRow}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <TextInput
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: error ? '#ef4444' : colors.border,
                  color: colors.text,
                },
              ]}
              value={value[index] || ''}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              secureTextEntry
              selectTextOnFocus
              editable={!disabled}
              autoFocus={autoFocus && index === 0}
              placeholder="•"
              placeholderTextColor={colors.muted}
            />
          ))}
        </View>
        {error && <Text style={[styles.error, { color: '#ef4444' }]}>{error}</Text>}
      </View>
    );
  }
);
PaymentPinInput.displayName = 'PaymentPinInput';

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
