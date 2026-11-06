import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Stars, Photo, Heart, Screen } from '@/components';
import { S, W, c } from '@/constants/theme';
import { avatar } from '@/data/reviews';
import { ICON, Section, useListing, ListingState } from '@/features/listing/components/shared';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { confirmDialog } from '@/utils/dialog';
import { chatService } from '@/services/chatService';

export function DetailScreen({ route, navigation }: any) {
  const l = useListing(route.params.id);
  const { user, search, listingsLoading, listingsError, refreshListings } = useApp();
  const { colors, isDark } = useTheme();
  const { t, isVietnamese } = useLanguage();

  const [idx, setIdx] = useState(0);
  const [contactingHost, setContactingHost] = useState(false);

  // States mở rộng cho Show all & View more (in-place functional toggle)
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  const [showAllPolicies, setShowAllPolicies] = useState(false);
  const [showAllDesc, setShowAllDesc] = useState(false);

  if (!l)
    return (
      <Screen>
        <ListingState
          loading={listingsLoading}
          error={listingsError}
          onRetry={() => void refreshListings()}
        />
      </Screen>
    );
  const reviews = l.reviewItems ?? [];

  const isOwner = Boolean(
    user?.email && l.hostEmail && user.email.toLowerCase() === l.hostEmail.toLowerCase()
  );

  // Chưa đăng nhập -> mời đăng nhập; chưa chọn ngày -> sang màn chọn ngày; đã có ngày -> xác nhận luôn
  const onBook = async () => {
    if (!user) {
      if (await confirmDialog('Sign in required', 'Please sign in to book this place.', 'Sign in'))
        navigation.navigate('Auth');
      return;
    }
    const hasDates = !!search.start && !!search.end && +search.end > +search.start;
    navigation.navigate(hasDates && search.adults >= 1 ? 'Confirm' : 'BookingDates', { id: l.id });
  };

  // Liên hệ chủ nhà -> tạo/mở conversation rồi navigate sang Inbox tab
  const onContactHost = async () => {
    if (!user) {
      if (await confirmDialog('Sign in required', 'Please sign in to contact the host.', 'Sign in'))
        navigation.navigate('Auth');
      return;
    }

    if (isOwner) {
      Alert.alert(
        'Your Listing',
        `You are the host of "${l.title}". To test contacting the host as a traveler, please sign in with a guest account.`
      );
      return;
    }

    setContactingHost(true);
    try {
      const convId = await chatService.createInquiry({
        hostEmail: l.hostEmail,
        listingId: l.id,
        listingTitle: l.title,
        listingImage: l.images?.[0],
        listingPrice: l.price,
      });

      // Navigate sang tab Inbox và auto-open conversation vừa tạo/tìm
      navigation.navigate('Main', {
        screen: 'Inbox',
        params: { openConversationId: convId, t: Date.now() },
      });
    } catch (err: any) {
      Alert.alert('Contact Host', err?.message ?? 'Cannot contact host. Please try again.');
    } finally {
      setContactingHost(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView>
        <View>
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={l.images}
            keyExtractor={(x) => x}
            onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
            renderItem={({ item }) => <Photo uri={item} style={{ width: W, height: 260 }} />}
          />
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              position: 'absolute',
              top: 50,
              left: 16,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isDark ? 'rgba(30,30,30,.85)' : 'rgba(255,255,255,.85)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Heart id={l.id} style={{ position: 'absolute', top: 46, right: 16 }} />
          <View
            style={{
              position: 'absolute',
              right: 14,
              bottom: 12,
              backgroundColor: 'rgba(0,0,0,.65)',
              borderRadius: 14,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: '#fff' }}>
              🖼 {idx + 1}/{l.images.length}
            </Text>
          </View>
        </View>

        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>{l.title}</Text>
          <View style={[S.between, { marginTop: 8 }]}>
            <View style={[S.row, { gap: 4 }]}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={{ color: colors.muted }}>
                {l.city}, {l.country}
              </Text>
            </View>
            <Pressable onPress={() => navigation.navigate('Map', { id: l.id })}>
              <View style={{
                backgroundColor: colors.primaryLight,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}>
                <Ionicons name="map-outline" size={14} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                  {t.listing.openMap}
                </Text>
              </View>
            </Pressable>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Reviews', { id: l.id })}
            style={[
              S.between,
              {
                backgroundColor: colors.soft,
                borderRadius: 8,
                padding: 12,
                marginTop: 14,
              },
            ]}
          >
            <Text style={{ color: colors.text }}>
              <Ionicons name="star" color={c.star} /> {l.rating.toFixed(1)}/5
            </Text>
            <Text style={{ color: colors.muted }}>
              {l.reviews} {t.listing.reviews.toLowerCase()} ›
            </Text>
          </Pressable>
        </View>

        {/* Host Info Card */}
        {Boolean(l.hostName) ? (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 8,
              padding: 14,
              borderRadius: 12,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={[S.between, { alignItems: 'center' }]}>
              <View style={[S.row, { gap: 10, alignItems: 'center' }]}>
                <Image
                  source={{ uri: avatar((l as any).hostAvatar ?? 12) }}
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.soft }}
                />
                <View>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: colors.text }}>
                    {isVietnamese ? 'Chủ nhà: ' : 'Hosted by '}{l.hostName}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                    {l.hostEmail}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => void onContactHost()}
                style={{
                  height: 36,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isOwner ? (isDark ? '#3D2800' : '#FFF7E6') : colors.card,
                  borderWidth: 1.5,
                  borderColor: isOwner ? (isDark ? '#9E6400' : '#FFE0A3') : colors.primary,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: isOwner ? (isDark ? '#FFE0A3' : '#9E6400') : colors.primary,
                  }}
                >
                  {isOwner ? t.listing.yourListing : t.listing.contactHost}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Facilities & Services */}
        <Section title={t.listing.facilities}>
          <Text style={{ color: colors.muted, marginBottom: 10 }}>
            {l.maxGuests} {t.listing.guests} · {l.bedrooms} {t.listing.bedrooms} · {l.beds} {t.listing.beds} · {l.baths} {t.listing.baths}
          </Text>
          {(showAllFacilities ? l.facilities : l.facilities.slice(0, 4)).map((f) => (
            <View key={f} style={[S.row, { gap: 12, marginVertical: 6 }]}>
              <Ionicons name={ICON[f] ?? 'checkmark-circle-outline'} size={20} color={colors.primary} />
              <Text style={{ fontSize: 16, color: colors.text }}>{f}</Text>
            </View>
          ))}
          {l.facilities.length > 4 && (
            <Btn
              outline
              title={
                showAllFacilities
                  ? `${t.listing.showLess}  ▴`
                  : `${t.listing.showAll} ${l.facilities.length} ${isVietnamese ? 'tiện ích' : 'amenities'}`
              }
              onPress={() => setShowAllFacilities((prev) => !prev)}
              style={{
                marginTop: 12,
                height: 40,
                paddingVertical: 0,
                borderRadius: 8,
                borderColor: colors.border,
              }}
            />
          )}
        </Section>

        {/* Reviews */}
        <Section
          title={t.listing.reviews}
          right={
            <Pressable onPress={() => navigation.navigate('Reviews', { id: l.id })}>
              <Text style={{ color: colors.muted }}>{isVietnamese ? 'Xem tất cả ›' : 'See all ›'}</Text>
            </Pressable>
          }
        >
          <Text style={{ fontSize: 34, fontWeight: '700', color: colors.text }}>
            {l.rating.toFixed(1)}
            <Text style={{ fontSize: 16, color: colors.muted }}>/5</Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {reviews.map((r) => (
              <View
                key={r.name}
                style={{
                  width: W * 0.72,
                  marginRight: 12,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <View style={S.between}>
                  <View style={[S.row, { gap: 8 }]}>
                    <Image
                      source={{ uri: avatar(r.avatar) }}
                      style={{ width: 36, height: 36, borderRadius: 18 }}
                    />
                    <Text style={{ fontWeight: '700', color: colors.text }}>{r.name}</Text>
                  </View>
                  <Stars n={r.stars} />
                </View>
                <Text numberOfLines={2} style={{ color: colors.muted, marginTop: 10, fontSize: 14 }}>
                  {r.text}
                </Text>
              </View>
            ))}
          </ScrollView>
        </Section>

        {/* Policies */}
        <Section title={t.listing.policies}>
          <View style={{ backgroundColor: colors.soft, padding: 12, borderRadius: 8 }}>
            <Text style={{ fontWeight: '700', marginBottom: 8, color: colors.text }}>
              {isVietnamese ? 'Quy định chỗ nghỉ' : 'House rules'}
            </Text>
            <Text style={{ color: colors.muted }}>
              {isVietnamese ? '🕑 Giờ nhận phòng sớm nhất: ' : '🕑 Earliest check-in time: '}{l.checkInTime}
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>
              {isVietnamese ? '🕑 Giờ trả phòng muộn nhất: ' : '🕑 Latest check-out time: '}{l.checkOutTime}
            </Text>
          </View>
          <Text style={{ fontWeight: '700', marginTop: 14, marginBottom: 6, color: colors.text }}>
            {isVietnamese ? 'Chính sách nhận phòng' : 'Check-in policies'}
          </Text>
          <Text numberOfLines={showAllPolicies ? undefined : 2} style={{ color: colors.muted, lineHeight: 22 }}>
            {l.checkInPolicy}
          </Text>
          <Btn
            outline
            title={showAllPolicies ? `${t.listing.showLess}  ▴` : `${t.listing.viewMore}  ›`}
            onPress={() => setShowAllPolicies((prev) => !prev)}
            style={{
              marginTop: 10,
              height: 40,
              paddingVertical: 0,
              borderRadius: 8,
              borderColor: colors.border,
            }}
          />
        </Section>

        {/* Description */}
        <Section title={t.listing.description}>
          <Photo uri={l.images[0]} style={{ height: 160, borderRadius: 8 }} />
          <Text
            numberOfLines={showAllDesc ? undefined : 3}
            style={{ color: colors.muted, marginTop: 12, lineHeight: 22 }}
          >
            {l.desc}
          </Text>
          <Btn
            outline
            title={showAllDesc ? `${t.listing.showLess}  ▴` : `${t.listing.viewMore}  ›`}
            onPress={() => setShowAllDesc((prev) => !prev)}
            style={{
              marginTop: 10,
              height: 40,
              paddingVertical: 0,
              borderRadius: 8,
              borderColor: colors.border,
            }}
          />
        </Section>
      </ScrollView>

      {/* Bottom action bar */}
      <View
        style={[
          S.between,
          {
            paddingHorizontal: 14,
            paddingTop: 10,
            paddingBottom: 24,
            borderTopWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            gap: 6,
            alignItems: 'center',
          },
        ]}
      >
        <View style={{ flexShrink: 0 }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            {t.listing.from}:{' '}
            <Text style={{ fontWeight: '700', color: colors.text, fontSize: 16 }}>${l.price}</Text>/
            {t.listing.night}
          </Text>
        </View>
        <View style={[S.row, { gap: 6, alignItems: 'center', flexShrink: 1 }]}>
          {/* Nút liên hệ chủ nhà */}
          <Pressable
            onPress={() => void onContactHost()}
            disabled={contactingHost}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              height: 42,
              paddingHorizontal: 11,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: isOwner ? (isDark ? '#9E6400' : '#FFE0A3') : colors.primary,
              backgroundColor: isOwner
                ? isDark
                  ? '#3D2800'
                  : '#FFF7E6'
                : contactingHost
                ? colors.soft
                : colors.card,
            }}
          >
            {contactingHost ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons
                name={isOwner ? 'home-outline' : 'chatbubble-outline'}
                size={16}
                color={isOwner ? (isDark ? '#FFE0A3' : '#9E6400') : colors.primary}
              />
            )}
            <Text
              style={{
                color: isOwner ? (isDark ? '#FFE0A3' : '#9E6400') : colors.primary,
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              {isOwner
                ? t.listing.yourListing
                : contactingHost
                ? t.common.connecting
                : t.listing.contactHost}
            </Text>
          </Pressable>

          {/* Nút Book now */}
          <Btn
            title={t.listing.bookNow}
            onPress={() => void onBook()}
            style={{ height: 42, paddingVertical: 0, paddingHorizontal: 16, borderRadius: 10 }}
          />
        </View>
      </View>
    </View>
  );
}
