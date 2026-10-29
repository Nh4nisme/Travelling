import { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Btn } from '@/components';
import { c, S } from '@/constants/theme';
import type { RootStackParamList } from '@/app/navigation/types';
import { useApp } from '@/store/AppContext';
import { supportService } from '@/services/supportService';
import type { ReportCategoryId, ReportReceipt } from '@/services/supportService';
import { REPORT_CATEGORIES, SUPPORT_CONTACT } from '../data/helpContent';

const MIN_LENGTH = 20;
const MAX_LENGTH = 1000;
/** Những loại báo cáo cho phép chọn đặt phòng liên quan. */
const BOOKING_RELATED: ReportCategoryId[] = ['booking', 'payment', 'listing'];

const SectionTitle = ({ children }: { children: string }) => (
  <Text style={[S.muted, { marginTop: 24, marginBottom: 12, fontWeight: '600', letterSpacing: 0.5 }]}>{children}</Text>
);

export function ReportProblemScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, bookings, listings } = useApp();

  const [category, setCategory] = useState<ReportCategoryId | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReportReceipt | null>(null);

  if (!user) {
    return (
      <Screen>
        <Header title="Report a Problem" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="lock-closed-outline" size={48} color={c.b} />
          <Text style={[S.muted, { marginTop: 12, textAlign: 'center' }]}>Please sign in to report a problem.</Text>
          <Btn title="Sign in" onPress={() => navigation.navigate('Auth')} style={{ marginTop: 20, alignSelf: 'stretch' }} />
        </View>
      </Screen>
    );
  }

  // ---- Màn hình thành công ----
  if (receipt) {
    return (
      <Screen>
        <Header title="Report a Problem" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="checkmark-circle" size={72} color="#22A559" />
          <Text style={[S.h1, { marginTop: 16, textAlign: 'center' }]}>Report submitted</Text>
          <Text style={[S.muted, { marginTop: 8, textAlign: 'center', lineHeight: 20 }]}>
            Thanks for letting us know. Our team will reply to {user.email} {SUPPORT_CONTACT.responseTime}.
          </Text>
          <View style={[S.box, { marginTop: 24, alignItems: 'center', alignSelf: 'stretch', backgroundColor: c.soft, borderColor: c.soft }]}>
            <Text style={S.muted}>Reference number</Text>
            <Text selectable style={{ marginTop: 4, fontSize: 20, fontWeight: '700', color: c.t, letterSpacing: 1 }}>{receipt.reference}</Text>
          </View>
          <Btn title="Back to Help Center" onPress={() => navigation.goBack()} style={{ marginTop: 28, alignSelf: 'stretch' }} />
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
      <Header title="Report a Problem" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <Text style={[S.muted, { marginTop: 4 }]}>Tell us what went wrong and we'll look into it.</Text>

          <SectionTitle>WHAT'S THE PROBLEM ABOUT?</SectionTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {REPORT_CATEGORIES.map((item) => {
              const active = category === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setCategory(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    S.row,
                    {
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: active ? c.p : c.b,
                      backgroundColor: active ? c.pl : '#fff',
                    },
                  ]}
                >
                  <Ionicons name={item.icon} size={16} color={active ? c.p : c.m} />
                  <Text style={{ fontSize: 14, color: c.t, fontWeight: active ? '700' : '500' }}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {showBookingPicker && (
            <>
              <SectionTitle>RELATED BOOKING (OPTIONAL)</SectionTitle>
              {bookings.map((booking) => {
                const listing = listings.find((l) => l.id === booking.listingId);
                const selected = bookingRef === booking.ref;
                return (
                  <Pressable
                    key={booking.id}
                    onPress={() => setBookingRef(selected ? null : booking.ref)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={[S.between, { paddingVertical: 12, gap: 12 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', color: c.t }} numberOfLines={1}>{listing?.title ?? 'Booking'}</Text>
                      <Text style={[S.muted, { fontSize: 13 }]}>Ref {booking.ref}</Text>
                    </View>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: selected ? c.p : c.m,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {selected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.p }} />}
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}

          <SectionTitle>DESCRIBE WHAT HAPPENED</SectionTitle>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Include as much detail as you can: what you expected, what happened, and when."
            placeholderTextColor={c.m}
            multiline
            maxLength={MAX_LENGTH}
            textAlignVertical="top"
            style={[S.input, { minHeight: 140 }]}
          />
          <View style={[S.between, { marginTop: 6 }]}>
            <Text style={[S.muted, { fontSize: 12 }]}>
              {trimmedLength < MIN_LENGTH ? `At least ${MIN_LENGTH} characters` : ' '}
            </Text>
            <Text style={[S.muted, { fontSize: 12 }]}>{description.length}/{MAX_LENGTH}</Text>
          </View>

          <Text style={[S.muted, { marginTop: 16, fontSize: 13 }]}>We'll reply to {user.email}.</Text>

          {error && <Text style={{ color: '#D94A55', fontSize: 14, marginTop: 12 }}>{error}</Text>}

          <Btn
            title={submitting ? 'Submitting...' : 'Submit report'}
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={{ marginTop: 20 }}
          />
          {submitting && <ActivityIndicator size="small" color={c.p} style={{ marginTop: 12 }} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
