import { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, Photo } from '@/components';
import { S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { fmtISORange } from '@/utils/date';
import { money } from '@/utils/pricing';
import { StatusBadge } from '../components/StatusBadge';
import { paymentSummary, sortForTab, tabOf } from '../utils';
import type { BookingTab } from '../utils';

export function BookingsScreen({ navigation }: any) {
  const { user, bookings, bookingsLoading, bookingsError, refreshBookings } = useApp();
  const { colors } = useTheme();
  const { t, isVietnamese } = useLanguage();
  const [tab, setTab] = useState<BookingTab>('upcoming');

  useFocusEffect(
    useCallback(() => {
      if (user) void refreshBookings();
    }, [user?.id, refreshBookings])
  );

  const tabs: { key: BookingTab; label: string; empty: string }[] = useMemo(
    () => [
      { key: 'upcoming', label: t.bookings.tabs.upcoming, empty: t.bookings.emptyUpcoming },
      { key: 'past', label: t.bookings.tabs.past, empty: t.bookings.emptyPast },
      { key: 'cancelled', label: t.bookings.tabs.cancelled, empty: t.bookings.emptyCancelled },
    ],
    [t]
  );

  const counts = useMemo(() => {
    const r: Record<BookingTab, number> = { upcoming: 0, past: 0, cancelled: 0 };
    bookings.forEach((b) => {
      r[tabOf(b)] += 1;
    });
    return r;
  }, [bookings]);

  const data = useMemo(
    () => sortForTab(bookings.filter((b) => tabOf(b) === tab), tab),
    [bookings, tab]
  );

  if (!user) {
    return (
      <Screen>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, padding: 16 }}>
          {t.bookings.title}
        </Text>
        <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 24 }}>
          <Ionicons name="lock-closed-outline" size={56} color={colors.border} />
          <Text style={{ color: colors.muted, marginTop: 12, textAlign: 'center' }}>
            {t.bookings.signInPrompt}
          </Text>
          <Btn
            title={t.profile.signIn}
            onPress={() => navigation.navigate('Auth')}
            style={{ marginTop: 20 }}
          />
        </View>
      </Screen>
    );
  }

  const emptyText = tabs.find((x) => x.key === tab)?.empty ?? '';

  return (
    <Screen>
      <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, padding: 16, paddingBottom: 12 }}>
        {t.bookings.title}
      </Text>

      {/* Tabs Switcher */}
      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: 16,
          backgroundColor: colors.soft,
          borderRadius: 20,
          padding: 3,
        }}
      >
        {tabs.map((item) => {
          const isActive = tab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={{
                flex: 1,
                paddingVertical: 9,
                alignItems: 'center',
                borderRadius: 18,
                backgroundColor: isActive ? colors.primary : 'transparent',
              }}
            >
              <Text
                style={{
                  fontWeight: '600',
                  color: isActive ? '#fff' : colors.muted,
                  fontSize: 13,
                }}
              >
                {item.label}
                {counts[item.key] ? ` (${counts[item.key]})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!!bookingsError && (
        <View
          style={{
            margin: 16,
            marginBottom: 0,
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.dangerSoft,
            borderWidth: 1,
            borderColor: colors.danger,
          }}
        >
          <Text style={{ color: colors.danger }}>{bookingsError}</Text>
          <Btn
            title={t.bookings.tryAgain}
            outline
            onPress={() => void refreshBookings()}
            style={{ marginTop: 8 }}
          />
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 16, gap: 14, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={bookingsLoading}
            onRefresh={() => void refreshBookings()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          bookingsLoading ? undefined : (
            <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 24 }}>
              <Ionicons name="grid-outline" size={56} color={colors.border} />
              <Text style={{ color: colors.muted, marginTop: 12, textAlign: 'center' }}>
                {emptyText}
              </Text>
              {tab === 'upcoming' && (
                <Btn
                  title={t.bookings.findPlace}
                  onPress={() => navigation.navigate('Search')}
                  style={{ marginTop: 20 }}
                />
              )}
            </View>
          )
        }
        renderItem={({ item }) => {
          const pay = paymentSummary(item, isVietnamese);
          return (
            <Pressable
              onPress={() => navigation.navigate('BookingDetail', { id: item.id })}
              style={[
                S.row,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 14,
                  padding: 14,
                  gap: 12,
                  alignItems: 'flex-start',
                  opacity: item.stage === 'cancelled' ? 0.75 : 1,
                },
              ]}
            >
              <Photo uri={item.listing.image} style={{ width: 90, height: 90, borderRadius: 10 }} />
              <View style={{ flex: 1, gap: 3 }}>
                <StatusBadge stage={item.stage} />
                <Text
                  style={{ fontWeight: '700', fontSize: 16, color: colors.text, marginTop: 4 }}
                  numberOfLines={1}
                >
                  {item.listing.title}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {fmtISORange(item.checkIn, item.checkOut)}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {item.nights} {t.bookings.nights} · {item.guests} {t.bookings.guests} · {item.ref}
                </Text>
                <Text style={{ fontWeight: '700', color: colors.text, marginTop: 4 }}>
                  {money(item.price.total)} ·{' '}
                  <Text style={{ color: pay.color, fontWeight: '600' }}>{pay.label}</Text>
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
