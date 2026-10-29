import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { c, S } from '@/constants/theme';
import type { FaqCategory } from '../types';

interface TopicCardProps {
  category: FaqCategory;
  count: number;
  onPress: () => void;
}

export function TopicCard({ category, count, onPress }: TopicCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${category.title}, ${count} articles`}
      style={({ pressed }) => [S.box, { width: '48%', gap: 10, backgroundColor: pressed ? c.soft : '#fff' }]}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.pl, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={category.icon} size={20} color={c.p} />
      </View>
      <View>
        <Text style={{ fontSize: 15, fontWeight: '700', color: c.t }}>{category.title}</Text>
        <Text style={[S.muted, { fontSize: 12, marginTop: 2 }]}>
          {count} {count === 1 ? 'article' : 'articles'}
        </Text>
      </View>
    </Pressable>
  );
}
