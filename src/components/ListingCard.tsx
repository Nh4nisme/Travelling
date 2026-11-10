import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Photo } from '@/components/Photo';
import { Heart } from '@/components/Heart';
import { S, W } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { calcPrice } from '@/utils/pricing';
import type { Listing } from '@/types/listing';

interface ListingCardProps {
  l: Listing;
  sub?: string;
  showTotal?: boolean;
  estimatedNights?: number;
}

export const ListingCard = ({ l, sub, showTotal = false, estimatedNights = 1 }: ListingCardProps) => {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const getCategoryLabel = (name: string) => {
    return (t.home.categories as Record<string, string>)[name] ?? name;
  };

  // BR06: Hiển thị tổng giá nếu "Present total price" được bật
  const displayPrice = showTotal && estimatedNights > 0
    ? calcPrice(l.price, estimatedNights).total
    : l.price;
  const priceLabel = showTotal ? 'total' : t.listing.night;

  return (
    <Pressable onPress={() => nav.navigate('Detail', { id: l.id })} style={{ marginBottom: 24 }}>
      <Photo uri={l.images[0]} style={{ height: W * 0.85, borderRadius: 12 }}>
        <Heart id={l.id} style={{ position: 'absolute', top: 14, right: 14 }} />
      </Photo>
      <View style={[S.between, { marginTop: 12 }]}>
        <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text }}>{l.title}</Text>
        <Text style={{ color: colors.text }}>
          <Ionicons name="star" color={colors.star} /> {l.rating.toFixed(1)}
        </Text>
      </View>
      <View style={[S.between, { marginTop: 6 }]}>
        <Text style={{ color: colors.muted }}>
          {sub === 'bed' ? `🛏 ${l.bedrooms} ${t.listing.bedroom}` : getCategoryLabel(l.category)}
        </Text>
        <Text style={{ color: colors.muted }}>
          <Text style={{ fontWeight: '700', color: colors.text }}>${displayPrice}</Text>/{priceLabel}
        </Text>
      </View>
    </Pressable>
  );
};
