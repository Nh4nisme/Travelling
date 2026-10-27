import React from 'react';
import type { ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const Screen = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => <SafeAreaView style={[{ flex: 1, backgroundColor: '#fff' }, style]}>{children}</SafeAreaView>;
