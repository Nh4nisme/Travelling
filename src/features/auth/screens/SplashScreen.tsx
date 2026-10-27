import { useEffect } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components';
import { S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';

export function SplashScreen({ navigation }: any) {
  const { loggedIn } = useApp();
  useEffect(() => { const t = setTimeout(() => navigation.replace(loggedIn ? 'Main' : 'Auth'), 1200); return () => clearTimeout(t); }, []);
  return (
    <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={S.row}>
        <View style={{ width: 28, height: 62, backgroundColor: '#00BCD4', borderTopLeftRadius: 14, borderBottomRightRadius: 24, borderBottomLeftRadius: 6 }} />
        <View style={{ marginLeft: 8 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#8B5CE0' }} />
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#3F6AE8', marginTop: 6 }} />
        </View>
      </View>
    </Screen>
  );
}
