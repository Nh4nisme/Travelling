import { View, ScrollView, Alert } from 'react-native';
import { Screen, Btn } from '@/components';
import { ProfileHeader } from '../components/ProfileHeader';
import { MenuItem } from '../components/MenuItem';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export function ProfileScreen({ navigation }: any) {
  const { user, signOut, favs, bookings } = useApp();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const handleMenuItemPress = (screenName: string) => {
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
          bookingsCount={bookings.filter((b) => b.status === 'confirmed').length}
        />

        <View style={{ marginTop: 8 }}>
          <MenuItem
            icon="person-outline"
            title={t.profile.personalInfo}
            onPress={() => handleMenuItemPress('Personal info')}
          />
          <MenuItem
            icon="card-outline"
            title={t.profile.payments}
            onPress={() => handleMenuItemPress('Payments')}
          />
          <MenuItem
            icon="notifications-outline"
            title={t.profile.notifications}
            onPress={() => handleMenuItemPress('Notifications')}
          />
          <MenuItem
            icon="help-circle-outline"
            title={t.profile.helpCenter}
            onPress={() => handleMenuItemPress('Help center')}
          />
          <MenuItem
            icon="settings-outline"
            title={t.profile.settings}
            onPress={() => handleMenuItemPress('Settings')}
          />
        </View>

        <Btn
          outline
          color={colors.danger}
          title={user ? t.profile.logOut : t.profile.signIn}
          style={{ marginTop: 28, borderColor: colors.border }}
          onPress={user ? handleLogout : () => navigation.navigate('Auth')}
        />
      </ScrollView>
    </Screen>
  );
}
