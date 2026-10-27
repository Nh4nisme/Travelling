import { View, Text, ScrollView, Image } from 'react-native';
import { Screen, Header, Stars } from '@/components';
import { c, S } from '@/constants/theme';
import { REVIEWS, avatar } from '@/data/reviews';
import { getListing } from '@/features/listing/components/shared';

export function ReviewsScreen({ route }: any) {
  const l = getListing(route);
  const bars = [0.8, 0.55, 0.22, 0.12, 0.04];
  return (
    <Screen><Header title="Reviews" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
        <Text style={S.h1}>{l.reviews} reviews</Text>
        <View style={[S.between, { backgroundColor: c.soft, padding: 16, borderRadius: 8, marginVertical: 16 }]}>
          <View><Text style={{ fontSize: 24 }}>4.5/5</Text><Stars n={5} /></View>
          <View style={{ width: '45%' }}>{bars.map((b, i) => <View key={i} style={[S.row, { gap: 8, marginVertical: 4 }]}><View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: '#CFD2DA' }}><View style={{ width: `${b * 100}%`, height: 6, borderRadius: 3, backgroundColor: c.star }} /></View><Text style={S.muted}>{5 - i}</Text></View>)}</View>
        </View>
        {REVIEWS.map((r) => (
          <View key={r.name} style={{ paddingVertical: 16, borderBottomWidth: 1, borderColor: c.soft }}>
            <View style={S.between}><View style={[S.row, { gap: 10 }]}><Image source={{ uri: avatar(r.av) }} style={{ width: 48, height: 48, borderRadius: 24 }} /><View><Text style={{ fontWeight: '700' }}>{r.name}</Text><Text style={S.muted}>A day ago</Text></View></View><Stars n={r.stars} /></View>
            <Text style={[S.muted, { marginTop: 10, lineHeight: 22 }]}>{r.text}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
