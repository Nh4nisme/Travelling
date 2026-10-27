import { Text, Pressable } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { c } from '@/constants/theme';

export const Btn = ({ title, onPress, icon, outline, color, disabled, style }: { title: string; onPress?: () => void; icon?: any; outline?: boolean; color?: string; disabled?: boolean; style?: ViewStyle }) => (
  <Pressable onPress={onPress} disabled={disabled} style={[{ backgroundColor: outline ? '#fff' : c.p, borderWidth: outline ? 1 : 0, borderColor: color ?? c.b, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: disabled ? 0.5 : 1 }, style]}>
    {icon && <Ionicons name={icon} size={18} color={outline ? color ?? c.t : '#fff'} />}
    <Text style={{ color: outline ? color ?? c.t : '#fff', fontSize: 16, fontWeight: '600' }}>{title}</Text>
  </Pressable>
);
