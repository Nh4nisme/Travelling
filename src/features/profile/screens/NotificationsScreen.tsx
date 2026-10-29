import { View, Text, Alert } from 'react-native';

import { SettingRow } from '../components/SettingRow';
import { c, S } from '@/constants/theme';

export function NotificationsScreen() {
  const handleTogglePress = () => {
    Alert.alert('Coming soon', 'This feature will be available in a future update.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>

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
    </View>
  );
}
