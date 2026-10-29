import { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, Photo } from '@/components';
import { c, S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { fmtISORange } from '@/utils/date';
import { money } from '@/utils/pricing';
import { StatusBadge } from '../components/StatusBadge';
import { paymentSummary, sortForTab, tabOf } from '../utils';
import type { BookingTab } from '../utils';

const TABS: { key: BookingTab; label: string; empty: string }[] = [
  { key: 'upcoming', label: 'Upcoming', empty: 'No upcoming trips.' },
  { key: 'past', label: 'Past', empty: 'No past stays yet.' },
  { key: 'cancelled', label: 'Cancelled', empty: 'No cancelled bookings.' },
];

export function BookingsScreen({ navigation }: any) {
  const { user, bookings, bookingsLoading, bookingsError, refreshBookings } = useApp();
  const [tab, setTab] = useState<BookingTab>('upcoming');

  // Mỗi lần mở tab này thì làm mới để thấy đúng trạng thái (đang ở / đã qua / thay đổi từ thiết bị khác)
  useFocusEffect(useCallback(() => { if (user) void refreshBookings(); }, [user?.id, refreshBookings]));

  const counts = useMemo(() => {
    const r: Record<BookingTab, number> = { upcoming: 0, past: 0, cancelled: 0 };
    bookings.forEach((b) => { r[tabOf(b)] += 1; });
    return r;
  }, [bookings]);
  const data = useMemo(() => sortForTab(bookings.filter((b) => tabOf(b) === tab), tab), [bookings, tab]);

  if (!user) {
    return (
      <Screen>
        <Text style={[S.h1, { padding: 16 }]}>Bookings</Text>
        <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 24 }}>
          <Ionicons name="lock-closed-outline" size={56} color={c.b} />
          <Text style={[S.muted, { marginTop: 8, textAlign: 'center' }]}>Sign in to see your bookings.</Text>
          <Btn title="Sign in" onPress={() => navigation.navigate('Auth')} style={{ marginTop: 16 }} />
        </View>
      </Screen>
    );
  }

  const empty = TABS.find((t) => t.key === tab)!.empty;

  return (
    <Screen>
      <Text style={[S.h1, { padding: 16, paddingBottom: 8 }]}>Bookings</Text>
      <View style={{ flexDirection: 'row', marginHorizontal: 16, backgroundColor: c.soft, borderRadius: 20, padding: 3 }}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={{ flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 18, backgroundColor: tab === t.key ? c.p : 'transparent' }}>
            <Text style={{ fontWeight: '600', color: tab === t.key ? '#fff' : c.t }}>{t.label}{counts[t.key] ? ` (${counts[t.key]})` : ''}</Text>
          </Pressable>
        ))}
      </View>
      {!!bookingsError && (
        <View style={[S.box, { margin: 16, marginBottom: 0, borderColor: '#F3B6BB' }]}>
          <Text style={{ color: '#B3323D' }}>{bookingsError}</Text>
          <Btn title="Try again" outline onPress={() => void refreshBookings()} style={{ marginTop: 8 }} />
        </View>
      )}
      <FlatList
        data={data}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 16, gap: 14, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={bookingsLoading} onRefresh={() => void refreshBookings()} tintColor={c.p} colors={[c.p]} />}
        ListEmptyComponent={bookingsLoading ? null : (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="grid-outline" size={56} color={c.b} />
            <Text style={S.muted}>{empty}</Text>
            {tab === 'upcoming' && <Btn title="Find a place" onPress={() => navigation.navigate('Search')} style={{ marginTop: 16 }} />}
          </View>
        )}
        renderItem={({ item }) => {
          const pay = paymentSummary(item);
          return (
            <Pressable onPress={() => navigation.navigate('BookingDetail', { id: item.id })} style={[S.row, S.box, { gap: 12, alignItems: 'flex-start', opacity: item.stage === 'cancelled' ? 0.8 : 1 }]}>
              <Photo uri={item.listing.image} style={{ width: 90, height: 90, borderRadius: 10 }} />
              <View style={{ flex: 1, gap: 2 }}>
                <StatusBadge stage={item.stage} />
                <Text style={{ fontWeight: '700', marginTop: 4 }} numberOfLines={1}>{item.listing.title}</Text>
                <Text style={S.muted}>{fmtISORange(item.checkIn, item.checkOut)}</Text>
                <Text style={S.muted}>{item.nights} night{item.nights > 1 ? 's' : ''} · {item.guests} guest{item.guests > 1 ? 's' : ''} · {item.ref}</Text>
                <Text style={{ fontWeight: '700', marginTop: 4 }}>{money(item.price.total)} · <Text style={{ color: pay.color, fontWeight: '600' }}>{pay.label}</Text></Text>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
