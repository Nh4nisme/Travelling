import { View, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, ListingCard } from '@/components';
import { c, S } from '@/constants/theme';
import { listingService } from '@/services/listingService';
import { useApp } from '@/store/AppContext';

export function FavoritesScreen({ navigation }: any) {
  const { favs } = useApp();
  const data = listingService.getAll().filter((l) => favs.includes(l.id));
  return (
    <Screen>
      <Text style={[S.h1, { padding: 16 }]}>Places you liked</Text>
      <FlatList data={data} keyExtractor={(l) => l.id} contentContainerStyle={{ padding: 16 }} renderItem={({ item }) => <ListingCard l={item} sub="bed" />}
        ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 80 }}><Ionicons name="heart-outline" size={56} color={c.b} /><Text style={S.muted}>No favorites yet. Tap ♡ on a place to save it.</Text><Btn title="Start exploring" onPress={() => navigation.navigate('Search')} style={{ marginTop: 16 }} /></View>} />
    </Screen>
  );
}
