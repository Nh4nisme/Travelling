import { Text, Pressable } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

export const Btn = ({
  title,
  onPress,
  icon,
  outline,
  color,
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  icon?: any;
  outline?: boolean;
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
}) => {
  const { colors } = useTheme();

  const bg = outline ? colors.card : (color ?? colors.primary);
  const borderCol = outline ? (color ?? colors.border) : 'transparent';
  const textCol = outline ? (color ?? colors.text) : '#fff';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          backgroundColor: bg,
          borderWidth: outline ? 1 : 0,
          borderColor: borderCol,
          borderRadius: 10,
          paddingVertical: 14,
          paddingHorizontal: 18,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={18} color={textCol} />}
      <Text style={{ color: textCol, fontSize: 16, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
};
