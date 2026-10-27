import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { c, S } from '@/constants/theme';

export const Stars = ({ n }: { n: number }) => (
  <View style={S.row}>{[1, 2, 3, 4, 5].map((i) => <Ionicons key={i} name="star" size={14} color={i <= n ? c.star : '#E3E5EA'} />)}</View>
);
