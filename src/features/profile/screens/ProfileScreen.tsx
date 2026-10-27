import { View, Text, Pressable, ScrollView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn } from '@/components';
import { c, S } from '@/constants/theme';
import { avatar } from '@/data/reviews';
import { useApp } from '@/store/AppContext';

export function ProfileScreen({ navigation }: any) {
  const { setLoggedIn, favs, bookings } = useApp();
  const items = [['person-outline', 'Personal info'], ['card-outline', 'Payments'], ['notifications-outline', 'Notifications'], ['help-circle-outline', 'Help center']] as const;
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <Image source={{ uri: avatar(32) }} style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: c.soft }} />
          <Text style={[S.h2, { marginTop: 12 }]}>Alex Nguyen</Text><Text style={S.muted}>+1 555 0100</Text>
          <Text style={[S.muted, { marginTop: 6 }]}>{favs.length} favorites · {bookings.length} bookings</Text>
        </View>
        {items.map(([ic, t]) => (
          <Pressable key={t} onPress={() => Alert.alert(t, 'Coming soon')} style={[S.between, { paddingVertical: 16, borderBottomWidth: 1, borderColor: c.soft }]}>
            <View style={[S.row, { gap: 12 }]}><Ionicons name={ic as any} size={22} /><Text style={{ fontSize: 16 }}>{t}</Text></View><Ionicons name="chevron-forward" size={18} color={c.m} />
          </Pressable>
        ))}
        <Btn outline color="#D94A55" title="Log out" style={{ marginTop: 28 }} onPress={() => { setLoggedIn(false); navigation.reset({ index: 0, routes: [{ name: 'Auth' }] }); }} />
      </ScrollView>
    </Screen>
  );
}
