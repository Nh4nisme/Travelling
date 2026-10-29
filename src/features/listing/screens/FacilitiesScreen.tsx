import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '@/components';
import { c, S } from '@/constants/theme';
import { ListingState, useListing, ICON } from '@/features/listing/components/shared';
import { useApp } from '@/store/AppContext';

export function FacilitiesScreen({ route }: any) {
  const l = useListing(route.params.id);
  const { listingsLoading, listingsError, refreshListings } = useApp();
  if (!l) return <Screen><ListingState loading={listingsLoading} error={listingsError} onRetry={() => void refreshListings()} /></Screen>;
  const Row = ({ ic, t }: any) => <View style={[S.row, { gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderColor: c.soft }]}><Ionicons name={ic} size={20} /><Text style={{ fontSize: 16 }}>{t}</Text></View>;
  return (
    <Screen><Header title="Facilities & services" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
        <Text style={S.h1}>Facilities</Text><Text style={[S.muted, { marginVertical: 12 }]}>{l.maxGuests} guests   {l.bedrooms} bedrooms   {l.beds} beds   {l.baths} baths</Text>
        {l.facilities.map((f) => <Row key={f} ic={ICON[f] ?? 'checkmark-circle-outline'} t={f} />)}
      </ScrollView>
    </Screen>
  );
}
