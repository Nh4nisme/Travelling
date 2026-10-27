import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { c } from '@/constants/theme';

export const Check = ({ on, onPress }: { on: boolean; onPress?: () => void }) => (
  <Pressable onPress={onPress} style={{ width: 24, height: 24, borderRadius: 5, borderWidth: 1.5, borderColor: on ? '#0E8FA0' : c.m, backgroundColor: on ? '#0E8FA0' : '#fff', alignItems: 'center', justifyContent: 'center' }}>
    {on && <Ionicons name="checkmark" size={16} color="#fff" />}
  </Pressable>
);
