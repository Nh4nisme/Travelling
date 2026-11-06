import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Animated,
  Platform,
} from 'react-native';
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
    const hiddenInputRef = useRef<any>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Hiệu ứng nhấp nháy con trỏ ở ô đang nhập
    const cursorAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      const blink = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(cursorAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      blink.start();
      return () => blink.stop();
    }, [cursorAnim]);

    // Hỗ trợ tự động mở bàn phím trên thiết bị di động (kèm delay nhỏ tránh bị chặn bởi animation)
    useEffect(() => {
      if (autoFocus && !disabled) {
        const timer = setTimeout(() => {
          hiddenInputRef.current?.focus();
        }, 150);
        return () => clearTimeout(timer);
      }
    }, [autoFocus, disabled]);

    useImperativeHandle(ref, () => ({
      focus: () => {
        hiddenInputRef.current?.focus();
      },
      clear: () => {
        onChangeText('');
        hiddenInputRef.current?.focus();
      },
    }));

    const handleTextChange = (text: string) => {
      // Chỉ cho phép nhập số
      const digits = text.replace(/[^0-9]/g, '').slice(0, 6);
      onChangeText(digits);

      // Khi gõ đủ 6 chữ số
      if (digits.length === 6 && onComplete && !disabled) {
        onComplete(digits);
      }
    };

    return (
      <View style={styles.container}>
        {/* 6 ô hiển thị giao diện đồ họa cao cấp (pointerEvents="none" để touch xuyên qua TextInput) */}
        <View style={styles.inputsRow} pointerEvents="none">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const isFilled = index < value.length;
            const isCurrentFocus = isFocused && !disabled && index === value.length;

            return (
              <View
                key={index}
                style={[
                  styles.cell,
                  {
                    backgroundColor: isFilled ? colors.card : colors.soft,
                    borderColor: error
                      ? '#ef4444'
                      : isCurrentFocus
                      ? colors.primary
                      : isFilled
                      ? colors.primary + '90'
                      : colors.border,
                    borderWidth: isCurrentFocus ? 2 : 1.5,
                  },
                ]}
              >
                {isFilled ? (
                  // Chấm tròn đặc hiển thị số đã nhập (chuẩn bảo mật)
                  <View
                    style={[
                      styles.filledDot,
                      { backgroundColor: colors.text },
                    ]}
                  />
                ) : isCurrentFocus ? (
                  // Con trỏ nhấp nháy tại vị trí đang chờ nhập
                  <Animated.View
                    style={[
                      styles.cursorBar,
                      { backgroundColor: colors.primary, opacity: cursorAnim },
                    ]}
                  />
                ) : (
                  // Dấu chấm mờ placeholder thanh lịch
                  <View
                    style={[
                      styles.emptyDot,
                      { backgroundColor: colors.muted + '40' },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* TextInput trong suốt phủ kín toàn bộ bề mặt ô để nhận touch trực tiếp từ OS */}
        <TextInput
          ref={hiddenInputRef}
          value={value}
          onChangeText={handleTextChange}
          maxLength={6}
          keyboardType="number-pad"
          autoFocus={autoFocus}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          caretHidden
          style={styles.transparentInput}
        />

        {error && <Text style={[styles.error, { color: '#ef4444' }]}>{error}</Text>}
      </View>
    );
  }
);

PaymentPinInput.displayName = 'PaymentPinInput';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  transparentInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.02,
    zIndex: 10,
    backgroundColor: 'transparent',
    color: 'transparent',
  },
  inputsRow: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 320,
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  cell: {
    flex: 1,
    maxWidth: 44,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  filledDot: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
  },
  cursorBar: {
    width: 2,
    height: 22,
    borderRadius: 1,
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  error: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
