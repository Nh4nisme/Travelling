import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '@/components';
import { c, S } from '@/constants/theme';
import { getListing, ICON } from '@/features/listing/components/shared';

export function FacilitiesScreen({ route }: any) {
  const l = getListing(route);
  const Row = ({ ic, t }: any) => <View style={[S.row, { gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderColor: c.soft }]}><Ionicons name={ic} size={20} /><Text style={{ fontSize: 16 }}>{t}</Text></View>;
  return (
    <Screen><Header title="Facilities & services" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
        <Text style={S.h1}>Facilities</Text><Text style={[S.muted, { marginVertical: 12 }]}>2 Guests   {l.bedrooms} bedroom   1 bed   1 bath</Text>
        <Row ic="wifi" t="Wifi" />{l.facilities.map((f) => <Row key={f} ic={ICON[f] ?? 'checkmark-circle-outline'} t={f} />)}<Row ic="barbell-outline" t="Exercise equipment" /><Row ic="leaf-outline" t="Garden" />
        <Text style={[S.h1, { marginTop: 24 }]}>Services</Text>
        <Text style={{ fontWeight: '700', marginTop: 12 }}>Cleaning & laundry</Text>
        <Row ic="albums-outline" t="Washer" /><Row ic="albums-outline" t="Free dryer - In unit" /><Row ic="shirt-outline" t="Iron" />
        <Text style={{ fontWeight: '700', marginTop: 12 }}>Bathroom</Text>
        <Row ic="water-outline" t="Bathtub" /><Row ic="flash-outline" t="Hair dryer" />
      </ScrollView>
    </Screen>
  );
}
