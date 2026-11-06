import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Stars, Btn } from '@/components';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { bookingService } from '@/services/bookingService';
import { tokenStorage } from '@/services/tokenStorage';

export function WriteReviewScreen({ route, navigation }: any) {
  const { listingId, listingTitle, listingImage } = route.params;
  const { colors } = useTheme();
  const { t, isVietnamese } = useLanguage();
  
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        isVietnamese ? 'Văn bản quá ngắn' : 'Text too short',
        isVietnamese ? 'Vui lòng viết ít nhất 10 ký tự' : 'Please write at least 10 characters'
      );
      return;
    }

    setSubmitting(true);
    try {
      const token = await tokenStorage.get();
      if (!token) throw new Error('Not authenticated');
      
      const result = await bookingService.addReview(listingId, stars, text, token);
      
      Alert.alert(
        isVietnamese ? 'Thành công' : 'Success',
        isVietnamese ? 'Đã gửi đánh giá của bạn!' : 'Your review has been submitted!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      if (err?.code === 'REVIEW_TOO_EARLY') {
        Alert.alert(
          isVietnamese ? 'Chưa đến lúc' : 'Not yet',
          isVietnamese 
            ? 'Bạn chỉ có thể đánh giá 1 ngày sau khi checkout' 
            : 'You can leave a review 1 day after checkout'
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
      <ScrollView style={{ backgroundColor: colors.bg }}>
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
            {listingTitle}
          </Text>
          <Text style={{ color: colors.muted, marginTop: 8 }}>
            {isVietnamese ? 'Cảm ơn bạn đã lưu trú!' : 'Thank you for your stay!'}
          </Text>
        </View>

        <View style={{ padding: 16, backgroundColor: colors.card, margin: 16, borderRadius: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
            {isVietnamese ? 'Đánh giá của bạn' : 'Your rating'}
          </Text>
          <View style={{ marginTop: 16 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setStars(star)}
                style={{ paddingVertical: 8 }}
              >
                <View style={{ flexDirection: 'row' }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Ionicons 
                      key={i} 
                      name="star" 
                      size={28} 
                      color={i <= star ? (stars >= star ? colors.star : colors.muted) : '#E3E5EA'} 
                    />
                  ))}
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
            {isVietnamese ? 'Viết nhận xét' : 'Write your review'}
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={isVietnamese ? 'Chia sẻ trải nghiệm của bạn...' : 'Share your experience...'}
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              }
            ]}
          />
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>
            {text.length}/200 {isVietnamese ? 'ký tự' : 'characters'}
          </Text>
        </View>
      </ScrollView>

      <View style={{ padding: 16, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
        <Btn
          title={submitting ? (isVietnamese ? 'Đang gửi...' : 'Submitting...') : (isVietnamese ? 'Gửi đánh giá' : 'Submit Review')}
          onPress={handleSubmit}
          disabled={submitting || stars === 0}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
  },
});
