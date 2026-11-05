import { View, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, ListingCard } from '@/components';
import { useApp } from '@/store/AppContext';
import { ListingState } from '@/features/listing/components/shared';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export function FavoritesScreen({ navigation }: any) {
  const { favs, listings, listingsLoading, listingsError, refreshListings } = useApp();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const data = listings.filter((l) => favs.includes(l.id));

  return (
    <Screen>
      <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, padding: 16 }}>
        {t.favorites.title}
      </Text>
      <FlatList
        data={data}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => <ListingCard l={item} sub="bed" />}
        ListEmptyComponent={
          listingsLoading || listingsError ? (
            <ListingState
              loading={listingsLoading}
              error={listingsError}
              onRetry={() => void refreshListings()}
            />
          ) : (
            <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 24 }}>
              <Ionicons name="heart-outline" size={56} color={colors.border} />
              <Text style={{ color: colors.muted, marginTop: 12, textAlign: 'center' }}>
                {t.favorites.empty}
              </Text>
              <Btn
                title={t.favorites.startExploring}
                onPress={() => navigation.navigate('Search')}
                style={{ marginTop: 20 }}
              />
            </View>
          )
        }
      />
    </Screen>
  );
}
