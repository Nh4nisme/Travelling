import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, Header, Photo } from '@/components';
import { c, S } from '@/constants/theme';
import { fmt, nightsBetween } from '@/utils/date';
import { calcPrice, FEES } from '@/utils/pricing';
import { useApp } from '@/store/AppContext';
import { ListingState, useListing } from '@/features/listing/components/shared';

export function ConfirmScreen({ route, navigation }: any) {
  const l = useListing(route.params.id);
  const { search, listingsLoading, listingsError, refreshListings } = useApp();
  const [pay, setPay] = useState<'full' | 'part' | null>(null);
  if (!l) return <Screen><ListingState loading={listingsLoading} error={listingsError} onRetry={() => void refreshListings()} /></Screen>;
  const nights = nightsBetween(search.start, search.end);
  const guests = search.adults + search.children || 1;
  const { subtotal, total } = calcPrice(l.price, nights);
  const P = ({ k, t, d }: { k: 'full' | 'part'; t: string; d: string }) => (
    <Pressable onPress={() => setPay(k)} style={[S.between, { marginBottom: 16 }]}>
      <View style={{ flex: 1, paddingRight: 16 }}><Text style={{ fontWeight: '700' }}>{t}</Text><Text style={S.muted}>{d}</Text></View>
      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: pay === k ? c.p : c.m, alignItems: 'center', justifyContent: 'center' }}>{pay === k && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.p }} />}</View>
    </Pressable>
  );
  const Line = ({ a, b, bold }: any) => <View style={[S.between, { marginVertical: 6 }]}><Text style={{ fontSize: 16, fontWeight: bold ? '400' : '400' }}>{a}</Text><Text style={{ fontWeight: '700', fontSize: 16 }}>{b}</Text></View>;
  return (
    <Screen><Header title="Confirm and pay" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={[S.between, S.box]}>
          <View><Text style={{ fontSize: 22, fontWeight: '700' }}>${l.price}<Text style={{ fontSize: 14, fontWeight: '400' }}>/night</Text></Text><Text style={{ marginVertical: 6 }}>{l.title}</Text><Text><Ionicons name="star" color={c.star} /> {l.rating.toFixed(1)} ({l.reviews})</Text></View>
          <Photo uri={l.images[0]} style={{ width: 130, height: 90, borderRadius: 8 }} />
        </View>
        <Text style={[S.h1, { marginTop: 28, marginBottom: 12 }]}>Your trip</Text>
        <View style={[S.between, { marginBottom: 14 }]}><View><Text style={{ fontWeight: '700' }}>Dates</Text><Text style={{ marginTop: 4 }}>{search.start ? `${fmt(search.start)} - ${fmt(search.end ?? search.start)}` : 'Flexible (1 night)'}</Text></View><Pressable onPress={() => navigation.navigate('SearchModal')}><Ionicons name="create-outline" size={22} /></Pressable></View>
        <View style={S.between}><View><Text style={{ fontWeight: '700' }}>Guests</Text><Text style={{ marginTop: 4 }}>{guests} guest{guests > 1 ? 's' : ''}</Text></View><Pressable onPress={() => navigation.navigate('SearchModal')}><Ionicons name="create-outline" size={22} /></Pressable></View>
        <View style={{ height: 1, backgroundColor: c.soft, marginVertical: 24 }} />
        <Text style={[S.h1, { marginBottom: 12 }]}>Payment options</Text>
        <P k="full" t="Pay in full" d={`Pay $${total} now to finalize your booking.`} />
        <P k="part" t="Pay a part now" d="You can make a partial payment now and the remaining amount at a later time." />
        <View style={{ height: 1, backgroundColor: c.soft, marginVertical: 16 }} />
        <Text style={[S.h1, { marginBottom: 8 }]}>Price details</Text>
        <Line a={`$${l.price} x ${nights} night${nights > 1 ? 's' : ''}`} b={`$${subtotal}`} /><Line a="Kayak fee" b={`$${FEES.kayak}`} /><Line a="Street parking fee" b={`$${FEES.parking}`} />
        <View style={{ height: 1, backgroundColor: c.soft, marginVertical: 8 }} /><Line a="Total (USD)" b={`$${total}`} />
      </ScrollView>
      <View style={{ padding: 16, borderTopWidth: 1, borderColor: c.soft }}>
        <Btn title="Book now" onPress={() => (pay ? navigation.navigate('Success', { id: l.id, total: pay === 'full' ? total : Math.round(total / 2), method: pay }) : Alert.alert('Choose a payment option'))} />
      </View>
    </Screen>
  );
}
