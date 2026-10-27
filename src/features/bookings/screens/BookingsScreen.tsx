import { View, Text, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, Photo } from '@/components';
import { c, S } from '@/constants/theme';
import { fmt } from '@/utils/date';
import { listingService } from '@/services/listingService';
import { useApp } from '@/store/AppContext';

export function BookingsScreen({ navigation }: any) {
  const { bookings } = useApp();
  return (
    <Screen>
      <Text style={[S.h1, { padding: 16 }]}>Bookings</Text>
      <FlatList data={bookings} keyExtractor={(b) => b.id} contentContainerStyle={{ padding: 16, gap: 14 }}
        ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 80 }}><Ionicons name="grid-outline" size={56} color={c.b} /><Text style={S.muted}>No bookings yet.</Text><Btn title="Find a place" onPress={() => navigation.navigate('Search')} style={{ marginTop: 16 }} /></View>}
        renderItem={({ item }) => {
          const l = listingService.getById(item.listingId);
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
