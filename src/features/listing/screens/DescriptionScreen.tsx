import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Photo } from '@/components';
import { c, S } from '@/constants/theme';
import { IMG } from '@/data/images';
import { listingService } from '@/services/listingService';
import { getListing } from '@/features/listing/components/shared';

export function DescriptionScreen({ route }: any) {
  const l = route.params?.id ? getListing(route) : listingService.getById('4');
  return (
    <Screen><Header title="Description" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Photo uri={IMG.pool} style={{ height: 200, borderRadius: 8 }} />
        <Text style={{ marginTop: 16, lineHeight: 24, color: '#555' }}>{l.desc}</Text>
        <View style={[S.between, { marginVertical: 20 }]}><View style={[S.row, { gap: 6 }]}><Ionicons name="location" color={c.p} size={18} /><Text>{l.city}, {l.country}</Text></View><Text style={{ color: c.p, textDecorationLine: 'underline' }}>Open map</Text></View>
        {['Walk to the beach in minutes', 'Fresh linens and towels included', 'Quiet street, private parking nearby'].map((t) => <View key={t} style={[S.row, { gap: 10, marginVertical: 8 }]}><Ionicons name="checkmark" size={16} /><Text style={{ fontSize: 16, color: '#555' }}>{t}</Text></View>)}
      </ScrollView>
    </Screen>
  );
}
