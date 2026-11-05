import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn } from '@/components';
import { S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { ApiError } from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthScreen({ navigation }: any) {
  const { signIn, signUp } = useApp();
  const { colors } = useTheme();
  const { isVietnamese } = useLanguage();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!isLogin && !name.trim()) {
      return isVietnamese ? 'Vui lòng nhập họ tên' : 'Please enter your full name';
    }
    if (!EMAIL_RE.test(email.trim())) {
      return isVietnamese ? 'Email không hợp lệ' : 'Invalid email address';
    }
    if (password.length < 6) {
      return isVietnamese ? 'Mật khẩu tối thiểu 6 ký tự' : 'Password must be at least 6 characters';
    }
    return '';
  };

  const submit = async () => {
    const msg = validate();
    if (msg) return setError(msg);
    setError('');
    setLoading(true);
    try {
      if (isLogin) await signIn(email, password);
      else await signUp({ name, email, password, phone: phone.trim() });
      navigation.replace('Main');
    } catch (e) {
      setError(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : isVietnamese
          ? 'Đã có lỗi xảy ra'
          : 'An error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  const soon = (t: string) =>
    Alert.alert(t, isVietnamese ? 'Tính năng sắp ra mắt' : 'Coming soon');

  const Social = ({ t, col }: { t: string; col: string }) => (
    <Btn
      outline
      color={col}
      title={`${isVietnamese ? 'Tiếp tục với ' : 'Continue with '}${t}`}
      onPress={() => soon(t)}
      style={{ marginBottom: 12 }}
    />
  );

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={{
              marginTop: 24,
              fontSize: 24,
              fontWeight: '700',
              color: colors.text,
            }}
          >
            {isLogin
              ? isVietnamese
                ? 'Đăng nhập'
                : 'Log in'
              : isVietnamese
              ? 'Tạo tài khoản'
              : 'Create an account'}
          </Text>

          <View style={{ marginTop: 28, gap: 14 }}>
            {!isLogin && (
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={isVietnamese ? 'Họ và tên' : 'Full name'}
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
                style={inputStyle}
              />
            )}
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={inputStyle}
            />
            {!isLogin && (
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder={isVietnamese ? 'Số điện thoại (không bắt buộc)' : 'Mobile number (optional)'}
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                style={inputStyle}
              />
            )}
            <View
              style={[
                S.row,
                inputStyle,
                { paddingVertical: 0, justifyContent: 'space-between' },
              ]}
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={isVietnamese ? 'Mật khẩu' : 'Password'}
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                style={{ flex: 1, paddingVertical: 12, fontSize: 16, color: colors.text }}
                onSubmitEditing={submit}
              />
              <Pressable onPress={() => setShowPw(!showPw)} hitSlop={10}>
                <Ionicons
                  name={showPw ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            </View>
          </View>

          {!!error && <Text style={{ color: colors.danger, marginTop: 12 }}>{error}</Text>}

          <Btn
            title={
              loading
                ? isVietnamese
                  ? 'Vui lòng chờ…'
                  : 'Please wait…'
                : isLogin
                ? isVietnamese
                  ? 'Đăng nhập'
                  : 'Log in'
                : isVietnamese
                ? 'Đăng ký'
                : 'Sign up'
            }
            onPress={submit}
            disabled={loading}
            style={{ marginTop: 20 }}
          />
          {loading && <ActivityIndicator style={{ marginTop: 10 }} color={colors.primary} />}

          <Text style={{ textAlign: 'center', marginVertical: 16, color: colors.muted }}>
            {isVietnamese ? 'hoặc' : 'or'}
          </Text>
          <Social t="Apple" col={colors.text} />
          <Social t="Facebook" col="#3B9AE1" />
          <Social t="Google" col="#D94A55" />

          <Text
            style={{
              textAlign: 'center',
              color: colors.muted,
              fontSize: 12,
              marginTop: 14,
              lineHeight: 18,
            }}
          >
            {isVietnamese
              ? 'Bằng việc đăng ký, bạn đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư của chúng tôi.'
              : 'By signing up, you agree to our Terms of Service and Privacy Policy.'}
          </Text>

          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{ alignItems: 'center', padding: 12 }}
          >
            <Text style={{ fontSize: 15, color: colors.muted }}>
              {isLogin
                ? isVietnamese
                  ? 'Chưa có tài khoản?  '
                  : "Don't have an account?  "
                : isVietnamese
                ? 'Đã có tài khoản?  '
                : 'Already had an account?  '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                {isLogin
                  ? isVietnamese
                    ? 'Đăng ký'
                    : 'Sign up'
                  : isVietnamese
                  ? 'Đăng nhập'
                  : 'Log in'}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
