import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { c } from '@/constants/theme';

export const Photo = ({ uri, style, children }: { uri: string; style?: any; children?: React.ReactNode }) => (
  <View style={[{ backgroundColor: c.soft, overflow: 'hidden' }, style]}><Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />{children}</View>
);
