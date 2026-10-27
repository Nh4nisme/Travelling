import { View, Text, Image } from 'react-native';
import { Screen } from '@/components';
import { c, S } from '@/constants/theme';
import { avatar } from '@/data/reviews';

export const MSG = [
  { n: 'Jinny Oslin', av: 12, t: 'Hi! Your check-in is at 14:00. Let me know if you need anything.', time: '2m' },
  { n: 'Travelling Support', av: 68, t: 'Welcome aboard! Complete your profile to get tips.', time: '1d' },
  { n: 'Chris Parker', av: 15, t: 'Thanks for staying with us, we left you a review.', time: '3d' },
];

export function InboxScreen() {
  return (
    <Screen>
      <Text style={[S.h1, { padding: 16 }]}>Inbox</Text>
      {MSG.map((m) => (
        <View key={m.n} style={[S.row, { padding: 16, gap: 12, borderBottomWidth: 1, borderColor: c.soft }]}>
          <Image source={{ uri: avatar(m.av) }} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.soft }} />
          <View style={{ flex: 1 }}><View style={S.between}><Text style={{ fontWeight: '700' }}>{m.n}</Text><Text style={S.muted}>{m.time}</Text></View><Text style={S.muted} numberOfLines={1}>{m.t}</Text></View>
        </View>
      ))}
    </Screen>
  );
}
