import { useState } from 'react';
import { View, Text, Pressable, ScrollView, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Stars, Photo, Heart } from '@/components';
import { c, S, W } from '@/constants/theme';
import { IMG } from '@/data/images';
import { REVIEWS, avatar } from '@/data/reviews';
import { getListing, ICON, Section, More } from '@/features/listing/components/shared';

export function DetailScreen({ route, navigation }: any) {
  const l = getListing(route);
  const [idx, setIdx] = useState(0);
  const feats = ['Wifi', ...l.facilities.filter((f) => f !== 'Internet access'), 'Garden'].slice(0, 4);
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView>
        <View>
          <FlatList horizontal pagingEnabled showsHorizontalScrollIndicator={false} data={l.images} keyExtractor={(x) => x} onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
            renderItem={({ item }) => <Photo uri={item} style={{ width: W, height: 260 }} />} />
          <Pressable onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 50, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.85)', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-back" size={22} /></Pressable>
          <Heart id={l.id} style={{ position: 'absolute', top: 46, right: 16 }} />
          <View style={{ position: 'absolute', right: 14, bottom: 12, backgroundColor: 'rgba(0,0,0,.65)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ color: '#fff' }}>🖼 {idx + 1}/{l.images.length}</Text></View>
        </View>
        <View style={{ padding: 16 }}>
          <Text style={S.h1}>{l.title}</Text>
          <View style={[S.between, { marginTop: 8 }]}>
            <View style={[S.row, { gap: 4 }]}><Ionicons name="location" size={16} color={c.p} /><Text style={S.muted}>{l.city}, {l.country}</Text></View>
            <Pressable onPress={() => navigation.navigate('Description')}><Text style={{ color: c.p, textDecorationLine: 'underline' }}>View map</Text></Pressable>
          </View>
          <Pressable onPress={() => navigation.navigate('Reviews', { id: l.id })} style={[S.between, { backgroundColor: c.soft, borderRadius: 8, padding: 12, marginTop: 14 }]}>
            <Text><Ionicons name="star" color={c.star} /> {l.rating === 5 ? '4.5' : l.rating}/5</Text><Text style={S.muted}>{l.reviews} reviews  ›</Text>
          </Pressable>
        </View>
        <Section title="Facilities & services">
          <Text style={[S.muted, { marginBottom: 10 }]}>2 Guests   {l.bedrooms} bedroom   1 bed   1 bath</Text>
          {feats.map((f) => <View key={f} style={[S.row, { gap: 12, marginVertical: 6 }]}><Ionicons name={ICON[f] ?? 'checkmark-circle-outline'} size={20} /><Text style={{ fontSize: 16 }}>{f}</Text></View>)}
          <More t="Show all" onPress={() => navigation.navigate('Facilities', { id: l.id })} />
        </Section>
        <Section title="Reviews" right={<Pressable onPress={() => navigation.navigate('Reviews', { id: l.id })}><Text style={S.muted}>See all ›</Text></Pressable>}>
          <Text style={{ fontSize: 34, fontWeight: '700' }}>4.5<Text style={{ fontSize: 16, color: c.m }}>/5</Text></Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {REVIEWS.map((r) => (
              <View key={r.name} style={[S.box, { width: W * 0.72, marginRight: 12 }]}>
                <View style={S.between}><View style={[S.row, { gap: 8 }]}><Image source={{ uri: avatar(r.av) }} style={{ width: 36, height: 36, borderRadius: 18 }} /><View><Text style={{ fontWeight: '700' }}>{r.name}</Text><Text style={S.muted}>A day ago</Text></View></View><Stars n={r.stars} /></View>
                <Text numberOfLines={2} style={[S.muted, { marginTop: 10 }]}>{r.text}</Text>
              </View>
            ))}
          </ScrollView>
        </Section>
        <Section title="Policies">
          <View style={{ backgroundColor: c.soft, padding: 12, borderRadius: 8 }}><Text style={{ fontWeight: '700', marginBottom: 8 }}>House rules</Text><Text style={S.muted}>🕑 Earliest check-in time: 14:00</Text><Text style={[S.muted, { marginTop: 6 }]}>🕑 Latest check-out time: 12:00</Text></View>
          <Text style={{ fontWeight: '700', marginTop: 12 }}>Check-in policies</Text>
          <Text numberOfLines={2} style={S.muted}>It's always a good idea to confirm the check-in policy directly with the owner/manager before your arrival so that you can...</Text>
          <More t="View more  ›" onPress={() => navigation.navigate('Description', { id: l.id })} />
        </Section>
        <Section title="Description">
          <Photo uri={IMG.pool} style={{ height: 150, borderRadius: 8 }} />
          <Text numberOfLines={3} style={[S.muted, { marginTop: 10 }]}>{l.desc}</Text>
          <More t="View more  ›" onPress={() => navigation.navigate('Description', { id: l.id })} />
        </Section>
      </ScrollView>
      <View style={[S.between, { padding: 16, paddingBottom: 28, borderTopWidth: 1, borderColor: c.soft }]}>
        <Text style={S.muted}>From: <Text style={{ fontWeight: '700', color: c.t, fontSize: 16 }}>${l.price}</Text>/night</Text>
        <Btn title="Book now" onPress={() => navigation.navigate('Confirm', { id: l.id })} style={{ paddingHorizontal: 40 }} />
      </View>
    </View>
  );
}
