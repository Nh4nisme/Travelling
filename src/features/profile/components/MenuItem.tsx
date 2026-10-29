import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { c, S } from '@/constants/theme';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  rightElement?: React.ReactNode;
}

export function MenuItem({ icon, title, onPress, rightElement }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[S.between, { paddingVertical: 16, borderBottomWidth: 1, borderColor: c.soft }]}
    >
      <View style={[S.row, { gap: 12 }]}>
        <Ionicons name={icon} size={22} color={c.t} />
        <Text style={{ fontSize: 16, color: c.t }}>{title}</Text>
      </View>
      {rightElement ?? <Ionicons name="chevron-forward" size={18} color={c.m} />}
    </Pressable>
  );
}
