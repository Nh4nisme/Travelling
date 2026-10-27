import { View, Text, Alert } from 'react-native';
import { Screen, Header } from '@/components';
import { SettingRow } from '../components/SettingRow';
import { c, S } from '@/constants/theme';

export function NotificationsScreen() {
  const handleTogglePress = () => {
    Alert.alert('Coming soon', 'This feature will be available in a future update.');
  };

  return (
    <Screen>
      <Header title="Notifications" />
      <View style={[S.pad, { flex: 1 }]}>
        <Text style={[S.muted, { marginVertical: 16 }]}>
          Coming soon
        </Text>
        <SettingRow
          label="Booking updates"
          type="toggle"
          isToggled={false}
          onToggle={handleTogglePress}
        />
        <SettingRow
          label="Promotions"
          type="toggle"
          isToggled={false}
          onToggle={handleTogglePress}
        />
        <SettingRow
          label="Messages"
          type="toggle"
          isToggled={false}
          onToggle={handleTogglePress}
        />
      </View>
    </Screen>
  );
}
