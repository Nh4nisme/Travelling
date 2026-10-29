import { Alert, Platform } from 'react-native';

/** Alert.alert của React Native KHÔNG hiện gì trên web, nên dùng hàm này để chạy được cả web lẫn mobile. */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    (globalThis as any).alert?.(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

/** Hộp thoại xác nhận, trả về true nếu người dùng đồng ý. */
export function confirmDialog(title: string, message: string, confirmText = 'OK', cancelText = 'Cancel', destructive = false): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(Boolean((globalThis as any).confirm?.(`${title}\n\n${message}`)));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
