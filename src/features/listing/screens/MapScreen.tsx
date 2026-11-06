import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Linking,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Btn } from '@/components';
import { useListing, ListingState } from '@/features/listing/components/shared';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export function MapScreen({ route }: any) {
  const listingId = route.params?.id;
  const l = useListing(listingId);
  const { listingsLoading, listingsError, refreshListings } = useApp();
  const { colors } = useTheme();
  const { isVietnamese } = useLanguage();

  const [mapImageLoading, setMapImageLoading] = useState(true);
  const [mapImageError, setMapImageError] = useState(false);

  if (!l) {
    return (
      <Screen>
        <Header title={isVietnamese ? 'Vị trí & Bản đồ' : 'Location & Map'} />
        <ListingState
          loading={listingsLoading}
          error={listingsError}
          onRetry={() => void refreshListings()}
        />
      </Screen>
    );
  }

  const hasCoords = typeof l.latitude === 'number' && typeof l.longitude === 'number';
  const lat = l.latitude ?? 0;
  const lng = l.longitude ?? 0;

  // URL mở Google Maps
  const mapsSearchUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${l.city}, ${l.country}`)}`;

  // URL dẫn đường (Directions)
  const mapsDirectionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${l.city}, ${l.country}`)}`;

  // Static Map Preview URL từ OpenStreetMap
  const staticMapUrl = hasCoords
    ? `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=14&size=650x320&maptype=mapnik&markers=${lat},${lng},ol-marker`
    : '';

  const handleOpenMaps = async () => {
    try {
      await Linking.openURL(mapsSearchUrl);
    } catch {
      Alert.alert(
        isVietnamese ? 'Không thể mở bản đồ' : 'Unable to open maps',
        isVietnamese
          ? 'Không tìm thấy ứng dụng bản đồ hoặc trình duyệt phù hợp.'
          : 'Could not open map app or web browser.'
      );
    }
  };

  const handleDirections = async () => {
    try {
      await Linking.openURL(mapsDirectionsUrl);
    } catch {
      Alert.alert(
        isVietnamese ? 'Không thể mở chỉ đường' : 'Unable to open directions',
        isVietnamese
          ? 'Không tìm thấy ứng dụng bản đồ hoặc trình duyệt phù hợp.'
          : 'Could not open map app or web browser.'
      );
    }
  };

  const handleCopyCoords = () => {
    if (!hasCoords) return;
    Alert.alert(
      isVietnamese ? 'Tọa độ GPS' : 'GPS Coordinates',
      `${lat.toFixed(6)}, ${lng.toFixed(6)}\n\n${isVietnamese ? 'Địa chỉ: ' : 'Address: '}${l.city}, ${l.country}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <Screen>
      <Header title={isVietnamese ? 'Vị trí & Bản đồ' : 'Location & Map'} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Card Tóm tắt Chỗ nghỉ */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Image
              source={{ uri: l.images[0] || 'https://images.unsplash.com/photo-1540541338287-41700207dee6' }}
              style={styles.thumbnail}
            />
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }} numberOfLines={2}>
                {l.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Ionicons name="location" size={15} color={colors.primary} />
                <Text style={{ fontSize: 13, color: colors.muted }} numberOfLines={1}>
                  {l.city}, {l.country}
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary, marginTop: 4 }}>
                ${l.price} <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '400' }}>/ night</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Khung hiển thị Bản đồ */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted, marginBottom: 8, letterSpacing: 0.5 }}>
            {isVietnamese ? 'BẢN ĐỒ KHU VỰC' : 'AREA MAP'}
          </Text>

          <Pressable
            onPress={handleOpenMaps}
            accessibilityRole="button"
            accessibilityLabel="Open in Google Maps"
            style={[
              styles.mapContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            {hasCoords && !mapImageError ? (
              <View style={{ width: '100%', height: 220 }}>
                {mapImageLoading && (
                  <View style={[StyleSheet.absoluteFill, styles.centerBox, { backgroundColor: colors.soft }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                )}
                <Image
                  source={{ uri: staticMapUrl }}
                  style={{ width: '100%', height: 220 }}
                  resizeMode="cover"
                  onLoadStart={() => setMapImageLoading(true)}
                  onLoadEnd={() => setMapImageLoading(false)}
                  onError={() => {
                    setMapImageLoading(false);
                    setMapImageError(true);
                  }}
                />
              </View>
            ) : (
              // Fallback khi offline hoặc không có ảnh static map
              <View
                style={[
                  styles.mapPlaceholder,
                  {
                    backgroundColor: colors.soft,
                  },
                ]}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: colors.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <Ionicons name="map" size={32} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                  {l.city}, {l.country}
                </Text>
                {hasCoords ? (
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                    {lat.toFixed(4)}°, {lng.toFixed(4)}°
                  </Text>
                ) : null}
              </View>
            )}

            {/* Badge overlay trên bản đồ */}
            <View style={[styles.mapOverlayPill, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
              <Ionicons name="navigate-circle" size={16} color="#38bdf8" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                {isVietnamese ? 'Chạm để mở bản đồ tương tác' : 'Tap to open interactive map'}
              </Text>
              <Ionicons name="open-outline" size={14} color="#fff" />
            </View>
          </Pressable>
        </View>

        {/* Thông tin Chi tiết Tọa độ & Check-in */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted, marginBottom: 8, letterSpacing: 0.5 }}>
            {isVietnamese ? 'THÔNG TIN ĐỊA ĐIỂM' : 'LOCATION DETAILS'}
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                padding: 16,
                gap: 14,
              },
            ]}
          >
            {/* GPS coordinates */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <Ionicons name="compass-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: colors.muted }}>
                  {isVietnamese ? 'Tọa độ GPS chính xác' : 'Exact GPS Coordinates'}
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 2 }}>
                  {hasCoords ? `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E` : (isVietnamese ? 'Đang cập nhật' : 'Coordinates updating')}
                </Text>
              </View>
              {hasCoords && (
                <Pressable onPress={handleCopyCoords} hitSlop={8} style={{ padding: 4 }}>
                  <Ionicons name="copy-outline" size={18} color={colors.primary} />
                </Pressable>
              )}
            </View>

            {/* Address */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <Ionicons name="business-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: colors.muted }}>
                  {isVietnamese ? 'Khu vực & Quốc gia' : 'City & Country'}
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 2 }}>
                  {l.city}, {l.country} ({l.region})
                </Text>
              </View>
            </View>

            {/* Check-in Times */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <Ionicons name="time-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: colors.muted }}>
                  {isVietnamese ? 'Thời gian nhận / trả phòng' : 'Check-in / Check-out Times'}
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 2 }}>
                  Check-in: {l.checkInTime} · Check-out: {l.checkOutTime}
                </Text>
              </View>
            </View>

            {/* Check-in Policy / Directions Hint */}
            {l.checkInPolicy ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: colors.muted }}>
                    {isVietnamese ? 'Chỉ dẫn tiếp cận & Nhận phòng' : 'Arrival & Check-in Guide'}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20, marginTop: 4 }}>
                    {l.checkInPolicy}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* Nút Hành động */}
        <View style={{ marginTop: 24, gap: 12 }}>
          <Btn
            title={isVietnamese ? 'Mở trong Google Maps' : 'Open in Google Maps'}
            icon="map-outline"
            onPress={handleOpenMaps}
          />
          <Btn
            outline
            title={isVietnamese ? 'Chỉ đường đến chỗ nghỉ' : 'Get Directions'}
            icon="navigate-outline"
            onPress={handleDirections}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#cbd5e1',
  },
  mapContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  mapPlaceholder: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapOverlayPill: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
});
