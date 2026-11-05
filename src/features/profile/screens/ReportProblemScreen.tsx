import { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Btn } from '@/components';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import type { RootStackParamList } from '@/app/navigation/types';
import { useApp } from '@/store/AppContext';
import { supportService } from '@/services/supportService';
import type { ReportCategoryId, ReportReceipt } from '@/services/supportService';
import { REPORT_CATEGORIES, SUPPORT_CONTACT } from '../data/helpContent';

const MIN_LENGTH = 20;
const MAX_LENGTH = 1000;
/** Những loại báo cáo cho phép chọn đặt phòng liên quan. */
const BOOKING_RELATED: ReportCategoryId[] = ['booking', 'payment', 'listing'];

const SectionTitle = ({ children, colors }: { children: string; colors: any }) => (
  <Text style={{ color: colors.muted, marginTop: 24, marginBottom: 12, fontWeight: '600', letterSpacing: 0.5 }}>{children}</Text>
);

export function ReportProblemScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, bookings, listings } = useApp();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [category, setCategory] = useState<ReportCategoryId | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReportReceipt | null>(null);

  if (!user) {
    return (
      <Screen>
        <Header title={t.helpCenter.reportTitle} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.border} />
          <Text style={{ color: colors.muted, marginTop: 12, textAlign: 'center' }}>{t.helpCenter.signInToReport}</Text>
          <Btn title={t.profile.signIn} onPress={() => navigation.navigate('Auth')} style={{ marginTop: 20, alignSelf: 'stretch' }} />
        </View>
      </Screen>
    );
  }

  // ---- Màn hình thành công ----
  if (receipt) {
    return (
      <Screen>
        <Header title={t.helpCenter.reportTitle} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="checkmark-circle" size={72} color="#22A559" />
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginTop: 16, textAlign: 'center' }}>{t.helpCenter.reportSubmitted}</Text>
          <Text style={{ color: colors.muted, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
            {t.helpCenter.thanksLetting} {user.email} {t.helpCenter.withinHour}.
          </Text>
          <View style={{ backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.soft, borderRadius: 12, padding: 16, marginTop: 24, alignItems: 'center', alignSelf: 'stretch' }}>
            <Text style={{ color: colors.muted }}>{t.helpCenter.referenceNumber}</Text>
            <Text selectable style={{ marginTop: 4, fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: 1 }}>{receipt.reference}</Text>
          </View>
          <Btn title={t.helpCenter.backToHelp} onPress={() => navigation.goBack()} style={{ marginTop: 28, alignSelf: 'stretch' }} />
        </View>
      </Screen>
    );
  }

  const showBookingPicker = category !== null && BOOKING_RELATED.includes(category) && bookings.length > 0;
  const trimmedLength = description.trim().length;
  const canSubmit = category !== null && trimmedLength >= MIN_LENGTH && !submitting;

  const handleSubmit = async () => {
    if (!category || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await supportService.submitReport({
        category,
        description: description.trim(),
        bookingRef: showBookingPicker && bookingRef ? bookingRef : undefined,
      });
      setReceipt(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Header title={t.helpCenter.reportTitle} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <Text style={{ color: colors.muted, marginTop: 4 }}>{t.helpCenter.tellUsWrong}</Text>

          <SectionTitle colors={colors}>{t.helpCenter.whatProblem}</SectionTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {REPORT_CATEGORIES.map((item) => {
              const active = category === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setCategory(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primaryLight : colors.card,
                  }}
                >
                  <Ionicons name={item.icon} size={16} color={active ? colors.primary : colors.muted} />
                  <Text style={{ fontSize: 14, color: colors.text, fontWeight: active ? '700' : '500' }}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {showBookingPicker && (
            <>
              <SectionTitle colors={colors}>{t.helpCenter.relatedBooking}</SectionTitle>
              {bookings.map((booking) => {
                const listing = listings.find((l) => l.id === (booking.listing?.id ?? (booking as any).listingId));
                const selected = bookingRef === booking.ref;
                return (
                  <Pressable
                    key={booking.id}
                    onPress={() => setBookingRef(selected ? null : booking.ref)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, gap: 12 }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', color: colors.text }} numberOfLines={1}>{listing?.title ?? 'Booking'}</Text>
                      <Text style={{ color: colors.muted, fontSize: 13 }}>Ref {booking.ref}</Text>
                    </View>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: selected ? colors.primary : colors.muted,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {selected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary }} />}
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}

          <SectionTitle colors={colors}>{t.helpCenter.describeWhat}</SectionTitle>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t.helpCenter.describePlaceholder}
            placeholderTextColor={colors.muted}
            multiline
            maxLength={MAX_LENGTH}
            textAlignVertical="top"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 16, color: colors.text, minHeight: 140 }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {trimmedLength < MIN_LENGTH ? t.helpCenter.atLeast : ' '}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{description.length}/{MAX_LENGTH}</Text>
          </View>

          <Text style={{ color: colors.muted, marginTop: 16, fontSize: 13 }}>{t.helpCenter.weWillReply} {user.email}.</Text>

          {error && <Text style={{ color: '#D94A55', fontSize: 14, marginTop: 12 }}>{error}</Text>}

          <Btn
            title={submitting ? t.helpCenter.submitting : t.helpCenter.submitReport}
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={{ marginTop: 20 }}
          />
          {submitting && <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 12 }} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
