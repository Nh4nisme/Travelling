import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { c, S } from '@/constants/theme';

interface ContactOptionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}

export function ContactOption({ icon, title, subtitle, onPress }: ContactOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [S.row, S.box, { gap: 14, marginBottom: 12, backgroundColor: pressed ? c.soft : '#fff' }]}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.pl, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={22} color={c.p} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: c.t }}>{title}</Text>
        <Text style={[S.muted, { marginTop: 2 }]} numberOfLines={2}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.m} />
    </Pressable>
  );
}
