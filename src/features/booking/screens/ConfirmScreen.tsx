import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, Header, Photo } from '@/components';
import { c, S } from '@/constants/theme';
import { fmtISO, toISO } from '@/utils/date';
import { money } from '@/utils/pricing';
import { notify } from '@/utils/dialog';
import { useApp } from '@/store/AppContext';
import { ListingState, useListing } from '@/features/listing/components/shared';
import { bookingService, makeIdempotencyKey } from '@/services/bookingService';
import type { PaymentMethod, Quote } from '@/store/types';

type QuoteState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; quote: Quote }
  | { status: 'error'; message: string; code?: string };

export function ConfirmScreen({ route, navigation }: any) {
  const l = useListing(route.params.id);
  const { search, user, signOut, upsertBooking, listingsLoading, listingsError, refreshListings } = useApp();
  const [pay, setPay] = useState<PaymentMethod | null>(null);
  const [quote, setQuote] = useState<QuoteState>({ status: 'idle' });
  const [submitting, setSubmitting] = useState(false);
  const [reload, setReload] = useState(0);
  const attempt = useRef({ sig: '', key: '' });

  const { start, end, adults, children } = search;
  const hasDates = !!start && !!end && +end > +start;
  const guests = adults + children;
  const startISO = hasDates ? toISO(start!) : '';
  const endISO = hasDates ? toISO(end!) : '';
  const ready = hasDates && adults >= 1;

  // Hỏi server giá + kiểm tra còn trống mỗi khi ngày/khách thay đổi
  useEffect(() => {
    if (!l || !ready || !user) { setQuote({ status: 'idle' }); return; }
    let active = true;
    setQuote({ status: 'loading' });
    bookingService.quote({ listingId: l.id, checkIn: startISO, checkOut: endISO, adults, children })
      .then(({ quote }) => { if (active) setQuote({ status: 'ok', quote }); })
      .catch((e: any) => { if (active) setQuote({ status: 'error', message: e?.message ?? 'Could not price this stay.', code: e?.code }); });
    return () => { active = false; };
  }, [l?.id, ready, startISO, endISO, adults, children, reload, user?.id]);

  if (!l) return <Screen><Header title="Confirm and pay" /><ListingState loading={listingsLoading} error={listingsError} onRetry={() => void refreshListings()} /></Screen>;

  const editTrip = () => navigation.navigate('BookingDates', { id: l.id, edit: true });
  const q = quote.status === 'ok' ? quote.quote : null;

  const book = async () => {
    if (!q) return;
    if (!pay) return notify('Choose a payment option');
    // Mỗi (chỗ ở + ngày + khách + hình thức) dùng một khoá riêng; gửi lại cùng yêu cầu thì dùng lại khoá => không tạo đơn trùng
    const sig = [l.id, startISO, endISO, adults, children, pay].join('|');
    if (attempt.current.sig !== sig) attempt.current = { sig, key: makeIdempotencyKey() };

    setSubmitting(true);
    try {
      const { booking } = await bookingService.create({
        listingId: l.id, checkIn: startISO, checkOut: endISO, adults, children,
        paymentMethod: pay, idempotencyKey: attempt.current.key,
      });
      upsertBooking(booking);
      navigation.replace('Success', { bookingId: booking.id });
    } catch (e: any) {
      if (e?.status === 401) {
        notify('Session expired', 'Please sign in again.');
        await signOut();
        navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
      } else if (e?.code === 'DATES_UNAVAILABLE') {
        // Có thể đơn trước đó đã tạo thành công nhưng app không nhận được phản hồi -> kiểm tra lại
        const mine = await bookingService.list().then((r) => r.bookings.find((b) => b.status === 'confirmed' && b.listing.id === l.id && b.checkIn === startISO && b.checkOut === endISO)).catch(() => undefined);
        if (mine) { upsertBooking(mine); navigation.replace('Success', { bookingId: mine.id }); return; }
        notify('Dates no longer available', e.message);
        setReload((n) => n + 1);
      } else {
        notify('Booking failed', e?.message ?? 'Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const P = ({ k, t, d }: { k: PaymentMethod; t: string; d: string }) => (
    <Pressable onPress={() => setPay(k)} style={[S.between, { marginBottom: 16 }]}>
      <View style={{ flex: 1, paddingRight: 16 }}><Text style={{ fontWeight: '700' }}>{t}</Text><Text style={S.muted}>{d}</Text></View>
      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: pay === k ? c.p : c.m, alignItems: 'center', justifyContent: 'center' }}>{pay === k && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.p }} />}</View>
    </Pressable>
  );
  const Line = ({ a, b }: { a: string; b: string }) => <View style={[S.between, { marginVertical: 6 }]}><Text style={{ fontSize: 16 }}>{a}</Text><Text style={{ fontWeight: '700', fontSize: 16 }}>{b}</Text></View>;

  return (
    <Screen><Header title="Confirm and pay" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={[S.between, S.box]}>
          <View style={{ flex: 1, paddingRight: 8 }}><Text style={{ fontSize: 22, fontWeight: '700' }}>${l.price}<Text style={{ fontSize: 14, fontWeight: '400' }}>/night</Text></Text><Text style={{ marginVertical: 6 }}>{l.title}</Text><Text><Ionicons name="star" color={c.star} /> {l.rating.toFixed(1)} ({l.reviews})</Text></View>
          <Photo uri={l.images[0]} style={{ width: 130, height: 90, borderRadius: 8 }} />
        </View>

        <Text style={[S.h1, { marginTop: 28, marginBottom: 12 }]}>Your trip</Text>
        <View style={[S.between, { marginBottom: 14 }]}>
          <View><Text style={{ fontWeight: '700' }}>Dates</Text><Text style={{ marginTop: 4, color: hasDates ? c.t : '#B3323D' }}>{hasDates ? `${fmtISO(startISO)} - ${fmtISO(endISO)}` : 'Select your dates'}</Text></View>
          <Pressable onPress={editTrip} hitSlop={10}><Ionicons name="create-outline" size={22} /></Pressable>
        </View>
        <View style={S.between}>
          <View><Text style={{ fontWeight: '700' }}>Guests</Text><Text style={{ marginTop: 4, color: adults >= 1 ? c.t : '#B3323D' }}>{adults >= 1 ? `${guests} guest${guests > 1 ? 's' : ''}` : 'At least 1 adult is required'}</Text></View>
          <Pressable onPress={editTrip} hitSlop={10}><Ionicons name="create-outline" size={22} /></Pressable>
        </View>

        {!user && <View style={[S.box, { marginTop: 20 }]}><Text>Please sign in to book this place.</Text><Btn title="Sign in" onPress={() => navigation.navigate('Auth')} style={{ marginTop: 10 }} /></View>}
        {user && !ready && <Btn title={hasDates ? 'Set guests' : 'Select dates'} onPress={editTrip} style={{ marginTop: 20 }} />}

        {quote.status === 'loading' && <View style={[S.row, { gap: 8, marginTop: 20 }]}><ActivityIndicator color={c.p} /><Text style={S.muted}>Checking availability and price…</Text></View>}
        {quote.status === 'error' && (
          <View style={[S.box, { marginTop: 20, borderColor: '#F3B6BB' }]}>
            <Text style={{ color: '#B3323D' }}>{quote.message}</Text>
            <View style={[S.row, { gap: 10, marginTop: 10 }]}>
              <Btn title="Change dates" outline onPress={editTrip} style={{ flex: 1 }} />
              {quote.code !== 'DATES_UNAVAILABLE' && quote.code !== 'VALIDATION' && <Btn title="Retry" outline onPress={() => setReload((n) => n + 1)} style={{ flex: 1 }} />}
            </View>
          </View>
        )}

        {q && (
          <>
            <View style={{ height: 1, backgroundColor: c.soft, marginVertical: 24 }} />
            <Text style={[S.h1, { marginBottom: 12 }]}>Payment options</Text>
            <P k="full" t="Pay in full" d={`Pay ${money(q.options.full.payNow)} now to finalize your booking.`} />
            <P k="part" t="Pay a part now" d={`Pay ${money(q.options.part.payNow)} now and the remaining ${money(q.options.part.balanceDue)} later, before check-in.`} />
            <View style={{ height: 1, backgroundColor: c.soft, marginVertical: 16 }} />
            <Text style={[S.h1, { marginBottom: 8 }]}>Price details</Text>
            <Line a={`${money(q.price.nightly)} x ${q.price.nights} night${q.price.nights > 1 ? 's' : ''}`} b={money(q.price.subtotal)} />
            {q.price.fees.map((f) => <Line key={f.label} a={f.label} b={money(f.amount)} />)}
            <View style={{ height: 1, backgroundColor: c.soft, marginVertical: 8 }} />
            <Line a="Total (USD)" b={money(q.price.total)} />
            <Text style={[S.muted, { marginTop: 14 }]}>Free cancellation up to 7 days before check-in (full refund). 50% refund 2–6 days before. No refund the day before; no cancellation from the check-in date.</Text>
            <Text style={[S.muted, { marginTop: 8, fontSize: 12 }]}>Demo payment: no real card is charged in this version.</Text>
          </>
        )}
      </ScrollView>
      <View style={{ padding: 16, borderTopWidth: 1, borderColor: c.soft }}>
        <Btn title={submitting ? 'Booking…' : pay && q ? `Book now · pay ${money(q.options[pay].payNow)}` : 'Book now'} onPress={book} disabled={!q || submitting || !user} />
      </View>
    </Screen>
  );
}
