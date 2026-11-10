import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Share, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn } from '@/components';
import { useApp } from '@/store/AppContext';
import { bookingService } from '@/services/bookingService';
import { fmtDateTime, fmtISO } from '@/utils/date';
import { money } from '@/utils/pricing';
import { notify } from '@/utils/dialog';
import { downloadReceiptPdf } from '@/utils/pdfReceipt';
import { Row, Divider } from '@/features/bookings/components/Row';
import { methodLabel, receiptText } from '@/features/bookings/utils';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export function SuccessScreen({ route, navigation }: any) {
  const { bookingId } = route.params as { bookingId: string };
  const { bookings, upsertBooking, user } = useApp();
  const { colors } = useTheme();
  const { isVietnamese } = useLanguage();
  const b = bookings.find((x) => x.id === bookingId);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Phòng khi store chưa có (ví dụ vừa tải lại app): lấy từ server
  useEffect(() => {
    if (b) return;
    bookingService.get(bookingId).then(({ booking }) => upsertBooking(booking)).catch(() => {});
  }, [bookingId, !!b]);

  const share = async () => {
    if (!b) return;
    try { await Share.share({ message: receiptText(b) }); } catch { notify(isVietnamese ? 'Không thể chia sẻ biên lai' : 'Could not share the receipt'); }
  };

  const handleDownloadPdf = async () => {
    if (!b) return;
    setDownloadingPdf(true);
    try {
      await downloadReceiptPdf(b, isVietnamese, user?.name);
    } catch (err: any) {
      notify(isVietnamese ? 'Lỗi tải PDF' : 'PDF Download Error', err?.message || 'Cannot generate PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const canReview = useMemo(() => {
    if (!b) return false;
    const checkOutDate = new Date(b.checkOut);
    const oneDayLater = new Date(checkOutDate);
    oneDayLater.setDate(oneDayLater.getDate() + 1);
    return new Date() >= oneDayLater;
  }, [b]);

  const handleWriteReview = () => {
    if (!b) return;
    navigation.navigate('WriteReview', {
      listingId: b.listing.id,
      listingTitle: b.listing.title,
      listingImage: b.listing.image,
    });
  };

  if (!b) return (
    <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.primary} />
    </Screen>
  );

  const viewBooking = () => navigation.reset({ index: 1, routes: [{ name: 'Main', params: { screen: 'Bookings' } }, { name: 'BookingDetail', params: { id: b.id } }] });

  return (
    <Screen>
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ flexGrow: 1, padding: 16, justifyContent: 'center', backgroundColor: colors.bg }}
      >
        {/* Checkmark badge */}
        <View style={{ alignSelf: 'center', width: 110, height: 110, borderRadius: 55, backgroundColor: '#4ADE80', alignItems: 'center', justifyContent: 'center', marginBottom: -50, zIndex: 1 }}>
          <Ionicons name="checkmark" size={64} color="#fff" />
        </View>

        {/* Receipt card */}
        <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 20, paddingTop: 70, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 4, color: colors.text }}>
            {isVietnamese ? 'Đặt phòng thành công!' : 'Booking confirmed!'}
          </Text>
          <Text style={{ textAlign: 'center', color: colors.muted, marginBottom: 16 }}>{b.listing.title}</Text>
          <Row a={isVietnamese ? 'Mã tham chiếu' : 'Ref number'} b={b.ref} bold />
          <Row a={isVietnamese ? 'Ngày đặt' : 'Booked on'} b={fmtDateTime(b.createdAt)} />
          <Row a={isVietnamese ? 'Nhận phòng' : 'Check-in'} b={fmtISO(b.checkIn)} sub={`${isVietnamese ? 'Từ' : 'From'} ${b.listing.checkInTime}`} />
          <Row a={isVietnamese ? 'Trả phòng' : 'Check-out'} b={fmtISO(b.checkOut)} sub={`${isVietnamese ? 'Trước' : 'Until'} ${b.listing.checkOutTime}`} />
          <Row a={isVietnamese ? 'Khách' : 'Guests'} b={`${b.guests} · ${b.nights} ${isVietnamese ? 'đêm' : `night${b.nights > 1 ? 's' : ''}`}`} />
          <Row a={isVietnamese ? 'Thanh toán' : 'Payment'} b={methodLabel(b)} />
          <Divider />
          <Row a={isVietnamese ? 'Đã thanh toán' : 'Paid now'} b={money(b.payment.amountPaid)} bold />
          {b.payment.balanceDue > 0 && (
            <Row
              a={isVietnamese ? 'Còn lại' : 'Remaining'}
              b={money(b.payment.balanceDue)}
              color={colors.star}
              sub={isVietnamese ? 'Thanh toán trước khi nhận phòng trong chi tiết đặt phòng' : 'Pay before check-in from your booking details'}
            />
          )}
          <Btn
            outline
            icon="document-text-outline"
            title={
              downloadingPdf
                ? isVietnamese
                  ? 'Đang tạo PDF…'
                  : 'Generating PDF…'
                : isVietnamese
                ? 'Tải biên lai PDF'
                : 'Get PDF receipt'
            }
            onPress={handleDownloadPdf}
            disabled={downloadingPdf}
            style={{ marginTop: 16 }}
          />
          <Btn outline icon="share-outline" title={isVietnamese ? 'Chia sẻ biên lai' : 'Share receipt'} onPress={share} style={{ marginTop: 10 }} />
        </View>
      </ScrollView>

      <View style={{ padding: 16, backgroundColor: colors.bg }}>
        <Btn title={isVietnamese ? 'Xem đặt phòng' : 'View booking'} onPress={viewBooking} />
      </View>

      {canReview && (
        <View style={{ padding: 16, backgroundColor: colors.bg }}>
          <Btn 
            title={isVietnamese ? 'Viết đánh giá' : 'Write a Review'} 
            icon="star-outline"
            onPress={handleWriteReview} 
          />
        </View>
      )}
    </Screen>
  );
}
