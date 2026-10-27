import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { c, S } from '@/constants/theme';

export const Header = ({ title, right }: { title?: string; right?: React.ReactNode }) => {
  const nav = useNavigation<any>();
  return (
    <View style={[S.between, { padding: 16 }]}>
      <Pressable onPress={() => nav.goBack()} hitSlop={10}><Ionicons name="chevron-back" size={24} color={c.m} /></Pressable>
      <Text style={{ fontWeight: '700', color: c.t, fontSize: 16 }}>{title}</Text>
      <View style={{ width: 24 }}>{right}</View>
    </View>
  );
};
