import React, { useState, useEffect } from 'react';
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
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn } from '@/components';
import { PaymentPinInput } from '@/components/PaymentPinInput';
import { useApp } from '@/store/AppContext';
import { authService } from '@/services/authService';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterStep = 'email' | 'otp' | 'details';

export function AuthScreen({ navigation }: any) {
  const { signIn, signUp } = useApp();
  const { colors } = useTheme();
  const { isVietnamese } = useLanguage();

  // Theo đặc tả UC01: Mặc định hiển thị màn hình Create an account (Đăng ký)
  const [isLogin, setIsLogin] = useState(false);
  const [step, setStep] = useState<RegisterStep>('email');

  // Form states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Status & Timing states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestLogin, setSuggestLogin] = useState(false);
  const [timer, setTimer] = useState(60);

  // Countdown timer cho việc gửi lại OTP
  useEffect(() => {
    let interval: any;
    if (!isLogin && step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLogin, step, timer]);

  // Luồng 3, 4, 5: Kiểm tra Email và gửi OTP
  const handleCheckEmail = async () => {
    const trimmed = email.trim();

    // Luồng ngoại lệ 2a: Email không đúng định dạng
    if (!EMAIL_RE.test(trimmed)) {
      setError(
        isVietnamese
          ? 'Email không đúng định dạng. Vui lòng nhập lại email.'
          : 'Invalid email address. Please enter a valid email.'
      );
      setSuggestLogin(false);
      return;
    }

    setError('');
    setSuggestLogin(false);
    setLoading(true);

    try {
      // Luồng 4: Kiểm tra email đã được đăng ký hay chưa
      const check = await authService.checkEmail(trimmed);

      // Luồng ngoại lệ 3a: Email đã được đăng ký -> đề xuất chuyển sang Đăng nhập
      if (check.exists) {
        setError(
          isVietnamese
            ? 'Email này đã được đăng ký tài khoản.'
            : 'This email is already registered.'
        );
        setSuggestLogin(true);
        return;
      }

      // Luồng 5: Email hợp lệ và chưa tồn tại -> gửi OTP
      const res = await authService.sendOtp(trimmed);
      setStep('otp');
      setTimer(60);
      setOtp('');

      // Thông báo đã gửi email
      Alert.alert(
        isVietnamese ? 'Mã xác thực đã được gửi' : 'Verification Code Sent',
        isVietnamese
          ? `Vui lòng kiểm tra email ${trimmed} để lấy mã OTP.`
          : `Please check ${trimmed} for your OTP code.`,
        [{ text: 'OK' }]
      );
    } catch (e: any) {
      // Luồng ngoại lệ 4a: Không thể gửi OTP
      setError(
        e?.message ||
          (isVietnamese
            ? 'Không thể gửi mã xác thực. Vui lòng thử lại.'
            : 'Failed to send OTP code. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  // Luồng 6, 7: Xác thực mã OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length !== 6) {
      setError(
        isVietnamese
          ? 'Vui lòng nhập đủ 6 chữ số mã OTP'
          : 'Please enter all 6 digits of the OTP'
      );
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await authService.verifyOtp(email.trim(), code);
      if (res.verified && res.verificationToken) {
        setVerificationToken(res.verificationToken);
        setStep('details');
      }
    } catch (e: any) {
      // Luồng ngoại lệ 5a, 5b, 5c: OTP không đúng, hết hạn hoặc bị tạm khóa
      setError(
        e?.message ||
          (isVietnamese
            ? 'Mã OTP không chính xác hoặc đã hết hạn.'
            : 'Invalid or expired OTP code.')
      );
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (timer > 0 || loading) return;
    setError('');
    setLoading(true);

    try {
      await authService.sendOtp(email.trim());
      setTimer(60);
      setOtp('');
      
      Alert.alert(
        isVietnamese ? 'Đã gửi lại mã OTP' : 'OTP Resent',
        isVietnamese
          ? 'Vui lòng kiểm tra email của bạn.'
          : 'Please check your email.',
        [{ text: 'OK' }]
      );
    } catch (e: any) {
      setError(
        e?.message ||
          (isVietnamese
            ? 'Không thể gửi lại mã OTP. Vui lòng thử lại.'
            : 'Failed to resend OTP. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  // Luồng 8 & 9: Hoàn tất tạo tài khoản mới & Chuyển đến Home
  const handleCompleteRegister = async () => {
    if (!name.trim()) {
      setError(isVietnamese ? 'Vui lòng nhập họ và tên' : 'Please enter your full name');
      return;
    }
    if (password.length < 6) {
      setError(
        isVietnamese
          ? 'Mật khẩu phải có tối thiểu 6 ký tự'
          : 'Password must be at least 6 characters'
      );
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        verificationToken,
      });

      // Luồng 9: Ứng dụng chuyển người dùng đến màn hình Home
      navigation.replace('Main');
    } catch (e: any) {
      setError(e?.message || (isVietnamese ? 'Đã có lỗi xảy ra' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  // Đăng nhập tài khoản
  const handleLogin = async () => {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError(isVietnamese ? 'Email không hợp lệ' : 'Invalid email address');
      return;
    }
    if (!password) {
      setError(isVietnamese ? 'Vui lòng nhập mật khẩu' : 'Please enter your password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signIn(trimmed, password);
      navigation.replace('Main');
    } catch (e: any) {
      setError(
        e?.message ||
          (isVietnamese
            ? 'Email hoặc mật khẩu không chính xác'
            : 'Incorrect email or password')
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
    borderRadius: 12,
    padding: 14,
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
          {/* Back button khi đang ở các bước phụ của Đăng ký */}
          {!isLogin && step !== 'email' && (
            <Pressable
              onPress={() => {
                setError('');
                if (step === 'details') setStep('otp');
                else setStep('email');
              }}
              hitSlop={10}
              style={{ alignSelf: 'flex-start', marginTop: 12, marginBottom: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
          )}

          {/* Tiêu đề màn hình */}
          <View style={{ marginTop: isLogin || step === 'email' ? 24 : 8 }}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '700',
                color: colors.text,
              }}
            >
              {isLogin
                ? isVietnamese
                  ? 'Đăng nhập'
                  : 'Log in'
                : step === 'email'
                ? isVietnamese
                  ? 'Tạo tài khoản'
                  : 'Create an account'
                : step === 'otp'
                ? isVietnamese
                  ? 'Xác thực Email'
                  : 'Verify your email'
                : isVietnamese
                ? 'Hoàn tất hồ sơ'
                : 'Complete your profile'}
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: colors.muted,
                marginTop: 6,
                lineHeight: 20,
              }}
            >
              {isLogin
                ? isVietnamese
                  ? 'Chào mừng bạn quay trở lại Travelling.'
                  : 'Welcome back to Travelling.'
                : step === 'email'
                ? isVietnamese
                  ? 'Nhập địa chỉ email của bạn để bắt đầu đăng ký.'
                  : 'Enter your email address to get started.'
                : step === 'otp'
                ? isVietnamese
                  ? `Mã xác thực 6 số đã được gửi đến ${email}.`
                  : `Enter the 6-digit code sent to ${email}.`
                : isVietnamese
                ? 'Thiết lập họ tên và mật khẩu để bắt đầu khám phá.'
                : 'Set your name and password to start exploring.'}
            </Text>
          </View>

          {/* ==================== PHẦN FORM HIỂN THỊ THEO TRẠNG THÁI ==================== */}

          {/* 1. MÀN HÌNH ĐĂNG NHẬP (isLogin === true) */}
          {isLogin && (
            <View style={{ marginTop: 28, gap: 14 }}>
              <TextInput
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  setError('');
                }}
                placeholder="Email"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={inputStyle}
              />
              <View
                style={[
                  inputStyle,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 4,
                  },
                ]}
              >
                <TextInput
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setError('');
                  }}
                  placeholder={isVietnamese ? 'Mật khẩu' : 'Password'}
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  style={{ flex: 1, paddingVertical: 10, fontSize: 16, color: colors.text }}
                  onSubmitEditing={handleLogin}
                />
                <Pressable onPress={() => setShowPw(!showPw)} hitSlop={10}>
                  <Ionicons
                    name={showPw ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              </View>

              {!!error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#ef4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Btn
                title={
                  loading
                    ? isVietnamese
                      ? 'Đang đăng nhập…'
                      : 'Logging in…'
                    : isVietnamese
                    ? 'Đăng nhập'
                    : 'Log in'
                }
                onPress={handleLogin}
                disabled={loading}
                style={{ marginTop: 10 }}
              />
            </View>
          )}

          {/* 2. LUỒNG ĐĂNG KÝ BƯỚC 1: NHẬP EMAIL (UC01: Luồng sự kiện chính 1 - 5) */}
          {!isLogin && step === 'email' && (
            <View style={{ marginTop: 28, gap: 14 }}>
              <TextInput
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  setError('');
                  setSuggestLogin(false);
                }}
                placeholder="Email"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={inputStyle}
                onSubmitEditing={handleCheckEmail}
              />

              {/* Thông báo lỗi */}
              {!!error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#ef4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Luồng ngoại lệ 3a: Đề xuất chuyển sang Đăng nhập nếu email đã tồn tại */}
              {suggestLogin && (
                <Pressable
                  onPress={() => {
                    setIsLogin(true);
                    setError('');
                    setSuggestLogin(false);
                  }}
                  style={[
                    styles.suggestBox,
                    { backgroundColor: colors.soft, borderColor: colors.primary },
                  ]}
                >
                  <Ionicons name="log-in-outline" size={20} color={colors.primary} />
                  <Text style={{ flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' }}>
                    {isVietnamese
                      ? 'Chuyển sang Đăng nhập với email này'
                      : 'Switch to Log in with this email'}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                </Pressable>
              )}

              {/* Nút Continue theo đặc tả */}
              <Btn
                title={
                  loading
                    ? isVietnamese
                      ? 'Đang kiểm tra…'
                      : 'Checking…'
                    : isVietnamese
                    ? 'Tiếp tục'
                    : 'Continue'
                }
                onPress={handleCheckEmail}
                disabled={loading}
                style={{ marginTop: 6 }}
              />
            </View>
          )}

          {/* 3. LUỒNG ĐĂNG KÝ BƯỚC 2: NHẬP MÃ OTP (UC01: Luồng sự kiện chính 6 - 7) */}
          {!isLogin && step === 'otp' && (
            <View style={{ marginTop: 32, gap: 20 }}>
              <PaymentPinInput
                value={otp}
                onChangeText={(val) => {
                  setOtp(val);
                  setError('');
                }}
                onComplete={(fullCode) => {
                  void handleVerifyOtp(fullCode);
                }}
                autoFocus={true}
              />

              {/* Thông báo lỗi OTP (5a, 5b, 5c) */}
              {!!error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#ef4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Countdown & Nút gửi lại mã */}
              <View style={{ alignItems: 'center', marginTop: 4 }}>
                {timer > 0 ? (
                  <Text style={{ color: colors.muted, fontSize: 14 }}>
                    {isVietnamese ? 'Gửi lại mã sau ' : 'Resend code in '}
                    <Text style={{ fontWeight: '700', color: colors.primary }}>
                      {timer}s
                    </Text>
                  </Text>
                ) : (
                  <Pressable
                    onPress={handleResendOtp}
                    hitSlop={8}
                    style={{ paddingVertical: 4 }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>
                      {isVietnamese ? 'Gửi lại mã OTP' : 'Resend OTP Code'}
                    </Text>
                  </Pressable>
                )}
              </View>

              <Btn
                title={
                  loading
                    ? isVietnamese
                      ? 'Đang xác thực…'
                      : 'Verifying…'
                    : isVietnamese
                    ? 'Xác nhận mã OTP'
                    : 'Verify Code'
                }
                onPress={() => handleVerifyOtp()}
                disabled={loading || otp.length !== 6}
                style={{ marginTop: 8 }}
              />
            </View>
          )}

          {/* 4. LUỒNG ĐĂNG KÝ BƯỚC 3: HOÀN TẤT HỒ SƠ (UC01: Luồng sự kiện chính 8 - 9) */}
          {!isLogin && step === 'details' && (
            <View style={{ marginTop: 24, gap: 14 }}>
              {/* Badge Email đã xác thực */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: '#f0fdf4',
                  borderWidth: 1,
                  borderColor: '#bbf7d0',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 6,
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={{ fontSize: 14, color: '#15803d', fontWeight: '600', flex: 1 }}>
                  {email} ({isVietnamese ? 'Đã xác thực OTP' : 'Verified'})
                </Text>
              </View>

              <TextInput
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  setError('');
                }}
                placeholder={isVietnamese ? 'Họ và tên *' : 'Full name *'}
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
                style={inputStyle}
              />

              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder={
                  isVietnamese
                    ? 'Số điện thoại (không bắt buộc)'
                    : 'Mobile number (optional)'
                }
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                style={inputStyle}
              />

              <View
                style={[
                  inputStyle,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 4,
                  },
                ]}
              >
                <TextInput
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setError('');
                  }}
                  placeholder={isVietnamese ? 'Mật khẩu (tối thiểu 6 ký tự) *' : 'Password (min. 6 chars) *'}
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  style={{ flex: 1, paddingVertical: 10, fontSize: 16, color: colors.text }}
                  onSubmitEditing={handleCompleteRegister}
                />
                <Pressable onPress={() => setShowPw(!showPw)} hitSlop={10}>
                  <Ionicons
                    name={showPw ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              </View>

              {!!error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#ef4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Btn
                title={
                  loading
                    ? isVietnamese
                      ? 'Đang tạo tài khoản…'
                      : 'Creating account…'
                    : isVietnamese
                    ? 'Hoàn tất đăng ký'
                    : 'Complete Registration'
                }
                onPress={handleCompleteRegister}
                disabled={loading}
                style={{ marginTop: 10 }}
              />
            </View>
          )}

          {/* Social login chỉ hiển thị ở màn hình Login hoặc Step 1 của Register */}
          {(isLogin || step === 'email') && (
            <>
              <Text style={{ textAlign: 'center', marginVertical: 18, color: colors.muted }}>
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
                  ? 'Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư của chúng tôi.'
                  : 'By continuing, you agree to our Terms of Service and Privacy Policy.'}
              </Text>
            </>
          )}

          <View style={{ flex: 1 }} />

          {/* Toggle chuyển đổi giữa Đăng nhập và Đăng ký */}
          <Pressable
            onPress={() => {
              setIsLogin(!isLogin);
              setStep('email');
              setError('');
              setSuggestLogin(false);
            }}
            style={{ alignItems: 'center', paddingVertical: 16 }}
          >
            <Text style={{ fontSize: 15, color: colors.muted }}>
              {isLogin
                ? isVietnamese
                  ? 'Chưa có tài khoản?  '
                  : "Don't have an account?  "
                : isVietnamese
                ? 'Đã có tài khoản?  '
                : 'Already have an account?  '}
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

const styles = StyleSheet.create({
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    flex: 1,
    fontWeight: '500',
  },
  suggestBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
});
