import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components';
import { S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';

export function SplashScreen({ navigation }: any) {
  const { loggedIn, authReady } = useApp();
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMinElapsed(true), 1200); return () => clearTimeout(t); }, []);

  // Chờ cả hiệu ứng splash lẫn việc kiểm tra token xong rồi mới điều hướng
  useEffect(() => {
    if (authReady && minElapsed) navigation.replace(loggedIn ? 'Main' : 'Auth');
  }, [authReady, minElapsed, loggedIn]);

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
