import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, Header, Photo } from '@/components';
import { c, S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { bookingService } from '@/services/bookingService';
import { fmtDateTime, fmtISO } from '@/utils/date';
import { money } from '@/utils/pricing';
import { confirmDialog, notify } from '@/utils/dialog';
import { StatusBadge } from '../components/StatusBadge';
import { Divider, Row } from '../components/Row';
import { methodLabel, paymentSummary, receiptText } from '../utils';

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <View style={[S.box, { marginTop: 16, padding: 16 }]}>
    <Text style={[S.h2, { marginBottom: 8 }]}>{title}</Text>
    {children}
  </View>
);

export function BookingDetailScreen({ route, navigation }: any) {
  const { id } = route.params as { id: string };
  const { bookings, upsertBooking, signOut } = useApp();
  const b = bookings.find((x) => x.id === id);
  const [loading, setLoading] = useState(!b);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'cancel' | 'pay' | null>(null);

  // Luôn lấy bản mới nhất từ server (trạng thái có thể đổi theo ngày: sắp tới -> đang ở -> đã qua)
  useEffect(() => {
    let active = true;
    bookingService.get(id)
      .then(({ booking }) => { if (active) { upsertBooking(booking); setError(null); } })
      .catch((e: any) => { if (active) setError(e?.message ?? 'Unable to load this booking.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const onAuthError = async (e: any) => {
    if (e?.status !== 401) return false;
    notify('Session expired', 'Please sign in again.');
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    return true;
  };

  if (!b) {
    return (
      <Screen><Header title="Booking details" />
        <View style={{ alignItems: 'center', padding: 24 }}>
          {loading ? <ActivityIndicator color={c.p} /> : <Text style={[S.muted, { textAlign: 'center' }]}>{error ?? 'Booking not found.'}</Text>}
        </View>
      </Screen>
    );
  }

  const pay = paymentSummary(b);
  const canPayBalance = b.status === 'confirmed' && b.stage !== 'completed' && b.payment.status === 'partial' && b.payment.balanceDue > 0;

  const cancel = async () => {
    const { refundPercent, refundAmount } = b.cancellation;
    const msg = refundAmount > 0
      ? `You will be refunded ${money(refundAmount)} (${refundPercent}% of what you paid). This cannot be undone.`
      : 'Cancelling now is not eligible for a refund. This cannot be undone.';
    if (!(await confirmDialog('Cancel this booking?', msg, 'Cancel booking', 'Keep booking', true))) return;
    setBusy('cancel');
    try {
      const { booking } = await bookingService.cancel(b.id);
      upsertBooking(booking);
      notify('Booking cancelled', booking.payment.refundAmount > 0 ? `${money(booking.payment.refundAmount)} will be refunded.` : 'No refund applies to this cancellation.');
    } catch (e: any) {
      if (!(await onAuthError(e))) notify('Could not cancel', e?.message ?? 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const payBalance = async () => {
    if (!(await confirmDialog('Pay remaining balance', `Pay ${money(b.payment.balanceDue)} now? (Demo payment, no real charge.)`, 'Pay now'))) return;
    setBusy('pay');
    try {
      const { booking } = await bookingService.payBalance(b.id);
      upsertBooking(booking);
      notify('Payment received', 'Your booking is now paid in full.');
    } catch (e: any) {
      if (!(await onAuthError(e))) notify('Payment failed', e?.message ?? 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const share = async () => { try { await Share.share({ message: receiptText(b) }); } catch { notify('Could not share the receipt'); } };

  return (
    <Screen><Header title="Booking details" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
        <View style={[S.between, { marginBottom: 4 }]}>
          <StatusBadge stage={b.stage} />
          <Text style={{ fontWeight: '700' }}>{b.ref}</Text>
        </View>

        <Pressable onPress={() => navigation.navigate('Detail', { id: b.listing.id })} style={[S.row, S.box, { gap: 12, marginTop: 12 }]}>
          <Photo uri={b.listing.image} style={{ width: 80, height: 80, borderRadius: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700' }} numberOfLines={2}>{b.listing.title}</Text>
            <Text style={S.muted}>{b.listing.city}, {b.listing.country}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={c.m} />
        </Pressable>

        <Card title="Your stay">
          <Row a="Check-in" b={fmtISO(b.checkIn)} sub={`From ${b.listing.checkInTime}`} />
          <Row a="Check-out" b={fmtISO(b.checkOut)} sub={`Until ${b.listing.checkOutTime}`} />
          <Row a="Length" b={`${b.nights} night${b.nights > 1 ? 's' : ''}`} />
          <Row a="Guests" b={`${b.adults} adult${b.adults > 1 ? 's' : ''}${b.children ? `, ${b.children} child${b.children > 1 ? 'ren' : ''}` : ''}`} />
        </Card>

        <Card title="Price details">
          <Row a={`${money(b.price.nightly)} x ${b.price.nights} night${b.price.nights > 1 ? 's' : ''}`} b={money(b.price.subtotal)} />
          {b.price.fees.map((f) => <Row key={f.label} a={f.label} b={money(f.amount)} />)}
          <Divider />
          <Row a="Total (USD)" b={money(b.price.total)} bold />
        </Card>

        <Card title="Payment">
          <Row a="Method" b={methodLabel(b)} />
          <Row a="Status" b={pay.label} color={pay.color} />
          <Row a="Paid" b={money(b.payment.amountPaid)} />
          {b.stage !== 'cancelled' && b.payment.balanceDue > 0 && <Row a="Remaining" b={money(b.payment.balanceDue)} color="#C27A00" />}
          {b.status === 'cancelled' && <Row a="Refund" b={money(b.payment.refundAmount)} />}
          <Row a="Booked on" b={fmtDateTime(b.createdAt)} />
          {!!b.payment.balancePaidAt && <Row a="Balance paid on" b={fmtDateTime(b.payment.balancePaidAt)} />}
          {!!b.cancelledAt && <Row a="Cancelled on" b={fmtDateTime(b.cancelledAt)} />}
          <Text style={{ color: c.m, fontSize: 12, marginTop: 8 }}>Demo payment: no real card was charged.</Text>
          {canPayBalance && <Btn title={busy === 'pay' ? 'Processing…' : `Pay remaining ${money(b.payment.balanceDue)}`} onPress={payBalance} disabled={busy !== null} style={{ marginTop: 12 }} />}
        </Card>

        {b.status === 'confirmed' && b.stage !== 'completed' && (
          <Card title="Cancellation policy">
            <Text style={S.muted}>• 7+ days before check-in: full refund{'\n'}• 2–6 days before: 50% refund{'\n'}• 1 day before: no refund{'\n'}• From the check-in date: cannot be cancelled</Text>
            {b.cancellation.allowed
              ? <Text style={{ marginTop: 10, fontWeight: '600' }}>If you cancel today: {b.cancellation.refundAmount > 0 ? `${money(b.cancellation.refundAmount)} refund (${b.cancellation.refundPercent}%)` : 'no refund'}.</Text>
              : <Text style={{ marginTop: 10, color: c.m }}>{b.cancellation.reason}</Text>}
          </Card>
        )}

        <Btn outline icon="share-outline" title="Share receipt" onPress={share} style={{ marginTop: 16 }} />
        {b.cancellation.allowed && <Btn outline color="#D94A55" title={busy === 'cancel' ? 'Cancelling…' : 'Cancel booking'} onPress={cancel} disabled={busy !== null} style={{ marginTop: 12 }} />}
        {!!error && <Text style={{ color: '#B3323D', marginTop: 12, textAlign: 'center' }}>{error}</Text>}
      </ScrollView>
    </Screen>
  );
}
