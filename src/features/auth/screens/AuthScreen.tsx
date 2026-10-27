import { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn } from '@/components';
import { c, S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthScreen({ navigation }: any) {
  const { signIn, signUp } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!isLogin && !name.trim()) return 'Vui lòng nhập họ tên';
    if (!EMAIL_RE.test(email.trim())) return 'Email không hợp lệ';
    if (password.length < 6) return 'Mật khẩu tối thiểu 6 ký tự';
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
    } catch (e: any) {
      setError(e?.message ?? 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const soon = (t: string) => Alert.alert(t, 'Coming soon');
  const Social = ({ t, col }: { t: string; col: string }) => (
    <Btn outline color={col} title={`Continue with ${t}`} onPress={() => soon(t)} style={{ marginBottom: 12 }} />
  );

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }} keyboardShouldPersistTaps="handled">
          <Text style={[S.h1, { marginTop: 24, fontSize: 22 }]}>{isLogin ? 'Log in' : 'Create an account'}</Text>

          <View style={{ marginTop: 32, gap: 12 }}>
            {!isLogin && (
              <TextInput value={name} onChangeText={setName} placeholder="Full name" autoCapitalize="words" style={S.input} />
            )}
            <TextInput value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={S.input} />
            {!isLogin && (
              <TextInput value={phone} onChangeText={setPhone} placeholder="Mobile number (optional)" keyboardType="phone-pad" style={S.input} />
            )}
            <View style={[S.row, S.input, { paddingVertical: 0 }]}>
              <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry={!showPw} autoCapitalize="none" style={{ flex: 1, paddingVertical: 12, fontSize: 16, color: c.t }} onSubmitEditing={submit} />
              <Pressable onPress={() => setShowPw(!showPw)} hitSlop={10}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.m} />
              </Pressable>
            </View>
          </View>

          {!!error && <Text style={{ color: '#D94A55', marginTop: 12 }}>{error}</Text>}

          <Btn title={loading ? 'Please wait…' : isLogin ? 'Log in' : 'Sign up'} onPress={submit} disabled={loading} style={{ marginTop: 18 }} />
          {loading && <ActivityIndicator style={{ marginTop: 10 }} color={c.p} />}

          <Text style={{ textAlign: 'center', marginVertical: 14 }}>or</Text>
          <Social t="Apple" col={c.t} />
          <Social t="Facebook" col="#3B9AE1" />
          <Social t="Google" col="#D94A55" />

          <Text style={{ textAlign: 'center', color: c.m, fontSize: 12, marginTop: 14 }}>
            By signing up, you agree to our <Text style={{ textDecorationLine: 'underline' }}>Terms of Service</Text> and <Text style={{ textDecorationLine: 'underline' }}>Privacy Policy.</Text>
          </Text>
          <View style={{ flex: 1 }} />
          <Pressable onPress={() => { setIsLogin(!isLogin); setError(''); }} style={{ alignItems: 'center', padding: 10 }}>
            <Text style={{ fontSize: 16 }}>
              {isLogin ? "Don't have an account?  " : 'Already had an account?  '}
              <Text style={{ color: '#3B9AE1', textDecorationLine: 'underline' }}>{isLogin ? 'Sign up' : 'Log in'}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
