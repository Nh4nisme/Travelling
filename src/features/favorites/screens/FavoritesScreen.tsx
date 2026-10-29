import { View, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, ListingCard } from '@/components';
import { c, S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { ListingState } from '@/features/listing/components/shared';

export function FavoritesScreen({ navigation }: any) {
  const { favs, listings, listingsLoading, listingsError, refreshListings } = useApp();
  const data = listings.filter((l) => favs.includes(l.id));
  return (
    <Screen>
      <Text style={[S.h1, { padding: 16 }]}>Places you liked</Text>
      <FlatList data={data} keyExtractor={(l) => l.id} contentContainerStyle={{ padding: 16 }} renderItem={({ item }) => <ListingCard l={item} sub="bed" />}
        ListEmptyComponent={listingsLoading || listingsError
          ? <ListingState loading={listingsLoading} error={listingsError} onRetry={() => void refreshListings()} />
          : <View style={{ alignItems: 'center', marginTop: 80 }}><Ionicons name="heart-outline" size={56} color={c.b} /><Text style={S.muted}>No favorites yet. Tap ♡ on a place to save it.</Text><Btn title="Start exploring" onPress={() => navigation.navigate('Search')} style={{ marginTop: 16 }} /></View>} />
    </Screen>
  );
}
