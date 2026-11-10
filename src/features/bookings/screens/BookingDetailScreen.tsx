import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, Header, Photo } from '@/components';
import { S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { bookingService } from '@/services/bookingService';
import { fmtDateTime, fmtISO } from '@/utils/date';
import { money } from '@/utils/pricing';
import { confirmDialog, notify } from '@/utils/dialog';
import { StatusBadge } from '../components/StatusBadge';
import { Divider, Row } from '../components/Row';
import { methodLabel, paymentSummary, receiptText } from '../utils';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export function BookingDetailScreen({ route, navigation }: any) {
  const { id } = route.params as { id: string };
  const { bookings, upsertBooking, signOut, listings, user, refreshListings } = useApp();
  const { colors } = useTheme();
  const { t, isVietnamese } = useLanguage();

  useFocusEffect(
    useCallback(() => {
      void refreshListings();
    }, [refreshListings])
  );

  const b = bookings.find((x) => x.id === id);
  const [loading, setLoading] = useState(!b);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'cancel' | 'pay' | null>(null);

  // Luôn lấy bản mới nhất từ server (trạng thái có thể đổi theo ngày: sắp tới -> đang ở -> đã qua)
  useEffect(() => {
    let active = true;
    bookingService
      .get(id)
      .then(({ booking }) => {
        if (active) {
          upsertBooking(booking);
          setError(null);
        }
      })
      .catch((e: any) => {
        if (active) setError(e?.message ?? (isVietnamese ? 'Không tải được đặt phòng này.' : 'Unable to load this booking.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, isVietnamese]);

  const onAuthError = async (e: any) => {
    if (e?.status !== 401) return false;
    notify(isVietnamese ? 'Hết phiên đăng nhập' : 'Session expired', isVietnamese ? 'Vui lòng đăng nhập lại.' : 'Please sign in again.');
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    return true;
  };

  const Card = ({ title, children }: { title: string; children: ReactNode }) => (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 14,
        marginTop: 16,
        padding: 16,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 10 }}>
        {title}
      </Text>
      {children}
    </View>
  );

  if (!b) {
    return (
      <Screen>
        <Header title={t.bookingFlow.bookingDetails} />
        <View style={{ alignItems: 'center', padding: 24 }}>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={{ color: colors.muted, textAlign: 'center' }}>
              {error ?? t.bookingFlow.bookingNotFound}
            </Text>
          )}
        </View>
      </Screen>
    );
  }

  const pay = paymentSummary(b, isVietnamese);
  const isCompleted = b.stage === 'completed' || (b.status === 'confirmed' && new Date(b.checkOut) <= new Date());
  const currentListing = listings?.find((l) => l.id === b.listing.id);
  const userReview = currentListing?.reviewItems?.find(
    (r) => r.name?.trim().toLowerCase() === user?.name?.trim().toLowerCase()
  );

  const canPayBalance =
    b.status === 'confirmed' &&
    !isCompleted &&
    b.payment.status === 'partial' &&
    b.payment.balanceDue > 0;

  const cancel = async () => {
    const { refundPercent, refundAmount } = b.cancellation;
    const msg =
      refundAmount > 0
        ? isVietnamese
          ? `Bạn sẽ được hoàn lại ${money(refundAmount)} (${refundPercent}% số tiền đã thanh toán). Thao tác này không thể hoàn tác.`
          : `You will be refunded ${money(refundAmount)} (${refundPercent}% of what you paid). This cannot be undone.`
        : isVietnamese
        ? 'Hủy lúc này không được hoàn tiền. Thao tác này không thể hoàn tác.'
        : 'Cancelling now is not eligible for a refund. This cannot be undone.';

    if (
      !(await confirmDialog(
        t.bookingFlow.cancelBookingTitle,
        msg,
        t.bookingFlow.cancelBookingBtn,
        t.bookingFlow.keepBooking,
        true
      ))
    )
      return;

    setBusy('cancel');
    try {
      const { booking } = await bookingService.cancel(b.id);
      upsertBooking(booking);
      notify(
        isVietnamese ? 'Đã hủy đặt phòng' : 'Booking cancelled',
        booking.payment.refundAmount > 0
          ? isVietnamese
            ? `${money(booking.payment.refundAmount)} sẽ được hoàn trả.`
            : `${money(booking.payment.refundAmount)} will be refunded.`
          : isVietnamese
          ? 'Không áp dụng hoàn tiền cho lần hủy này.'
          : 'No refund applies to this cancellation.'
      );
    } catch (e: any) {
      if (!(await onAuthError(e)))
        notify(
          isVietnamese ? 'Không thể hủy' : 'Could not cancel',
          e?.message ?? (isVietnamese ? 'Vui lòng thử lại.' : 'Please try again.')
        );
    } finally {
      setBusy(null);
    }
  };

  const payBalance = async () => {
    if (
      !(await confirmDialog(
        t.bookingFlow.payBalanceTitle,
        isVietnamese
          ? `Thanh toán ${money(b.payment.balanceDue)} ngay bây giờ?`
          : `Pay ${money(b.payment.balanceDue)} now?`,
        t.bookingFlow.payNow
      ))
    )
      return;

    setBusy('pay');
    try {
      const { booking } = await bookingService.payBalance(b.id);
      upsertBooking(booking);
      notify(t.bookingFlow.paymentReceived, t.bookingFlow.paymentReceivedDesc);
    } catch (e: any) {
      if (!(await onAuthError(e)))
        notify(
          isVietnamese ? 'Thanh toán thất bại' : 'Payment failed',
          e?.message ?? (isVietnamese ? 'Vui lòng thử lại.' : 'Please try again.')
        );
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    try {
      await Share.share({ message: receiptText(b) });
    } catch {
      notify(isVietnamese ? 'Không thể chia sẻ biên lai' : 'Could not share the receipt');
    }
  };

  return (
    <Screen>
      <Header title={t.bookingFlow.bookingDetails} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 10 }}>
        {/* Top summary row */}
        <View style={[S.between, { marginBottom: 6 }]}>
          <StatusBadge stage={b.stage} />
          <Text style={{ fontWeight: '700', color: colors.text }}>{b.ref}</Text>
        </View>

        {/* Listing preview link */}
        <Pressable
          onPress={() => navigation.navigate('Detail', { id: b.listing.id })}
          style={[
            S.row,
            {
              gap: 12,
              marginTop: 10,
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 12,
            },
          ]}
        >
          <Photo uri={b.listing.image} style={{ width: 80, height: 80, borderRadius: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }} numberOfLines={2}>
              {b.listing.title}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
              {b.listing.city}, {b.listing.country}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>

        {/* Section 1: Stay Details */}
        <Card title={isVietnamese ? 'Kỳ nghỉ của bạn' : 'Your stay'}>
          <Row
            a={isVietnamese ? 'Nhận phòng' : 'Check-in'}
            b={fmtISO(b.checkIn)}
            sub={`${isVietnamese ? 'Từ' : 'From'} ${b.listing.checkInTime}`}
          />
          <Row
            a={isVietnamese ? 'Trả phòng' : 'Check-out'}
            b={fmtISO(b.checkOut)}
            sub={`${isVietnamese ? 'Trước' : 'Until'} ${b.listing.checkOutTime}`}
          />
          <Row
            a={isVietnamese ? 'Thời gian' : 'Length'}
            b={`${b.nights} ${t.bookings.nights}`}
          />
          <Row
            a={isVietnamese ? 'Số khách' : 'Guests'}
            b={`${b.adults} ${isVietnamese ? 'người lớn' : b.adults > 1 ? 'adults' : 'adult'}${
              b.children
                ? `, ${b.children} ${isVietnamese ? 'trẻ em' : b.children > 1 ? 'children' : 'child'}`
                : ''
            }`}
          />
        </Card>

        {/* Section 2: Price Details */}
        <Card title={t.bookingFlow.priceDetails}>
          <Row
            a={`${money(b.price.nightly)} x ${b.nights} ${t.bookings.nights}`}
            b={money(b.price.subtotal)}
          />
          {b.price.fees.map((f) => (
            <Row key={f.label} a={f.label} b={money(f.amount)} />
          ))}
          <Divider />
          <Row a={t.bookingFlow.total} b={money(b.price.total)} bold />
        </Card>

        {/* Section 3: Payment Details */}
        <Card title={isVietnamese ? 'Thanh toán' : 'Payment'}>
          <Row a={isVietnamese ? 'Hình thức' : 'Method'} b={methodLabel(b, isVietnamese)} />
          <Row a={isVietnamese ? 'Trạng thái' : 'Status'} b={pay.label} color={pay.color} />
          <Row a={isVietnamese ? 'Đã trả' : 'Paid'} b={money(b.payment.amountPaid)} />
          {b.stage !== 'cancelled' && b.payment.balanceDue > 0 && (
            <Row
              a={isVietnamese ? 'Còn lại' : 'Remaining'}
              b={money(b.payment.balanceDue)}
              color="#C27A00"
            />
          )}
          {b.status === 'cancelled' && (
            <Row a={isVietnamese ? 'Hoàn tiền' : 'Refund'} b={money(b.payment.refundAmount)} />
          )}
          <Row a={isVietnamese ? 'Ngày đặt' : 'Booked on'} b={fmtDateTime(b.createdAt)} />
          {!!b.payment.balancePaidAt && (
            <Row
              a={isVietnamese ? 'Ngày tất toán' : 'Balance paid on'}
              b={fmtDateTime(b.payment.balancePaidAt)}
            />
          )}
          {!!b.cancelledAt && (
            <Row a={isVietnamese ? 'Ngày hủy' : 'Cancelled on'} b={fmtDateTime(b.cancelledAt)} />
          )}
          {canPayBalance && (
            <Btn
              title={
                busy === 'pay'
                  ? isVietnamese
                    ? 'Đang xử lý…'
                    : 'Processing…'
                  : `${isVietnamese ? 'Thanh toán nốt' : 'Pay remaining'} ${money(b.payment.balanceDue)}`
              }
              onPress={payBalance}
              disabled={busy !== null}
              style={{ marginTop: 12 }}
            />
          )}
        </Card>

        {/* Section 4: Cancellation Policy */}
        {b.status === 'confirmed' && !isCompleted && (
          <Card title={isVietnamese ? 'Chính sách hủy phòng' : 'Cancellation policy'}>
            <Text style={{ color: colors.muted, lineHeight: 20 }}>
              {isVietnamese
                ? `• Trước 7 ngày: hoàn tiền 100%\n• Trước 2–6 ngày: hoàn tiền 50%\n• Trước 1 ngày: không hoàn tiền\n• Từ ngày nhận phòng: không thể hủy`
                : `• 7+ days before check-in: full refund\n• 2–6 days before: 50% refund\n• 1 day before: no refund\n• From the check-in date: cannot be cancelled`}
            </Text>
            {b.cancellation.allowed ? (
              <Text style={{ marginTop: 10, fontWeight: '600', color: colors.text }}>
                {isVietnamese ? 'Nếu bạn hủy hôm nay: ' : 'If you cancel today: '}
                {b.cancellation.refundAmount > 0
                  ? isVietnamese
                    ? `hoàn lại ${money(b.cancellation.refundAmount)} (${b.cancellation.refundPercent}%)`
                    : `${money(b.cancellation.refundAmount)} refund (${b.cancellation.refundPercent}%)`
                  : isVietnamese
                  ? 'không hoàn tiền'
                  : 'no refund'}
                .
              </Text>
            ) : (
              <Text style={{ marginTop: 10, color: colors.muted }}>{b.cancellation.reason}</Text>
            )}
          </Card>
        )}

        {/* Section 5: Trip Review for Completed Stays */}
        {isCompleted && (
          <Card title={isVietnamese ? 'Đánh giá chuyến đi' : 'Trip review'}>
            {userReview ? (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>
                    {isVietnamese ? 'Đánh giá của bạn:' : 'Your review:'}
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= userReview.stars ? 'star' : 'star-outline'}
                        size={16}
                        color={s <= userReview.stars ? (colors.star || '#F5B335') : colors.border}
                      />
                    ))}
                  </View>
                </View>
                <Text style={{ color: colors.text, lineHeight: 20, fontStyle: 'italic', marginBottom: 14 }}>
                  "{userReview.text}"
                </Text>
                <Btn
                  outline
                  icon="chatbubbles-outline"
                  title={isVietnamese ? 'Xem tất cả đánh giá' : 'View all reviews'}
                  onPress={() => navigation.navigate('Reviews', { id: b.listing.id })}
                />
              </View>
            ) : (
              <View>
                <Text style={{ color: colors.muted, lineHeight: 20, marginBottom: 14 }}>
                  {isVietnamese
                    ? 'Chuyến đi đã hoàn thành! Hãy chia sẻ trải nghiệm lưu trú của bạn để giúp đỡ các du khách khác.'
                    : 'Your trip is complete! Share your stay experience to help future guests.'}
                </Text>
                <View style={{ gap: 10 }}>
                  <Btn
                    icon="star"
                    title={isVietnamese ? 'Viết đánh giá' : 'Write a Review'}
                    onPress={() =>
                      navigation.navigate('WriteReview', {
                        listingId: b.listing.id,
                        listingTitle: b.listing.title,
                        listingImage: b.listing.image,
                      })
                    }
                  />
                  <Btn
                    outline
                    icon="chatbubbles-outline"
                    title={isVietnamese ? 'Xem đánh giá của chỗ ở' : 'View property reviews'}
                    onPress={() => navigation.navigate('Reviews', { id: b.listing.id })}
                  />
                </View>
              </View>
            )}
          </Card>
        )}

        <Btn
          outline
          icon="share-outline"
          title={t.bookingFlow.shareReceipt}
          onPress={share}
          style={{ marginTop: 16 }}
        />
        {b.cancellation.allowed && (
          <Btn
            outline
            color="#D94A55"
            title={
              busy === 'cancel'
                ? isVietnamese
                  ? 'Đang hủy…'
                  : 'Cancelling…'
                : t.bookingFlow.cancelBookingBtn
            }
            onPress={cancel}
            disabled={busy !== null}
            style={{ marginTop: 12 }}
          />
        )}
        {!!error && (
          <Text style={{ color: '#B3323D', marginTop: 12, textAlign: 'center' }}>{error}</Text>
        )}
      </ScrollView>
    </Screen>
  );
}
