import { useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ListingCard } from '@/components';
import { c, S } from '@/constants/theme';
import { ListingState } from '@/features/listing/components/shared';
import { useApp } from '@/store/AppContext';
import type { Listing } from '@/types/listing';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = { Beach: 'umbrella-outline', Mountain: 'triangle-outline', Camping: 'bonfire-outline' };

export function HomeScreen({ navigation }: any) {
  const { listings, listingsLoading, listingsError, refreshListings } = useApp();
  const [cat, setCat] = useState<Listing['category']>('Beach');
  const categories = useMemo(() => [...new Set(listings.map((listing) => listing.category))], [listings]);
  const activeCategory = categories.includes(cat) ? cat : categories[0];
  const data = listings.filter((listing) => listing.category === activeCategory);
  return (
    <Screen style={{ backgroundColor: '#fff' }}>
      <View style={{ backgroundColor: '#E8FAFC', paddingHorizontal: 16, paddingTop: 8 }}>
        <Pressable onPress={() => navigation.navigate('SearchModal')} style={[S.row, S.box, { gap: 10, paddingVertical: 14 }]}>
          <Ionicons name="search" size={20} /><Text style={{ color: c.b, fontSize: 16 }}>Where do you want to stay?</Text>
        </Pressable>
        <View style={[S.between, { marginTop: 10 }]}>
          {categories.map((n) => (
            <Pressable key={n} onPress={() => setCat(n)} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: activeCategory === n ? c.p : 'transparent' }}>
              <Ionicons name={CATEGORY_ICONS[n] ?? 'search-outline'} size={24} color={activeCategory === n ? c.p : c.m} /><Text style={{ fontSize: 12, color: activeCategory === n ? c.p : c.m, fontWeight: activeCategory === n ? '700' : '400' }}>{n}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList data={data} keyExtractor={(l) => l.id} contentContainerStyle={{ padding: 16 }} renderItem={({ item }) => <ListingCard l={item} />}
        ListEmptyComponent={listingsLoading || listingsError ? <ListingState loading={listingsLoading} error={listingsError} onRetry={() => void refreshListings()} /> : <Text style={S.muted}>No places in this category yet.</Text>} />
    </Screen>
  );
}
