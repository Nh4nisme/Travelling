import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Btn, Photo } from '@/components';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/store/AppContext';
import { bookingService } from '@/services/bookingService';
import { tokenStorage } from '@/services/tokenStorage';

export function WriteReviewScreen({ route, navigation }: any) {
  const { listingId, listingTitle, listingImage } = route.params || {};
  const { colors } = useTheme();
  const { isVietnamese } = useLanguage();
  const { refreshListings } = useApp();

  const [stars, setStars] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const starLabels: Record<number, { vi: string; en: string }> = {
    1: { vi: 'Rất tệ', en: 'Poor' },
    2: { vi: 'Chưa hài lòng', en: 'Fair' },
    3: { vi: 'Bình thường', en: 'Average' },
    4: { vi: 'Hài lòng', en: 'Good' },
    5: { vi: 'Tuyệt vời', en: 'Excellent' },
  };

  const handleSubmit = async () => {
    if (stars === 0) {
      Alert.alert(
        isVietnamese ? 'Cần chọn số sao' : 'Please select stars',
        isVietnamese ? 'Vui lòng chọn số sao từ 1 đến 5' : 'Please select 1-5 stars'
      );
      return;
    }

    if (text.trim().length < 10) {
      Alert.alert(
        isVietnamese ? 'Nội dung quá ngắn' : 'Review too short',
        isVietnamese ? 'Vui lòng viết ít nhất 10 ký tự để chia sẻ trải nghiệm.' : 'Please write at least 10 characters to share your experience.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const token = await tokenStorage.get();
      if (!token) throw new Error('Not authenticated');

      await bookingService.addReview(listingId, stars, text.trim(), token);
      await refreshListings();

      Alert.alert(
        isVietnamese ? 'Thành công' : 'Success',
        isVietnamese ? 'Cảm ơn bạn đã gửi đánh giá!' : 'Thank you for submitting your review!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.replace('Reviews', { id: listingId });
            },
          },
        ],
        {
          cancelable: false,
        }
      );
    } catch (err: any) {
      if (err?.code === 'REVIEW_TOO_EARLY') {
        Alert.alert(
          isVietnamese ? 'Chưa đến lúc' : 'Not yet',
          isVietnamese
            ? 'Bạn có thể đánh giá sau khi hoàn thành chuyến đi.'
            : 'You can leave a review after your stay is completed.'
        );
      } else {
        Alert.alert(
          isVietnamese ? 'Lỗi' : 'Error',
          err?.message || (isVietnamese ? 'Không thể gửi đánh giá' : 'Could not submit review')
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Header title={isVietnamese ? 'Viết đánh giá' : 'Write a Review'} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Listing preview banner */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 14,
            padding: 12,
            gap: 12,
            marginBottom: 16,
          }}
        >
          {listingImage ? (
            <Photo uri={listingImage} style={{ width: 64, height: 64, borderRadius: 10 }} />
          ) : (
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 10,
                backgroundColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="home-outline" size={28} color={colors.muted} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={2}>
              {listingTitle || (isVietnamese ? 'Chỗ ở' : 'Stay')}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
              {isVietnamese ? 'Cảm ơn bạn đã đồng hành cùng chuyến đi!' : 'Thank you for staying with us!'}
            </Text>
          </View>
        </View>

        {/* Star Rating Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 14,
            padding: 18,
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
            {isVietnamese ? 'Trải nghiệm của bạn thế nào?' : 'How was your stay?'}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 14 }}>
            {isVietnamese ? 'Chạm vào sao để chấm điểm' : 'Tap a star to rate'}
          </Text>

          {/* Interactive Star Row */}
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 10 }}>
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= stars;
              return (
                <Pressable
                  key={star}
                  onPress={() => setStars(star)}
                  hitSlop={8}
                  style={{ padding: 4 }}
                >
                  <Ionicons
                    name={active ? 'star' : 'star-outline'}
                    size={38}
                    color={active ? (colors.star || '#F5B335') : colors.border}
                  />
                </Pressable>
              );
            })}
          </View>

          {stars > 0 && (
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primary }}>
              {isVietnamese ? starLabels[stars]?.vi : starLabels[stars]?.en}
            </Text>
          )}
        </View>

        {/* Review Text Input Section */}
        <View
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
            {isVietnamese ? 'Nhận xét chi tiết' : 'Detailed review'}
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={
              isVietnamese
                ? 'Hãy mô tả trải nghiệm về phòng ốc, tiện nghi, chủ nhà hoặc vị trí (tối thiểu 10 ký tự)...'
                : 'Describe your experience with the room, amenities, host, or location (min 10 characters)...'
            }
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text
              style={{
                fontSize: 12,
                color: text.trim().length >= 10 ? '#22A559' : colors.muted,
              }}
            >
              {text.trim().length < 10
                ? isVietnamese
                  ? `Còn thiếu ${10 - text.trim().length} ký tự`
                  : `${10 - text.trim().length} more characters needed`
                : isVietnamese
                ? '✓ Đã đạt độ dài tối thiểu'
                : '✓ Minimum length reached'}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {text.length}/500 {isVietnamese ? 'ký tự' : 'characters'}
            </Text>
          </View>
        </View>

        <Btn
          icon="send-outline"
          title={
            submitting
              ? isVietnamese
                ? 'Đang gửi…'
                : 'Submitting…'
              : isVietnamese
              ? 'Gửi đánh giá'
              : 'Submit Review'
          }
          onPress={handleSubmit}
          disabled={submitting || stars === 0 || text.trim().length < 10}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
  },
});
