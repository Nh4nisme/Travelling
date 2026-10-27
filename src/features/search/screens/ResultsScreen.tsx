import { View, Text, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, Check, ListingCard } from '@/components';
import { S } from '@/constants/theme';
import { fmt } from '@/utils/date';
import { listingService } from '@/services/listingService';
import { useApp } from '@/store/AppContext';
import { defaultFilters } from '@/store/defaults';
import { filterListings } from '@/features/search/utils/filterListings';

export function ResultsScreen({ navigation }: any) {
  const { search, filters, setFilters } = useApp();
  const q = search.query.trim().toLowerCase();
  const data = filterListings(listingService.getAll(), search, filters);
  const g = search.adults + search.children;
  const label = `${search.query || search.location}, ${search.start ? `${fmt(search.start)} - ${fmt(search.end ?? search.start)}` : 'Anytime'}, ${g || 1} guests`;
  return (
    <Screen>
      <View style={[S.row, S.box, { margin: 16, gap: 10, paddingVertical: 12 }]}>
        <Pressable onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={20} /></Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('SearchModal')}><Text numberOfLines={1}>{label}</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('Filters')}><Ionicons name="options-outline" size={22} /></Pressable>
      </View>
      <FlatList data={data} keyExtractor={(l) => l.id} contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<View style={[S.between, S.box, { marginBottom: 16 }]}><View><Text style={{ fontWeight: '700' }}>Present total price</Text><Text style={{ fontSize: 16, marginTop: 4 }}>All-inclusive, pre-tax</Text></View><Check on={filters.total} onPress={() => setFilters({ ...filters, total: !filters.total })} /></View>}
        ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 40 }}><Text style={S.muted}>No places match your filters.</Text><Btn title="Reset filters" outline onPress={() => setFilters(defaultFilters)} style={{ marginTop: 12 }} /></View>}
        renderItem={({ item }) => <ListingCard l={item} sub="bed" />} />
    </Screen>
  );
}
