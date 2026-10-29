import { View, Text, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, Photo } from '@/components';
import { c, S } from '@/constants/theme';
import { fmt } from '@/utils/date';
import { useApp } from '@/store/AppContext';
import { ListingState } from '@/features/listing/components/shared';

export function BookingsScreen({ navigation }: any) {
  const { bookings, listings, listingsLoading, listingsError, refreshListings } = useApp();
  const visibleBookings = bookings.filter((booking) => listings.some((listing) => listing.id === booking.listingId));
  return (
    <Screen>
      <Text style={[S.h1, { padding: 16 }]}>Bookings</Text>
      <FlatList data={visibleBookings} keyExtractor={(b) => b.id} contentContainerStyle={{ padding: 16, gap: 14 }}
        ListEmptyComponent={listingsLoading || listingsError
          ? <ListingState loading={listingsLoading} error={listingsError} onRetry={() => void refreshListings()} />
          : <View style={{ alignItems: 'center', marginTop: 80 }}><Ionicons name="grid-outline" size={56} color={c.b} /><Text style={S.muted}>No bookings yet.</Text><Btn title="Find a place" onPress={() => navigation.navigate('Search')} style={{ marginTop: 16 }} /></View>}
        renderItem={({ item }) => {
          const l = listings.find((listing) => listing.id === item.listingId);
          if (!l) return null;
          return (
            <Pressable onPress={() => navigation.navigate('Detail', { id: l.id })} style={[S.row, S.box, { gap: 12 }]}>
              <Photo uri={l.images[0]} style={{ width: 90, height: 90, borderRadius: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700' }}>{l.title}</Text>
                <Text style={S.muted}>{item.start ? `${fmt(item.start)} - ${fmt(item.end)}` : 'Flexible dates'}</Text>
                <Text style={S.muted}>Ref {item.ref}</Text>
                <Text style={{ fontWeight: '700', marginTop: 4 }}>${item.total} · <Text style={{ color: '#22A559' }}>Paid</Text></Text>
              </View>
            </Pressable>
          );
        }} />
    </Screen>
  );
}
