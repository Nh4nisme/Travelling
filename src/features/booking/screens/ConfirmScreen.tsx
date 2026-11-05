import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, Header, Photo } from '@/components';
import { S } from '@/constants/theme';
import { fmtISO, toISO } from '@/utils/date';
import { money } from '@/utils/pricing';
import { notify } from '@/utils/dialog';
import { useApp } from '@/store/AppContext';
import { ListingState, useListing } from '@/features/listing/components/shared';
import { bookingService, makeIdempotencyKey } from '@/services/bookingService';
import type { PaymentMethod, Quote } from '@/store/types';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { PaymentPinSheet } from '../components/PaymentPinSheet';

type QuoteState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; quote: Quote }
  | { status: 'error'; message: string; code?: string };

export function ConfirmScreen({ route, navigation }: any) {
  const l = useListing(route.params.id);
  const { search, user, signOut, upsertBooking, listingsLoading, listingsError, refreshListings } = useApp();
  const { colors } = useTheme();
  const { t, isVietnamese } = useLanguage();

  const [pay, setPay] = useState<PaymentMethod | null>(null);
  const [quote, setQuote] = useState<QuoteState>({ status: 'idle' });
  const [submitting, setSubmitting] = useState(false);
  const [reload, setReload] = useState(0);
  const [showPinModal, setShowPinModal] = useState(false);
  const attempt = useRef({ sig: '', key: '' });

  const { start, end, adults, children } = search;
  const hasDates = !!start && !!end && +end > +start;
  const guests = adults + children;
  const startISO = hasDates ? toISO(start!) : '';
  const endISO = hasDates ? toISO(end!) : '';
  const ready = hasDates && adults >= 1;

  // Hỏi server giá + kiểm tra còn trống mỗi khi ngày/khách thay đổi
  useEffect(() => {
    if (!l || !ready || !user) {
      setQuote({ status: 'idle' });
      return;
    }
    let active = true;
    setQuote({ status: 'loading' });
    bookingService
      .quote({ listingId: l.id, checkIn: startISO, checkOut: endISO, adults, children })
      .then(({ quote }) => {
        if (active) setQuote({ status: 'ok', quote });
      })
      .catch((e: any) => {
        if (active)
          setQuote({
            status: 'error',
            message: e?.message ?? (isVietnamese ? 'Không thể tính giá cho kỳ nghỉ này.' : 'Could not price this stay.'),
            code: e?.code,
          });
      });
    return () => {
      active = false;
    };
  }, [l?.id, ready, startISO, endISO, adults, children, reload, user?.id, isVietnamese]);

  if (!l) {
    return (
      <Screen>
        <Header title={t.bookingFlow.confirmAndPay} />
        <ListingState loading={listingsLoading} error={listingsError} onRetry={() => void refreshListings()} />
      </Screen>
    );
  }

  const editTrip = () => navigation.navigate('BookingDates', { id: l.id, edit: true });
  const q = quote.status === 'ok' ? quote.quote : null;

  const book = async () => {
    if (!q) return;
    if (!pay) return notify(t.bookingFlow.choosePaymentOption);

    if (!user?.paymentPinSet) {
      Alert.alert(
        isVietnamese ? 'Cần thiết lập mã PIN' : 'Payment PIN Required',
        isVietnamese 
          ? 'Vui lòng thiết lập mã PIN trong Cài đặt trước.'
          : 'Please set up Payment PIN in Settings first.',
        [
          { text: isVietnamese ? 'Đóng' : 'Close', style: 'cancel' },
          { 
            text: isVietnamese ? 'Đi tới Cài đặt' : 'Go to Settings',
            onPress: () => navigation.navigate('Settings')
          }
        ]
      );
      return;
    }

    setShowPinModal(true);
  };

  const P = ({ k, title, desc }: { k: PaymentMethod; title: string; desc: string }) => (
    <Pressable onPress={() => setPay(k)} style={[S.between, { marginBottom: 16 }]}>
      <View style={{ flex: 1, paddingRight: 16 }}>
        <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>{desc}</Text>
      </View>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: pay === k ? colors.primary : colors.muted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {pay === k && (
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary }} />
        )}
      </View>
    </Pressable>
  );

  const Line = ({ a, b }: { a: string; b: string }) => (
    <View style={[S.between, { marginVertical: 6 }]}>
      <Text style={{ fontSize: 15, color: colors.text }}>{a}</Text>
      <Text style={{ fontWeight: '700', fontSize: 15, color: colors.text }}>{b}</Text>
    </View>
  );

  return (
    <Screen>
      <Header title={t.bookingFlow.confirmAndPay} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Listing preview card */}
        <View
          style={[
            S.between,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 14,
            },
          ]}
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
              ${l.price}
              <Text style={{ fontSize: 14, fontWeight: '400', color: colors.muted }}>
                /{t.listing.night}
              </Text>
            </Text>
            <Text style={{ marginVertical: 6, fontWeight: '600', color: colors.text }} numberOfLines={2}>
              {l.title}
            </Text>
            <Text style={{ color: colors.text }}>
              <Ionicons name="star" color={colors.star} /> {l.rating.toFixed(1)} ({l.reviews})
            </Text>
          </View>
          <Photo uri={l.images[0]} style={{ width: 120, height: 85, borderRadius: 10 }} />
        </View>

        {/* Section: Your trip */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 24, marginBottom: 12 }}>
          {t.bookingFlow.yourTrip}
        </Text>
        <View style={[S.between, { marginBottom: 14 }]}>
          <View>
            <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>{t.bookingFlow.dates}</Text>
            <Text style={{ marginTop: 4, fontSize: 14, color: hasDates ? colors.muted : colors.danger }}>
              {hasDates ? `${fmtISO(startISO)} - ${fmtISO(endISO)}` : t.bookingFlow.selectDates}
            </Text>
          </View>
          <Pressable onPress={editTrip} hitSlop={10}>
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>

        <View style={S.between}>
          <View>
            <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>{t.bookingFlow.guests}</Text>
            <Text style={{ marginTop: 4, fontSize: 14, color: adults >= 1 ? colors.muted : colors.danger }}>
              {adults >= 1
                ? `${guests} ${guests > 1 ? t.search.guests : t.search.guest}`
                : t.bookingFlow.requireAdult}
            </Text>
          </View>
          <Pressable onPress={editTrip} hitSlop={10}>
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>

        {!user && (
          <View
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 16,
              marginTop: 20,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 15 }}>{t.bookingFlow.signInPrompt}</Text>
            <Btn
              title={t.bookingFlow.signIn}
              onPress={() => navigation.navigate('Auth')}
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        {user && !ready && (
          <Btn
            title={hasDates ? t.bookingFlow.setGuests : t.bookingFlow.selectDates}
            onPress={editTrip}
            style={{ marginTop: 20 }}
          />
        )}

        {quote.status === 'loading' && (
          <View style={[S.row, { gap: 8, marginTop: 20 }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.muted }}>{t.bookingFlow.checkingPrice}</Text>
          </View>
        )}

        {quote.status === 'error' && (
          <View
            style={{
              backgroundColor: colors.card,
              borderColor: colors.danger,
              borderWidth: 1,
              borderRadius: 12,
              padding: 14,
              marginTop: 20,
            }}
          >
            <Text style={{ color: colors.danger }}>{quote.message}</Text>
            <View style={[S.row, { gap: 10, marginTop: 10 }]}>
              <Btn title={t.bookingFlow.changeDates} outline onPress={editTrip} style={{ flex: 1 }} />
              {quote.code !== 'DATES_UNAVAILABLE' && quote.code !== 'VALIDATION' && (
                <Btn
                  title={t.bookings.tryAgain}
                  outline
                  onPress={() => setReload((n) => n + 1)}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </View>
        )}

        {q && (
          <>
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 20 }} />

            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 14 }}>
              {t.bookingFlow.paymentOptions}
            </Text>
            <P
              k="full"
              title={t.bookingFlow.payInFull}
              desc={
                isVietnamese
                  ? `Thanh toán ${money(q.options.full.payNow)} ngay bây giờ để hoàn tất đơn đặt phòng.`
                  : `Pay ${money(q.options.full.payNow)} now to finalize your booking.`
              }
            />
            <P
              k="part"
              title={t.bookingFlow.payPart}
              desc={
                isVietnamese
                  ? `Đặt cọc ${money(q.options.part.payNow)} ngay, còn lại ${money(q.options.part.balanceDue)} thanh toán trước khi nhận phòng.`
                  : `Pay ${money(q.options.part.payNow)} now and the remaining ${money(q.options.part.balanceDue)} later, before check-in.`
              }
            />

            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />

            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 10 }}>
              {t.bookingFlow.priceDetails}
            </Text>
            <Line
              a={`${money(q.price.nightly)} x ${q.price.nights} ${t.bookings.nights}`}
              b={money(q.price.subtotal)}
            />
            {q.price.fees.map((f) => (
              <Line key={f.label} a={f.label} b={money(f.amount)} />
            ))}
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
            <Line a={t.bookingFlow.total} b={money(q.price.total)} />

            <Text style={{ color: colors.muted, marginTop: 14, lineHeight: 18, fontSize: 13 }}>
              {t.bookingFlow.cancellationPolicy}
            </Text>
          </>
        )}
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
        <Btn
          title={
            submitting
              ? t.bookingFlow.booking
              : pay && q
              ? `${t.bookingFlow.bookNowPay} ${money(q.options[pay].payNow)}`
              : t.bookingFlow.bookNow
          }
          onPress={book}
          disabled={!q || submitting || !user}
        />
      </View>

      <PaymentPinSheet
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={async (pin) => {
          if (!q) return;
          
          const sig = [l.id, startISO, endISO, adults, children, pay].join('|');
          if (attempt.current.sig !== sig) attempt.current = { sig, key: makeIdempotencyKey() };

          setSubmitting(true);
          try {
            const { booking } = await bookingService.create({
              listingId: l.id,
              checkIn: startISO,
              checkOut: endISO,
              adults,
              children,
              paymentMethod: pay!,
              paymentPin: pin,
              idempotencyKey: attempt.current.key,
            });
            upsertBooking(booking);
            navigation.replace('Success', { bookingId: booking.id });
          } catch (e: any) {
            if (e?.status === 401) {
              notify(isVietnamese ? 'Hết phiên đăng nhập' : 'Session expired', isVietnamese ? 'Vui lòng đăng nhập lại.' : 'Please sign in again.');
              await signOut();
              navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
            } else if (e?.code === 'PIN_INCORRECT') {
              notify(isVietnamese ? 'Mã PIN không đúng' : 'Incorrect Payment PIN');
            } else if (e?.code === 'DATES_UNAVAILABLE') {
              const mine = await bookingService
                .list()
                .then((r) =>
                  r.bookings.find(
                    (b) =>
                      b.status === 'confirmed' &&
                      b.listing.id === l.id &&
                      b.checkIn === startISO &&
                      b.checkOut === endISO
                  )
                )
                .catch(() => undefined);
              if (mine) {
                upsertBooking(mine);
                navigation.replace('Success', { bookingId: mine.id });
                return;
              }
              notify(isVietnamese ? 'Ngày không còn trống' : 'Dates no longer available', e.message);
              setReload((n) => n + 1);
            } else {
              notify(isVietnamese ? 'Đặt phòng thất bại' : 'Booking failed', e?.message ?? (isVietnamese ? 'Vui lòng thử lại.' : 'Please try again.'));
            }
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </Screen>
  );
}
