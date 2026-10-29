import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Screen, Btn, Header, Stepper } from '@/components';
import { c, S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { ListingState, useListing } from '@/features/listing/components/shared';
import { Calendar } from '@/features/search/components/Calendar';
import { bookingService } from '@/services/bookingService';
import { fmtISO, nightsBetween, startOfToday, toISO } from '@/utils/date';
import { calcPrice, money } from '@/utils/pricing';
import { isDateBlocked, rangeHitsBooked } from '@/utils/availability';

/**
 * Chọn ngày + số khách cho MỘT chỗ ở cụ thể. Những đêm đã có người đặt bị khoá trên lịch,
 * và khoảng chọn không được "đè" lên đêm đã đặt.
 */
export function BookingDatesScreen({ route, navigation }: any) {
  const { id, edit } = route.params as { id: string; edit?: boolean };
  const l = useListing(id);
  const { search, setSearch, listingsLoading, listingsError, refreshListings } = useApp();
  const today = useMemo(startOfToday, []);

  const [start, setStart] = useState<Date | undefined>(search.start && search.start >= today ? search.start : undefined);
  const [end, setEnd] = useState<Date | undefined>(search.start && search.end && search.start >= today && search.end > search.start ? search.end : undefined);
  const max = l?.maxGuests ?? 2;
  const [adults, setAdults] = useState(Math.min(Math.max(1, search.adults || 1), max));
  const [children, setChildren] = useState(Math.min(search.children, Math.max(0, max - Math.max(1, search.adults || 1))));

  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState('loading');
    bookingService.availability(id)
      .then((r) => { if (active) { setBooked(new Set(r.bookedNights)); setState('ready'); } })
      .catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [id, attempt]);

  const sortedBooked = useMemo(() => Array.from(booked).sort(), [booked]);

  // Nếu khoảng đang chọn vừa bị người khác đặt trùng thì bỏ chọn
  useEffect(() => {
    if (start && end && rangeHitsBooked(start, end, sortedBooked)) { setStart(undefined); setEnd(undefined); }
  }, [sortedBooked]);

  if (!l) return <Screen><Header title="Select dates" /><ListingState loading={listingsLoading} error={listingsError} onRetry={() => void refreshListings()} /></Screen>;

  const isBlocked = (d: Date) => isDateBlocked(d, start, end, sortedBooked, today);

  const pick = (d: Date) => {
    if (!start || end) { setStart(d); setEnd(undefined); return; }
    if (d <= start) { setStart(d); return; }
    setEnd(d);
  };

  const setA = (n: number) => { const a = Math.max(1, Math.min(n, max)); setAdults(a); setChildren((ch) => Math.min(ch, max - a)); };
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
      <Header title="Select dates" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={S.h2}>{l.title}</Text>
        <Text style={[S.muted, { marginBottom: 12 }]}>{l.city}, {l.country} · {money(l.price)}/night</Text>

        {state === 'loading' && <View style={[S.row, { gap: 8, marginBottom: 8 }]}><ActivityIndicator color={c.p} /><Text style={S.muted}>Checking availability…</Text></View>}
        {state === 'error' && (
          <View style={[S.box, { marginBottom: 12 }]}>
            <Text style={{ color: '#B3323D' }}>Couldn't check availability. Please try again.</Text>
            <Btn title="Retry" outline onPress={() => setAttempt((n) => n + 1)} style={{ marginTop: 8 }} />
          </View>
        )}

        <Calendar start={start} end={end} onPick={pick} isBlocked={isBlocked} />
        <Text style={{ textAlign: 'center', marginTop: 8, color: c.m }}>
          {start && end ? `${fmtISO(toISO(start))} → ${fmtISO(toISO(end))} · ${nights} night${nights > 1 ? 's' : ''}` : start ? 'Now select your check-out date' : 'Select your check-in date'}
        </Text>
        <Text style={{ textAlign: 'center', marginTop: 4, color: c.m, fontSize: 12 }}>Crossed-out dates are already booked.</Text>

        <View style={{ height: 1, backgroundColor: c.soft, marginVertical: 20 }} />
        <Text style={[S.h2, { marginBottom: 4 }]}>Guests</Text>
        <Text style={[S.muted, { marginBottom: 8 }]}>This place accepts up to {max} guests.</Text>
        <View style={[S.between, { paddingVertical: 10 }]}><View><Text style={{ fontSize: 16 }}>Adults</Text><Text style={S.muted}>At least 1</Text></View><Stepper value={adults} onChange={setA} /></View>
        <View style={[S.between, { paddingVertical: 10 }]}><Text style={{ fontSize: 16 }}>Children</Text><Stepper value={children} onChange={setC} /></View>
      </ScrollView>

      <View style={{ padding: 16, borderTopWidth: 1, borderColor: c.soft }}>
        {nights > 0 && <Text style={{ textAlign: 'center', marginBottom: 8, color: c.m }}>Estimated total {money(est)} · final price shown next</Text>}
        <Btn title="Continue" onPress={next} disabled={!start || !end || state !== 'ready'} />
      </View>
    </Screen>
  );
}
