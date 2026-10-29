import { useEffect } from 'react';
import { View, Text, ScrollView, Share, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn } from '@/components';
import { c } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { bookingService } from '@/services/bookingService';
import { fmtDateTime, fmtISO } from '@/utils/date';
import { money } from '@/utils/pricing';
import { notify } from '@/utils/dialog';
import { Row, Divider } from '@/features/bookings/components/Row';
import { methodLabel, receiptText } from '@/features/bookings/utils';

export function SuccessScreen({ route, navigation }: any) {
  const { bookingId } = route.params as { bookingId: string };
  const { bookings, upsertBooking } = useApp();
  const b = bookings.find((x) => x.id === bookingId);

  // Phòng khi store chưa có (ví dụ vừa tải lại app): lấy từ server
  useEffect(() => {
    if (b) return;
    bookingService.get(bookingId).then(({ booking }) => upsertBooking(booking)).catch(() => {});
  }, [bookingId, !!b]);

  const share = async () => {
    if (!b) return;
    try { await Share.share({ message: receiptText(b) }); } catch { notify('Could not share the receipt'); }
  };

  if (!b) return <Screen style={{ backgroundColor: '#F7F8FA', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={c.p} /></Screen>;

  const viewBooking = () => navigation.reset({ index: 1, routes: [{ name: 'Main', params: { screen: 'Bookings' } }, { name: 'BookingDetail', params: { id: b.id } }] });

  return (
    <Screen style={{ backgroundColor: '#F7F8FA' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, justifyContent: 'center' }}>
        <View style={{ alignSelf: 'center', width: 110, height: 110, borderRadius: 55, backgroundColor: '#4ADE80', alignItems: 'center', justifyContent: 'center', marginBottom: -50, zIndex: 1 }}><Ionicons name="checkmark" size={64} color="#fff" /></View>
        <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 20, paddingTop: 70 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 4 }}>Booking confirmed!</Text>
          <Text style={{ textAlign: 'center', color: c.m, marginBottom: 16 }}>{b.listing.title}</Text>
          <Row a="Ref number" b={b.ref} bold />
          <Row a="Booked on" b={fmtDateTime(b.createdAt)} />
          <Row a="Check-in" b={fmtISO(b.checkIn)} sub={`From ${b.listing.checkInTime}`} />
          <Row a="Check-out" b={fmtISO(b.checkOut)} sub={`Until ${b.listing.checkOutTime}`} />
          <Row a="Guests" b={`${b.guests} · ${b.nights} night${b.nights > 1 ? 's' : ''}`} />
          <Row a="Payment" b={methodLabel(b)} />
          <Divider />
          <Row a="Paid now" b={money(b.payment.amountPaid)} bold />
          {b.payment.balanceDue > 0 && <Row a="Remaining" b={money(b.payment.balanceDue)} color="#C27A00" sub="Pay before check-in from your booking details" />}
          <Text style={{ color: c.m, fontSize: 12, marginTop: 12 }}>Demo payment: no real card was charged.</Text>
          <Btn outline icon="share-outline" title="Share receipt" onPress={share} style={{ marginTop: 16 }} />
        </View>
      </ScrollView>
      <View style={{ padding: 16 }}><Btn title="View booking" onPress={viewBooking} /></View>
    </Screen>
  );
}
