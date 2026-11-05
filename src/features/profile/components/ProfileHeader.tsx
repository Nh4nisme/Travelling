import { View, Text, Image, StyleSheet } from 'react-native';
import { avatar } from '@/data/reviews';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import type { User } from '@/store/types';

type ProfileHeaderProps = {
  user: User | null;
  favsCount: number;
  bookingsCount: number;
};

export function ProfileHeader({ user, favsCount, bookingsCount }: ProfileHeaderProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const avatarSeed = user?.id ? parseInt(user.id, 10) || 32 : 32;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: avatar(avatarSeed) }}
        style={[styles.avatar, { backgroundColor: colors.soft }]}
      />
      <Text style={[styles.name, { color: colors.text }]}>
        {user?.name ?? 'Guest'}
      </Text>
      {user ? (
        <>
          <Text style={{ color: colors.muted, fontSize: 14 }}>{user.email}</Text>
          {!!user.phone && <Text style={{ color: colors.muted, fontSize: 14 }}>{user.phone}</Text>}
        </>
      ) : (
        <Text style={{ color: colors.muted, fontSize: 14 }}>{t.profile.signIn}</Text>
      )}
      <Text style={[styles.counts, { color: colors.muted }]}>
        {favsCount} {t.profile.propertiesViewed.toLowerCase()} · {bookingsCount} {t.profile.tripsBooked.toLowerCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  name: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
  },
  counts: {
    marginTop: 6,
    fontSize: 13,
  },
});
