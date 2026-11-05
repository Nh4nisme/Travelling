import React from 'react';
import type { ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';

export const Screen = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
      {children}
    </SafeAreaView>
  );
};
