import { useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ListingCard } from '@/components';
import { S } from '@/constants/theme';
import { ListingState } from '@/features/listing/components/shared';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import type { Listing } from '@/types/listing';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Beach: 'umbrella-outline',
  Mountain: 'triangle-outline',
  Camping: 'bonfire-outline',
};

export function HomeScreen({ navigation }: any) {
  const { listings, listingsLoading, listingsError, refreshListings } = useApp();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [cat, setCat] = useState<Listing['category']>('Beach');

  const categories = useMemo(
    () => [...new Set(listings.map((listing) => listing.category))],
    [listings]
  );
  const activeCategory = categories.includes(cat) ? cat : categories[0];
  const data = listings.filter((listing) => listing.category === activeCategory);

  const getCategoryLabel = (name: string) => {
    return (t.home.categories as Record<string, string>)[name] ?? name;
  };

  return (
    <Screen>
      <View
        style={{
          backgroundColor: isDark ? '#1B222C' : '#E8FAFC',
          paddingHorizontal: 16,
          paddingTop: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => navigation.navigate('SearchModal')}
          style={[
            S.row,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              paddingVertical: 14,
              gap: 10,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.primary} />
          <Text style={{ color: colors.muted, fontSize: 16 }}>{t.home.whereToStay}</Text>
        </Pressable>

        <View style={[S.between, { marginTop: 10 }]}>
          {categories.map((n) => {
            const isActive = activeCategory === n;
            return (
              <Pressable
                key={n}
                onPress={() => setCat(n)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: 2,
                  borderBottomColor: isActive ? colors.primary : 'transparent',
                }}
              >
                <Ionicons
                  name={CATEGORY_ICONS[n] ?? 'search-outline'}
                  size={24}
                  color={isActive ? colors.primary : colors.muted}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: isActive ? colors.primary : colors.muted,
                    fontWeight: isActive ? '700' : '400',
                    marginTop: 4,
                  }}
                >
                  {getCategoryLabel(n)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => <ListingCard l={item} />}
        ListEmptyComponent={
          listingsLoading || listingsError ? (
            <ListingState
              loading={listingsLoading}
              error={listingsError}
              onRetry={() => void refreshListings()}
            />
          ) : (
            <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 40 }}>
              {t.home.noPlaces}
            </Text>
          )
        }
      />
    </Screen>
  );
}
