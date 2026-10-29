import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen, AuthScreen } from '@/features/auth';
import { SearchScreen, ResultsScreen, FiltersScreen } from '@/features/search';
import { DetailScreen, FacilitiesScreen, ReviewsScreen, DescriptionScreen } from '@/features/listing';
import { ConfirmScreen, SuccessScreen } from '@/features/booking';
import { PersonalInfoScreen, PaymentsScreen, NotificationsScreen, HelpCenterScreen, SettingsScreen } from '@/features/profile';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="SearchModal" component={SearchScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="Filters" component={FiltersScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Detail" component={DetailScreen} />
        <Stack.Screen name="Facilities" component={FacilitiesScreen} />
        <Stack.Screen name="Reviews" component={ReviewsScreen} />
        <Stack.Screen name="Description" component={DescriptionScreen} />
        <Stack.Screen name="Confirm" component={ConfirmScreen} />
        <Stack.Screen name="Success" component={SuccessScreen} options={{ gestureEnabled: false }} />
        
        {/* Profile sub-screens */}
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} options={{ headerShown: true, title: 'Personal info' }} />
        <Stack.Screen name="Payments" component={PaymentsScreen} options={{ headerShown: true, title: 'Payments' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true, title: 'Notifications' }} />
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ headerShown: true, title: 'Help Center' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Settings' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
