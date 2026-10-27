import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn } from '@/components';
import { c, S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';

export function SuccessScreen({ route, navigation }: any) {
  const { id, total } = route.params;
  const { search, addBooking } = useApp();
  const [info] = useState(() => { const d = new Date(); return { ref: String(Math.floor(Math.random() * 1e14)).padStart(14, '0'), date: `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`, time: d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) }; });
  const [saved, setSaved] = useState(false);
  React.useEffect(() => { addBooking({ id: info.ref, listingId: id, ref: info.ref, start: search.start, end: search.end, total, paidAt: `${info.date} ${info.time}` }); }, []);
  const R = ({ a, b }: any) => <View style={[S.between, { marginVertical: 8 }]}><Text style={{ fontSize: 16 }}>{a}</Text><Text style={{ fontWeight: '700', fontSize: 16 }}>{b}</Text></View>;
  return (
    <Screen style={{ backgroundColor: '#F7F8FA' }}>
      <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
        <View style={{ alignSelf: 'center', width: 110, height: 110, borderRadius: 55, backgroundColor: '#4ADE80', alignItems: 'center', justifyContent: 'center', marginBottom: -50, zIndex: 1 }}><Ionicons name="checkmark" size={64} color="#fff" /></View>
        <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 20, paddingTop: 70 }}>
          <Text style={{ fontSize: 30, fontWeight: '700', textAlign: 'center', marginBottom: 20 }}>Payment success!</Text>
          <R a="Ref number" b={info.ref} /><R a="Date" b={info.date} /><R a="Time" b={info.time} /><R a="Payment method" b="Credit card" />
          <View style={{ height: 1, backgroundColor: c.soft, marginVertical: 8 }} /><R a="Amount" b={`$${total}`} />
          <Btn outline icon="download-outline" title={saved ? 'Receipt saved' : 'Get PDF receipt'} onPress={() => { setSaved(true); Alert.alert('Receipt', 'PDF receipt saved to your device (demo).'); }} style={{ marginTop: 16 }} />
        </View>
      </View>
      <View style={{ padding: 16 }}><Btn title="View booking" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Bookings' } }] })} /></View>
    </Screen>
  );
}
