import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Photo } from '@/components';
import { c, S } from '@/constants/theme';
import { ListingState, useListing } from '@/features/listing/components/shared';
import { useApp } from '@/store/AppContext';

export function DescriptionScreen({ route }: any) {
  const l = useListing(route.params?.id ?? '');
  const { listingsLoading, listingsError, refreshListings } = useApp();
  if (!l) return <Screen><ListingState loading={listingsLoading} error={listingsError} onRetry={() => void refreshListings()} /></Screen>;
  return (
    <Screen><Header title="Description" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Photo uri={l.images[0]} style={{ height: 200, borderRadius: 8 }} />
        <Text style={{ marginTop: 16, lineHeight: 24, color: '#555' }}>{l.desc}</Text>
        <View style={[S.between, { marginVertical: 20 }]}><View style={[S.row, { gap: 6 }]}><Ionicons name="location" color={c.p} size={18} /><Text>{l.city}, {l.country}</Text></View><Text style={{ color: c.p, textDecorationLine: 'underline' }}>Open map</Text></View>
        {l.facilities.map((facility) => <View key={facility} style={[S.row, { gap: 10, marginVertical: 8 }]}><Ionicons name="checkmark" size={16} /><Text style={{ fontSize: 16, color: '#555' }}>{facility}</Text></View>)}
      </ScrollView>
    </Screen>
  );
}
