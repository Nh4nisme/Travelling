import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '@/features/home';
import { FavoritesScreen } from '@/features/favorites';
import { BookingsScreen } from '@/features/bookings';
import { InboxScreen } from '@/features/inbox';
import { ProfileScreen } from '@/features/profile';
import { useInbox } from '@/features/inbox/context/InboxContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { unreadCount } = useInbox();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const tabConfigs: Record<keyof MainTabParamList, { icon: string; label: string }> = {
    Search: { icon: 'search', label: t.tabs.search },
    Favorites: { icon: 'heart', label: t.tabs.favorites },
    Bookings: { icon: 'grid', label: t.tabs.bookings },
    Inbox: { icon: 'chatbox-ellipses', label: t.tabs.inbox },
    Profile: { icon: 'person-circle', label: t.tabs.profile },
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabel: tabConfigs[route.name]?.label ?? route.name,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ color, size, focused }) => {
          const baseIcon = tabConfigs[route.name]?.icon ?? 'cube';
          return (
            <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons
                name={(baseIcon + (focused ? '' : '-outline')) as any}
                size={size}
                color={color}
              />
              {route.name === 'Inbox' && unreadCount > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -4,
                    width: 9,
                    height: 9,
                    borderRadius: 4.5,
                    backgroundColor: '#FF3B30',
                    borderWidth: 1.5,
                    borderColor: colors.card,
                  }}
                />
              ) : null}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Search" component={HomeScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
