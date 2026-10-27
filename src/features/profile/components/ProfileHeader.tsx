import { View, Text, Image, StyleSheet } from 'react-native';
import { c, S } from '@/constants/theme';
import { avatar } from '@/data/reviews';
import type { User } from '@/store/types';

type ProfileHeaderProps = {
  user: User | null;
  favsCount: number;
  bookingsCount: number;
};

export function ProfileHeader({ user, favsCount, bookingsCount }: ProfileHeaderProps) {
  const avatarSeed = user?.id ? parseInt(user.id, 10) || 32 : 32;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: avatar(avatarSeed) }}
        style={styles.avatar}
      />
      <Text style={[S.h2, styles.name]}>{user?.name ?? 'Guest'}</Text>
      {user ? (
        <>
          <Text style={S.muted}>{user.email}</Text>
          {!!user.phone && <Text style={S.muted}>{user.phone}</Text>}
        </>
      ) : (
        <Text style={S.muted}>Tap below to log in</Text>
      )}
      <Text style={[S.muted, styles.counts]}>
        {favsCount} favorites · {bookingsCount} bookings
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
    backgroundColor: c.soft,
  },
  name: {
    marginTop: 12,
  },
  counts: {
    marginTop: 6,
  },
});
