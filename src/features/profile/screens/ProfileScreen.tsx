import { View, Text, ScrollView, Alert } from 'react-native';
import { Screen, Btn } from '@/components';
import { ProfileHeader } from '../components/ProfileHeader';
import { MenuItem } from '../components/MenuItem';
import { useApp } from '@/store/AppContext';

export function ProfileScreen({ navigation }: any) {
  const { user, signOut, favs, bookings } = useApp();

  const handleMenuItemPress = (screenName: string) => {
    // Trung tâm trợ giúp luôn truy cập được, kể cả khi chưa đăng nhập
    if (screenName === 'Help center') {
      navigation.navigate('HelpCenter');
      return;
    }

    if (!user) {
      navigation.navigate('Auth');
      return;
    }

    switch (screenName) {
      case 'Personal info':
        navigation.navigate('PersonalInfo');
        break;
      case 'Payments':
        navigation.navigate('Payments');
        break;
      case 'Notifications':
        navigation.navigate('Notifications');
        break;
      case 'Settings':
        navigation.navigate('Settings');
        break;
      default:
        Alert.alert(screenName, 'Coming soon');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <ProfileHeader
          user={user}
          favsCount={favs.length}
          bookingsCount={bookings.length}
        />

        <View style={{ marginTop: 8 }}>
          <MenuItem
            icon="person-outline"
            title="Personal info"
            onPress={() => handleMenuItemPress('Personal info')}
          />
          <MenuItem
            icon="card-outline"
            title="Payments"
            onPress={() => handleMenuItemPress('Payments')}
          />
          <MenuItem
            icon="notifications-outline"
            title="Notifications"
            onPress={() => handleMenuItemPress('Notifications')}
          />
          <MenuItem
            icon="help-circle-outline"
            title="Help center"
            onPress={() => handleMenuItemPress('Help center')}
          />
          <MenuItem
            icon="settings-outline"
            title="Settings"
            onPress={() => handleMenuItemPress('Settings')}
          />
        </View>

        <Btn
          outline
          color="#D94A55"
          title={user ? "Log out" : "Sign in"}
          style={{ marginTop: 28 }}
          onPress={user ? handleLogout : () => navigation.navigate('Auth')}
        />
      </ScrollView>
    </Screen>
  );
}
