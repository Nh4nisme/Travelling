import { View, Text, ScrollView, Image } from 'react-native';
import { Screen, Header, Stars } from '@/components';
import { c, S } from '@/constants/theme';
import { avatar } from '@/data/reviews';
import { ListingState, useListing } from '@/features/listing/components/shared';
import { useApp } from '@/store/AppContext';

export function ReviewsScreen({ route }: any) {
  const l = useListing(route.params.id);
  const { listingsLoading, listingsError, refreshListings } = useApp();
  if (!l) return <Screen><ListingState loading={listingsLoading} error={listingsError} onRetry={() => void refreshListings()} /></Screen>;
  const reviews = l.reviewItems ?? [];
  const bars = [5, 4, 3, 2, 1].map((stars) => reviews.filter((review) => review.stars === stars).length);
  const maxBar = Math.max(...bars, 1);
  return (
    <Screen><Header title="Reviews" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
        <Text style={S.h1}>{l.reviews} reviews</Text>
        <View style={[S.between, { backgroundColor: c.soft, padding: 16, borderRadius: 8, marginVertical: 16 }]}>
          <View><Text style={{ fontSize: 24 }}>{l.rating.toFixed(1)}/5</Text><Stars n={l.rating} /></View>
          <View style={{ width: '45%' }}>{bars.map((count, i) => <View key={i} style={[S.row, { gap: 8, marginVertical: 4 }]}><View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: '#CFD2DA' }}><View style={{ width: `${(count / maxBar) * 100}%`, height: 6, borderRadius: 3, backgroundColor: c.star }} /></View><Text style={S.muted}>{5 - i}</Text></View>)}</View>
        </View>
        {reviews.map((r) => (
          <View key={r.name} style={{ paddingVertical: 16, borderBottomWidth: 1, borderColor: c.soft }}>
            <View style={S.between}><View style={[S.row, { gap: 10 }]}><Image source={{ uri: avatar(r.avatar) }} style={{ width: 48, height: 48, borderRadius: 24 }} /><Text style={{ fontWeight: '700' }}>{r.name}</Text></View><Stars n={r.stars} /></View>
            <Text style={[S.muted, { marginTop: 10, lineHeight: 22 }]}>{r.text}</Text>
          </View>
        ))}
        {!reviews.length && <Text style={S.muted}>No written reviews yet.</Text>}
      </ScrollView>
    </Screen>
  );
}
