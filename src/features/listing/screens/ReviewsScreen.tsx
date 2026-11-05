import { View, Text, ScrollView, Image } from 'react-native';
import { Screen, Header, Stars } from '@/components';
import { S } from '@/constants/theme';
import { avatar } from '@/data/reviews';
import { ListingState, useListing } from '@/features/listing/components/shared';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export function ReviewsScreen({ route }: any) {
  const l = useListing(route.params.id);
  const { listingsLoading, listingsError, refreshListings } = useApp();
  const { colors } = useTheme();
  const { t } = useLanguage();

  if (!l) {
    return (
      <Screen>
        <ListingState loading={listingsLoading} error={listingsError} onRetry={() => void refreshListings()} />
      </Screen>
    );
  }

  const reviews = l.reviewItems ?? [];
  const bars = [5, 4, 3, 2, 1].map((stars) => reviews.filter((review) => review.stars === stars).length);
  const maxBar = Math.max(...bars, 1);

  return (
    <Screen>
      <Header title={t.listing.reviews} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 16 }}>
          {l.reviews} {t.listing.reviews}
        </Text>

        {/* Rating Overview Card */}
        <View
          style={[
            S.between,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              padding: 16,
              borderRadius: 12,
              marginVertical: 16,
            },
          ]}
        >
          <View>
            <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text }}>
              {l.rating.toFixed(1)}/5
            </Text>
            <Stars n={l.rating} />
          </View>
          <View style={{ width: '45%' }}>
            {bars.map((count, i) => (
              <View key={i} style={[S.row, { gap: 8, marginVertical: 4 }]}>
                <View
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: `${(count / maxBar) * 100}%`,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.star,
                    }}
                  />
                </View>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{5 - i}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Review list */}
        {reviews.map((r) => (
          <View
            key={r.name}
            style={{
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={S.between}>
              <View style={[S.row, { gap: 10 }]}>
                <Image source={{ uri: avatar(r.avatar) }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>{r.name}</Text>
              </View>
              <Stars n={r.stars} />
            </View>
            <Text style={{ marginTop: 10, lineHeight: 22, color: colors.text }}>{r.text}</Text>
          </View>
        ))}

        {!reviews.length && (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 30 }}>
            {t.listing.noReviews}
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}
