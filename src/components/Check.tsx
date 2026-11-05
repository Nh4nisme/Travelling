import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

export const Check = ({ on, onPress }: { on: boolean; onPress?: () => void }) => {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 24,
        height: 24,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: on ? colors.primary : colors.muted,
        backgroundColor: on ? colors.primary : colors.card,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {on && <Ionicons name="checkmark" size={16} color="#fff" />}
    </Pressable>
  );
};
