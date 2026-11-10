import { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, Check, ListingCard } from '@/components';
import { S } from '@/constants/theme';
import { fmt } from '@/utils/date';
import { listingService } from '@/services/listingService';
import { useApp } from '@/store/AppContext';
import { defaultFilters } from '@/store/defaults';
import type { Listing } from '@/types/listing';
import { ListingState } from '@/features/listing/components/shared';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export function ResultsScreen({ navigation }: any) {
  const { search, filters, setFilters } = useApp();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [data, setData] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  // BR06: Tính số đêm từ search dates để hiển thị tổng giá
  const calculateNights = (): number => {
    if (!search.start || !search.end) return 1;
    const diff = search.end.getTime() - search.start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const types = filters.types.join(',');
  const facilities = filters.facilities.join(',');

  useEffect(() => {
    let active = true;
    setLoading(true);
    listingService
      .search(search, filters)
      .then((listings) => {
        if (active) {
          setData(listings);
          setError(null);
        }
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to search places.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search.query, search.location, filters.min, filters.max, types, facilities, retry]);

  const g = search.adults + search.children;
  const destination = search.query || search.location || t.search.anywhere;
  const time = search.start ? `${fmt(search.start)} - ${fmt(search.end ?? search.start)}` : t.search.anytime;
  const guestText = `${g || 1} ${g > 1 ? t.search.guests : t.search.guest}`;
  const label = `${destination}, ${time}, ${guestText}`;

  return (
    <Screen>
      {/* Top search summary bar */}
      <View
        style={[
          S.row,
          {
            margin: 16,
            gap: 10,
            paddingVertical: 12,
            paddingHorizontal: 14,
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 12,
          },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('SearchModal')}>
          <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '500' }}>
            {label}
          </Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Filters')} hitSlop={10}>
          <Ionicons name="options-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={data}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View
            style={[
              S.between,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
              },
            ]}
          >
            <View>
              <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>
                {t.search.presentTotal}
              </Text>
              <Text style={{ fontSize: 13, marginTop: 4, color: colors.muted }}>
                {t.search.allInclusive}
              </Text>
            </View>
            <Check
              on={filters.total}
              onPress={() => setFilters({ ...filters, total: !filters.total })}
            />
          </View>
        }
        ListEmptyComponent={
          loading || error ? (
            <ListingState loading={loading} error={error} onRetry={() => setRetry((value) => value + 1)} />
          ) : (
            <View style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 20 }}>
              <Ionicons name="search-outline" size={48} color={colors.border} />
              <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 12, fontSize: 15 }}>
                {t.search.noPlacesMatch}
              </Text>
              <Btn
                title={t.search.resetFilters}
                outline
                onPress={() => setFilters(defaultFilters)}
                style={{ marginTop: 16 }}
              />
            </View>
          )
        }
        renderItem={({ item }) => (
          <ListingCard
            l={item}
            sub="bed"
            showTotal={filters.total}
            estimatedNights={calculateNights()}
          />
        )}
      />
    </Screen>
  );
}
