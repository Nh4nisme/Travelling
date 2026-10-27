import { Pressable } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { c } from '@/constants/theme';
import { useApp } from '@/store/AppContext';

export const Heart = ({ id, style }: { id: string; style?: ViewStyle }) => {
  const { favs, toggleFav } = useApp(); const on = favs.includes(id);
  return (
    <Pressable onPress={() => toggleFav(id)} style={[{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, style]}>
      <Ionicons name={on ? 'heart' : 'heart-outline'} size={22} color={on ? '#E5484D' : c.t} />
    </Pressable>
  );
};
