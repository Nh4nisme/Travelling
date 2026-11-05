import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Screen, Btn, Header, Stepper } from '@/components';
import { S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { ListingState, useListing } from '@/features/listing/components/shared';
import { Calendar } from '@/features/search/components/Calendar';
import { bookingService } from '@/services/bookingService';
import { fmtISO, nightsBetween, startOfToday, toISO } from '@/utils/date';
import { calcPrice, money } from '@/utils/pricing';
import { isDateBlocked, rangeHitsBooked } from '@/utils/availability';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export function BookingDatesScreen({ route, navigation }: any) {
  const { id, edit } = route.params as { id: string; edit?: boolean };
  const l = useListing(id);
  const { search, setSearch, listingsLoading, listingsError, refreshListings } = useApp();
  const { colors } = useTheme();
  const { t, isVietnamese } = useLanguage();
  const today = useMemo(startOfToday, []);

  const [start, setStart] = useState<Date | undefined>(
    search.start && search.start >= today ? search.start : undefined
  );
  const [end, setEnd] = useState<Date | undefined>(
    search.start && search.end && search.start >= today && search.end > search.start
      ? search.end
      : undefined
  );
  const max = l?.maxGuests ?? 2;
  const [adults, setAdults] = useState(Math.min(Math.max(1, search.adults || 1), max));
  const [children, setChildren] = useState(
    Math.min(search.children, Math.max(0, max - Math.max(1, search.adults || 1)))
  );

  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState('loading');
    bookingService
      .availability(id)
      .then((r) => {
        if (active) {
          setBooked(new Set(r.bookedNights));
          setState('ready');
        }
      })
      .catch(() => {
        if (active) setState('error');
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);

  const sortedBooked = useMemo(() => Array.from(booked).sort(), [booked]);

  useEffect(() => {
    if (start && end && rangeHitsBooked(start, end, sortedBooked)) {
      setStart(undefined);
      setEnd(undefined);
    }
  }, [sortedBooked]);

  if (!l) {
    return (
      <Screen>
        <Header title={t.bookingFlow.selectDates} />
        <ListingState loading={listingsLoading} error={listingsError} onRetry={() => void refreshListings()} />
      </Screen>
    );
  }

  const isBlocked = (d: Date) => isDateBlocked(d, start, end, sortedBooked, today);

  const pick = (d: Date) => {
    if (!start || end) {
      setStart(d);
      setEnd(undefined);
      return;
    }
    if (d <= start) {
      setStart(d);
      return;
    }
    setEnd(d);
  };

  const setA = (n: number) => {
    const a = Math.max(1, Math.min(n, max));
    setAdults(a);
    setChildren((ch) => Math.min(ch, max - a));
  };
  const setC = (n: number) => setChildren(Math.max(0, Math.min(n, max - adults)));

  const nights = start && end ? nightsBetween(start, end) : 0;
  const est = nights ? calcPrice(l.price, nights).total : 0;

  const next = () => {
    if (!start || !end) return;
    setSearch({ ...search, start, end, adults, children });
    if (edit) navigation.goBack();
    else navigation.replace('Confirm', { id: l.id });
  };

  return (
    <Screen>
      <Header title={t.bookingFlow.selectDates} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{l.title}</Text>
        <Text style={{ color: colors.muted, marginBottom: 12, marginTop: 4 }}>
          {l.city}, {l.country} · {money(l.price)}/{t.listing.night}
        </Text>

        {state === 'loading' && (
          <View style={[S.row, { gap: 8, marginBottom: 10 }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.muted }}>
              {isVietnamese ? 'Đang kiểm tra ngày trống…' : 'Checking availability…'}
            </Text>
          </View>
        )}
        {state === 'error' && (
          <View
            style={{
              backgroundColor: colors.card,
              borderColor: colors.danger,
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: colors.danger }}>
              {isVietnamese
                ? 'Không kiểm tra được ngày trống. Vui lòng thử lại.'
                : "Couldn't check availability. Please try again."}
            </Text>
            <Btn
              title={t.bookings.tryAgain}
              outline
              onPress={() => setAttempt((n) => n + 1)}
              style={{ marginTop: 8 }}
            />
          </View>
        )}

        <Calendar start={start} end={end} onPick={pick} isBlocked={isBlocked} />
        <Text style={{ textAlign: 'center', marginTop: 10, color: colors.muted, fontSize: 13 }}>
          {start && end
            ? `${fmtISO(toISO(start))} → ${fmtISO(toISO(end))} · ${nights} ${t.bookings.nights}`
            : start
            ? isVietnamese
              ? 'Bây giờ hãy chọn ngày trả phòng'
              : 'Now select your check-out date'
            : isVietnamese
            ? 'Chọn ngày nhận phòng'
            : 'Select your check-in date'}
        </Text>
        <Text style={{ textAlign: 'center', marginTop: 4, color: colors.muted, fontSize: 12 }}>
          {isVietnamese
            ? 'Những ngày gạch ngang là đã có người đặt.'
            : 'Crossed-out dates are already booked.'}
        </Text>

        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 20 }} />

        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
          {t.bookingFlow.guests}
        </Text>
        <Text style={{ color: colors.muted, marginBottom: 10, fontSize: 13 }}>
          {isVietnamese
            ? `Chỗ nghỉ này nhận tối đa ${max} khách.`
            : `This place accepts up to ${max} guests.`}
        </Text>

        <View style={[S.between, { paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.soft }]}>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
              {t.search.adults}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
              {isVietnamese ? 'Tối thiểu 1' : 'At least 1'}
            </Text>
          </View>
          <Stepper value={adults} onChange={setA} />
        </View>

        <View style={[S.between, { paddingVertical: 12 }]}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
            {t.search.children}
          </Text>
          <Stepper value={children} onChange={setC} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        style={{
          padding: 16,
          borderTopWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        {nights > 0 && (
          <Text style={{ textAlign: 'center', marginBottom: 8, color: colors.muted, fontSize: 13 }}>
            {isVietnamese
              ? `Ước tính tổng cộng ${money(est)} · giá cuối cùng hiển thị ở bước tiếp theo`
              : `Estimated total ${money(est)} · final price shown next`}
          </Text>
        )}
        <Btn
          title={isVietnamese ? 'Tiếp tục' : 'Continue'}
          onPress={next}
          disabled={!start || !end || state !== 'ready'}
        />
      </View>
    </Screen>
  );
}
