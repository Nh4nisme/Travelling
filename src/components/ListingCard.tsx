import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Photo } from '@/components/Photo';
import { Heart } from '@/components/Heart';
import { c, S, W } from '@/constants/theme';
import type { Listing } from '@/types/listing';

export const ListingCard = ({ l, sub }: { l: Listing; sub?: string }) => {
  const nav = useNavigation<any>();
  return (
    <Pressable onPress={() => nav.navigate('Detail', { id: l.id })} style={{ marginBottom: 24 }}>
      <Photo uri={l.images[0]} style={{ height: W * 0.85, borderRadius: 12 }}>
        <Heart id={l.id} style={{ position: 'absolute', top: 14, right: 14 }} />
      </Photo>
      <View style={[S.between, { marginTop: 12 }]}><Text style={{ fontWeight: '700', color: c.t }}>{l.title}</Text><Text><Ionicons name="star" color={c.star} /> {l.rating.toFixed(1)}</Text></View>
      <View style={[S.between, { marginTop: 6 }]}>
        <Text style={S.muted}>{sub === 'bed' ? `🛏 ${l.bedrooms} bedroom` : l.category}</Text>
        <Text><Text style={{ fontWeight: '700', color: c.t }}>${l.price}</Text>/night</Text>
      </View>
    </Pressable>
  );
};
