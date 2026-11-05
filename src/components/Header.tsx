import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { S } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export const Header = ({ title, right }: { title?: string; right?: React.ReactNode }) => {
  const nav = useNavigation<any>();
  const { colors } = useTheme();

  return (
    <View
      style={[
        S.between,
        {
          padding: 16,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Pressable onPress={() => nav.goBack()} hitSlop={10}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <Text style={{ fontWeight: '700', color: colors.text, fontSize: 16 }}>{title}</Text>
      <View style={{ width: 24 }}>{right}</View>
    </View>
  );
};
