import { View, Text } from 'react-native';
import type { BookingStage } from '@/store/types';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

export const StatusBadge = ({ stage }: { stage: BookingStage }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const badgeColors: Record<BookingStage, { fg: string; bg: string }> = isDark
    ? {
        upcoming: { fg: '#80DEEA', bg: '#0A3338' },
        ongoing: { fg: '#86EFAC', bg: '#064E3B' },
        completed: { fg: '#D1D5DB', bg: '#374151' },
        cancelled: { fg: '#FCA5A5', bg: '#451A1A' },
      }
    : {
        upcoming: { fg: '#0A7F8F', bg: '#DDF7FA' },
        ongoing: { fg: '#1B7F43', bg: '#DDF6E6' },
        completed: { fg: '#5B6170', bg: '#EEF0F3' },
        cancelled: { fg: '#B3323D', bg: '#FDE7E9' },
      };

  const label = (t.bookings.stages as Record<string, string>)?.[stage] ?? stage;

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: badgeColors[stage].bg,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
      }}
    >
      <Text style={{ color: badgeColors[stage].fg, fontSize: 12, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
};
