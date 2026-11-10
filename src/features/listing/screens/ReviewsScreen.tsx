import { useCallback } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Stars } from '@/components';
import { S } from '@/constants/theme';
import { avatar } from '@/data/reviews';
import { ListingState, useListing } from '@/features/listing/components/shared';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export function ReviewsScreen({ route }: any) {
  const listingId = route.params?.id;
  const l = useListing(listingId);
  const { listingsLoading, listingsError, refreshListings } = useApp();
  const { colors } = useTheme();
  const { t, isVietnamese } = useLanguage();

  useFocusEffect(
    useCallback(() => {
      void refreshListings();
    }, [refreshListings])
  );

  if (!l) {
    return (
      <Screen>
        <ListingState loading={listingsLoading} error={listingsError} onRetry={() => void refreshListings()} />
      </Screen>
    );
  }

  const reviews = l.reviewItems ?? [];
  const totalReviews = reviews.length > 0 ? reviews.length : l.reviews;
  const totalStars = reviews.reduce((sum, r) => sum + r.stars, 0);
  const averageRating = totalReviews > 0 ? (totalStars / totalReviews).toFixed(1) : l.rating.toFixed(1);

  const bars = [5, 4, 3, 2, 1].map((stars) => reviews.filter((review) => review.stars === stars).length);
  const maxBar = Math.max(...bars, 1);

  return (
    <Screen>
      <Header title={t.listing.reviews} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 16 }}>
          {totalReviews} {t.listing.reviews}
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
          <View style={{ justifyContent: 'center' }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: colors.text }}>
              {averageRating}
              <Text style={{ fontSize: 18, fontWeight: '500', color: colors.muted }}>/5</Text>
            </Text>
            <View style={{ marginTop: 6 }}>
              <Stars n={Number(averageRating)} />
            </View>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6 }}>
              {isVietnamese ? `Dựa trên ${totalReviews} đánh giá` : `Based on ${totalReviews} reviews`}
            </Text>
          </View>

          {/* Star Distribution Breakdown */}
          <View style={{ width: '48%' }}>
            {bars.map((count, i) => (
              <View key={i} style={[S.row, { gap: 6, marginVertical: 3 }]}>
                <Text style={{ color: colors.muted, fontSize: 12, width: 20, textAlign: 'right' }}>
                  {5 - i}★
                </Text>
                <View
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: `${(count / maxBar) * 100}%`,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.star,
                    }}
                  />
                </View>
                <Text style={{ color: colors.muted, fontSize: 12, width: 22, textAlign: 'right' }}>
                  {count}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Review list */}
        {reviews.map((r, idx) => (
          <View
            key={`${r.name}-${idx}`}
            style={{
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={S.between}>
              <View style={[S.row, { gap: 10 }]}>
                <Image
                  source={{ uri: avatar(r.avatar || ((r.name.charCodeAt(0) % 70) + 1)) }}
                  style={{ width: 44, height: 44, borderRadius: 22 }}
                />
                <View>
                  <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>{r.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                    {isVietnamese ? 'Khách đã lưu trú' : 'Verified Guest'}
                  </Text>
                </View>
              </View>
              <Stars n={r.stars} />
            </View>
            <Text style={{ marginTop: 10, lineHeight: 22, color: colors.text, fontSize: 14 }}>{r.text}</Text>
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
