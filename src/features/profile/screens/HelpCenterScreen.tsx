import React from 'react';
import { View, Alert } from 'react-native';
import { Screen, Header } from '@/components';
import { MenuItem } from '../components/MenuItem';

export function HelpCenterScreen() {
  const handlePress = (section: string) => {
    Alert.alert('Coming Soon', `${section} feature is coming soon!`);
  };

  return (
    <Screen>
      <Header title="Help Center" />
      <View style={{ paddingHorizontal: 16 }}>
        <MenuItem
          icon="help-circle-outline"
          title="FAQ"
          onPress={() => handlePress('FAQ')}
        />
        <MenuItem
          icon="chatbubble-outline"
          title="Contact Support"
          onPress={() => handlePress('Contact Support')}
        />
        <MenuItem
          icon="warning-outline"
          title="Report a Problem"
          onPress={() => handlePress('Report a Problem')}
        />
      </View>
    </Screen>
  );
}
