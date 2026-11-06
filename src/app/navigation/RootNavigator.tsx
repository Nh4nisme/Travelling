import { useMemo } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen, AuthScreen } from '@/features/auth';
import { SearchScreen, ResultsScreen, FiltersScreen } from '@/features/search';
import { DetailScreen, FacilitiesScreen, ReviewsScreen, DescriptionScreen, MapScreen } from '@/features/listing';
import { BookingDatesScreen, ConfirmScreen, SuccessScreen } from '@/features/booking';
import { BookingDetailScreen } from '@/features/bookings';
import {
  PersonalInfoScreen,
  PaymentsScreen,
  NotificationsScreen,
  HelpCenterScreen,
  FaqScreen,
  ContactSupportScreen,
  ReportProblemScreen,
  SettingsScreen,
  PaymentPinScreen,
  ChangePasswordScreen,
} from '@/features/profile';
import { MainTabs } from './MainTabs';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors, isDark } = useTheme();
  const { t, isVietnamese } = useLanguage();

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.bg,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
      },
    };
  }, [isDark, colors]);

  const defaultHeaderOptions = {
    headerShown: true,
    headerStyle: { backgroundColor: colors.card },
    headerTintColor: colors.text,
    headerTitleStyle: { color: colors.text, fontWeight: '700' as const },
    headerShadowVisible: false,
  };

  return (
    <NavigationContainer theme={navigationTheme}>
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
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="BookingDates" component={BookingDatesScreen} />
        <Stack.Screen name="Confirm" component={ConfirmScreen} />
        <Stack.Screen name="Success" component={SuccessScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
        
        {/* Profile sub-screens */}
        <Stack.Screen
          name="PersonalInfo"
          component={PersonalInfoScreen}
          options={{ ...defaultHeaderOptions, title: t.profile.personalInfo }}
        />
        <Stack.Screen
          name="Payments"
          component={PaymentsScreen}
          options={{ ...defaultHeaderOptions, title: t.profile.payments }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ ...defaultHeaderOptions, title: t.profile.notifications }}
        />
        {/* Help Center tự vẽ <Header /> nên không bật header native */}
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
        <Stack.Screen name="Faq" component={FaqScreen} />
        <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
        <Stack.Screen name="ReportProblem" component={ReportProblemScreen} />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ ...defaultHeaderOptions, title: t.settings.title }}
        />
        <Stack.Screen
          name="PaymentPin"
          component={PaymentPinScreen}
          options={{ ...defaultHeaderOptions, title: isVietnamese ? 'Mã PIN thanh toán' : 'Payment PIN' }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ ...defaultHeaderOptions, title: isVietnamese ? 'Đổi mật khẩu' : 'Change Password' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
