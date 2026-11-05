import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  rightElement?: React.ReactNode;
}

export function MenuItem({ icon, title, onPress, rightElement }: MenuItemProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: colors.soft,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name={icon} size={22} color={colors.text} />
        <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>{title}</Text>
      </View>
      {rightElement ?? <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
    </Pressable>
  );
}
