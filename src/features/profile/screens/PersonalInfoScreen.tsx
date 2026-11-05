import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Btn } from '@/components';
import { useApp } from '@/store/AppContext';
import { userService } from '@/services/userService';
import { tokenStorage } from '@/services/tokenStorage';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

const PHONE_REGEX = /^[0-9+\-\s]{8,15}$/;

export function PersonalInfoScreen() {
  const { user, updateUser } = useApp();
  const { colors } = useTheme();
  const { isVietnamese } = useLanguage();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch latest data from API when opening screen
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const token = await tokenStorage.get();
        if (token) {
          setFetching(true);
          const { user: freshUser } = await userService.getProfile(token);
          if (isMounted && freshUser) {
            setName(freshUser.name);
            setPhone(freshUser.phone ?? '');
            if (typeof updateUser === 'function') {
              updateUser(freshUser);
            }
          }
        }
      } catch (err) {
        // Fallback to existing user from context
      } finally {
        if (isMounted) setFetching(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update local state when user in context updates
  useEffect(() => {
    if (user && !fetching) {
      setName((prev) => (prev ? prev : user.name));
      setPhone((prev) => (prev ? prev : (user.phone ?? '')));
    }
  }, [user]);

  // Check if form has changes compared to current user
  const hasChanges =
    user &&
    (name.trim() !== user.name.trim() || phone.trim() !== (user.phone ?? '').trim());

  // Validate form
  const validate = (): boolean => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(isVietnamese ? 'Vui lòng nhập họ tên' : 'Name is required');
      return false;
    }
    if (trimmedName.length > 80) {
      setError(isVietnamese ? 'Tên không được quá 80 ký tự' : 'Name cannot exceed 80 characters');
      return false;
    }
    const trimmedPhone = phone.trim();
    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      setError(
        isVietnamese
          ? 'Vui lòng nhập số điện thoại hợp lệ (8-15 chữ số)'
          : 'Please enter a valid phone number (8-15 digits)'
      );
      return false;
    }
    setError(null);
    return true;
  };

  // Handle save
  const handleSave = async () => {
    if (!validate() || !user) return;

    setSaving(true);
    setError(null);

    try {
      const token = await tokenStorage.get();
      if (!token) {
        setError(isVietnamese ? 'Cần đăng nhập lại.' : 'Authentication required. Please sign in again.');
        setSaving(false);
        return;
      }

      const payload: { name?: string; phone?: string } = {
        name: name.trim(),
        phone: phone.trim(),
      };

      const res = await userService.updateProfile(payload, token);

      if (typeof updateUser === 'function') {
        updateUser(res.user);
      }

      Alert.alert(
        isVietnamese ? 'Thành công' : 'Success',
        isVietnamese ? 'Thông tin cá nhân đã được cập nhật.' : 'Your personal info has been updated.'
      );
    } catch (e: any) {
      const message =
        e?.message || (isVietnamese ? 'Cập nhật thất bại. Vui lòng thử lại.' : 'Failed to update profile. Please try again.');
      setError(message);
      Alert.alert(isVietnamese ? 'Lỗi' : 'Error', message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  };

  if (!user && !fetching) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: colors.muted }}>
          {isVietnamese ? 'Vui lòng đăng nhập để xem thông tin' : 'Please sign in to view your profile'}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {fetching && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 4,
            }}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ fontSize: 13, color: colors.muted }}>
              {isVietnamese ? 'Đang đồng bộ hồ sơ...' : 'Syncing latest profile...'}
            </Text>
          </View>
        )}

        {/* Name Field */}
        <View>
          <Text style={{ color: colors.muted, marginBottom: 6, fontSize: 14 }}>
            {isVietnamese ? 'Họ và tên' : 'Name'}
          </Text>
          <TextInput
            style={inputStyle}
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (error) setError(null);
            }}
            placeholder={isVietnamese ? 'Nhập họ và tên của bạn' : 'Enter your name'}
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        {/* Email Field (Read-only) */}
        <View>
          <Text style={{ color: colors.muted, marginBottom: 6, fontSize: 14 }}>Email</Text>
          <TextInput
            style={[inputStyle, { backgroundColor: colors.soft, color: colors.muted }]}
            value={user?.email ?? ''}
            editable={false}
          />
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
            {isVietnamese ? 'Để đổi email vui lòng liên hệ hỗ trợ' : 'Email changes require support'}
          </Text>
        </View>

        {/* Phone Field */}
        <View>
          <Text style={{ color: colors.muted, marginBottom: 6, fontSize: 14 }}>
            {isVietnamese ? 'Số điện thoại (không bắt buộc)' : 'Phone (optional)'}
          </Text>
          <TextInput
            style={inputStyle}
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              if (error) setError(null);
            }}
            placeholder={isVietnamese ? 'Nhập số điện thoại của bạn' : 'Enter your phone number'}
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            autoCorrect={false}
          />
        </View>

        {/* Error Message */}
        {error && <Text style={{ color: colors.danger, fontSize: 14 }}>{error}</Text>}

        {/* Save Button */}
        <Btn
          title={
            saving
              ? isVietnamese
                ? 'Đang lưu...'
                : 'Saving...'
              : isVietnamese
              ? 'Lưu thay đổi'
              : 'Save Changes'
          }
          onPress={handleSave}
          disabled={!hasChanges || saving}
          style={{ marginTop: 12 }}
        />

        {saving && (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
        )}
      </ScrollView>
    </View>
  );
}
