import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Header, Btn } from '@/components';
import { c, S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { userService } from '@/services/userService';
import { tokenStorage } from '@/services/tokenStorage';

export function PersonalInfoScreen() {
  const { user, updateUser } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with current user data
  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? '');
    }
  }, [user]);

  // Check if form has changes
  const hasChanges = user && (name !== user.name || phone !== (user.phone ?? ''));

  // Validate form
  const validate = (): boolean => {
    if (!name.trim()) {
      setError('Name is required');
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
        setError('Authentication required');
        setSaving(false);
        return;
      }

      const payload: { name?: string; phone?: string } = {};
      if (name !== user.name) payload.name = name.trim();
      if (phone !== (user.phone ?? '')) payload.phone = phone.trim() || undefined;

      await userService.updateProfile(payload, token);
      
      // Update user in context
      updateUser({ name: name.trim(), phone: phone.trim() || undefined });
      
      Alert.alert('Success', 'Your profile has been updated.');
    } catch (e: any) {
      const message = e?.message || 'Failed to update profile. Please try again.';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <Header title="Personal info" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={S.muted}>Please sign in to view your profile</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Header title="Personal info" />
      <View style={{ padding: 16, gap: 16 }}>
        {/* Name Field */}
        <View>
          <Text style={[S.muted, { marginBottom: 6 }]}>Name</Text>
          <TextInput
            style={S.input}
            value={name}
            onChangeText={setName}
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
            value={user.email}
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
            onChangeText={setPhone}
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
          style={{ marginTop: 16 }}
        />

        {saving && (
          <ActivityIndicator size="small" color={c.p} style={{ marginTop: 8 }} />
        )}
      </View>
    </View>
  );
}
