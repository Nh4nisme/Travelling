import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Btn } from '@/components';
import { c, S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { userService } from '@/services/userService';
import { tokenStorage } from '@/services/tokenStorage';

const PHONE_REGEX = /^[0-9+\-\s]{8,15}$/;

export function PersonalInfoScreen() {
  const { user, updateUser } = useApp();
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
      setError('Name is required');
      return false;
    }
    if (trimmedName.length > 80) {
      setError('Name cannot exceed 80 characters');
      return false;
    }
    const trimmedPhone = phone.trim();
    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      setError('Please enter a valid phone number (8-15 digits)');
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
        setError('Authentication required. Please sign in again.');
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

      Alert.alert('Success', 'Your personal info has been updated.');
    } catch (e: any) {
      const message = e?.message || 'Failed to update profile. Please try again.';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  if (!user && !fetching) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={S.muted}>Please sign in to view your profile</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {fetching && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 4 }}>
            <ActivityIndicator size="small" color={c.p} />
            <Text style={[S.muted, { fontSize: 13 }]}>Syncing latest profile...</Text>
          </View>
        )}

        {/* Name Field */}
        <View>
          <Text style={[S.muted, { marginBottom: 6 }]}>Name</Text>
          <TextInput
            style={S.input}
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (error) setError(null);
            }}
            placeholder="Enter your name"
            placeholderTextColor={c.m}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        {/* Email Field (Read-only) */}
        <View>
          <Text style={[S.muted, { marginBottom: 6 }]}>Email</Text>
          <TextInput
            style={[S.input, { backgroundColor: c.soft, color: c.m }]}
            value={user?.email ?? ''}
            editable={false}
          />
          <Text style={[S.muted, { fontSize: 12, marginTop: 4 }]}>
            Email changes require support
          </Text>
        </View>

        {/* Phone Field */}
        <View>
          <Text style={[S.muted, { marginBottom: 6 }]}>Phone (optional)</Text>
          <TextInput
            style={S.input}
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              if (error) setError(null);
            }}
            placeholder="Enter your phone number"
            placeholderTextColor={c.m}
            keyboardType="phone-pad"
            autoCorrect={false}
          />
        </View>

        {/* Error Message */}
        {error && (
          <Text style={{ color: '#D94A55', fontSize: 14 }}>{error}</Text>
        )}

        {/* Save Button */}
        <Btn
          title={saving ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          disabled={!hasChanges || saving}
          style={{ marginTop: 12 }}
        />

        {saving && (
          <ActivityIndicator size="small" color={c.p} style={{ marginTop: 8 }} />
        )}
      </ScrollView>
    </View>
  );
}
