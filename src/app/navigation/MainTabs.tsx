import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { c } from '@/constants/theme';
import { HomeScreen } from '@/features/home';
import { FavoritesScreen } from '@/features/favorites';
import { BookingsScreen } from '@/features/bookings';
import { InboxScreen } from '@/features/inbox';
import { ProfileScreen } from '@/features/profile';
import { useInbox } from '@/features/inbox/context/InboxContext';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const TABS: Record<keyof MainTabParamList, [string, string]> = {
  Search: ['search', 'Search'],
  Favorites: ['heart', 'My lists'],
  Bookings: ['grid', 'Booking'],
  Inbox: ['chatbox-ellipses', 'Inbox'],
  Profile: ['person-circle', 'Profile'],
};

export function MainTabs() {
  const { unreadCount } = useInbox();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.p,
        tabBarInactiveTintColor: c.t,
        tabBarLabel: TABS[route.name][1],
        tabBarLabelStyle: { fontSize: 11 },
        tabBarIcon: ({ color, size, focused }) => (
          <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons
              name={(TABS[route.name][0] + (focused ? '' : '-outline')) as any}
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
                  borderColor: '#fff',
                }}
              />
            ) : null}
          </View>
        ),
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
