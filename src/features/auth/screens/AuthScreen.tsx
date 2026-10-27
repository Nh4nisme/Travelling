import { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn } from '@/components';
import { c, S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';

export function AuthScreen({ navigation }: any) {
  const { setLoggedIn } = useApp();
  const [login, setLogin] = useState(false);
  const [phone, setPhone] = useState('');
  const go = () => { setLoggedIn(true); navigation.replace('Main'); };
  const Social = ({ t, col, icon }: { t: string; col: string; icon: any }) => (
    <Btn outline color={col} title={`Continue with ${t}`} onPress={go} style={{ marginBottom: 12 }} icon={undefined} />
  );
  return (
    <Screen>
      <View style={{ flex: 1, padding: 20 }}>
        <Text style={[S.h1, { marginTop: 24, fontSize: 22 }]}>{login ? 'Log in' : 'Create an account'}</Text>
        <Text style={{ fontSize: 17, marginTop: 48, marginBottom: 12 }}>Enter your mobile number:</Text>
        <View style={[S.row, { gap: 10 }]}>
          <View style={[S.row, { backgroundColor: c.soft, borderRadius: 10, padding: 14, gap: 8 }]}><Text style={{ fontSize: 22 }}>🇺🇸</Text><Ionicons name="chevron-down" size={16} /></View>
          <TextInput value={phone} onChangeText={setPhone} placeholder="+1 Mobile number" keyboardType="phone-pad" style={[S.input, { flex: 1 }]} />
        </View>
        <Btn title="Continue" onPress={go} disabled={phone.length > 0 && phone.length < 6} style={{ marginTop: 14 }} />
        <Text style={{ textAlign: 'center', marginVertical: 14 }}>or</Text>
        <Social t="Apple" col={c.t} icon="logo-apple" />
        <Social t="Facebook" col="#3B9AE1" icon="logo-facebook" />
        <Social t="Google" col="#D94A55" icon="logo-google" />
        <Text style={{ textAlign: 'center', color: c.m, fontSize: 12, marginTop: 14 }}>By signing up, you agree to our <Text style={{ textDecorationLine: 'underline' }}>Terms of Service</Text> and <Text style={{ textDecorationLine: 'underline' }}>Privacy Policy.</Text></Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => setLogin(!login)} style={{ alignItems: 'center', padding: 10 }}>
          <Text style={{ fontSize: 16 }}>{login ? "Don't have an account?  " : 'Already had an account?  '}<Text style={{ color: '#3B9AE1', textDecorationLine: 'underline' }}>{login ? 'Sign up' : 'Log in'}</Text></Text>
        </Pressable>
      </View>
    </Screen>
  );
}
