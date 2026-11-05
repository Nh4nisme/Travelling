import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import type { FaqCategory } from '../types';

interface TopicCardProps {
  category: FaqCategory;
  count: number;
  onPress: () => void;
}

export function TopicCard({ category, count, onPress }: TopicCardProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${category.title}, ${count} ${count === 1 ? t.helpCenter.article : t.helpCenter.articles}`}
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? colors.soft : colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 16,
          width: '48%',
          gap: 10
        }
      ]}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={category.icon} size={20} color={colors.primary} />
      </View>
      <View>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{category.title}</Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
          {count} {count === 1 ? t.helpCenter.article : t.helpCenter.articles}
        </Text>
      </View>
    </Pressable>
  );
}
