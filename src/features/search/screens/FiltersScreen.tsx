import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, Check } from '@/components';
import { c, S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';

export function FiltersScreen({ navigation }: any) {
  const { filters, setFilters, listings } = useApp();
  const [f, setF] = useState({ ...filters });
  const tog = (k: 'types' | 'facilities', v: string) => setF({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });
  const num = (k: 'min' | 'max', t: string) => setF({ ...f, [k]: Number(t.replace(/\D/g, '')) || 0 });
  const typeDescriptions: Record<string, string> = {
    'Entire place': 'Entire apartments, condos, houses',
    'Private room': 'A private room in a shared property',
    Dormitories: 'Shared rooms with multiple beds',
  };
  const types = [...new Set(listings.map((listing) => listing.type))];
  const facilities = [...new Set(listings.flatMap((listing) => listing.facilities))];
  const T = types.map((type) => [type, typeDescriptions[type] ?? 'Accommodation type']);
  return (
    <Screen>
      <View style={[S.between, { padding: 16, borderBottomWidth: 1, borderColor: c.soft }]}><View style={{ width: 24 }} /><Text style={{ fontWeight: '700' }}>Filters</Text><Pressable onPress={() => navigation.goBack()}><Ionicons name="close" size={24} color={c.m} /></Pressable></View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={S.h1}>Price range</Text>
        <View style={[S.between, { marginVertical: 18 }]}>
          {(['min', 'max'] as const).map((k, i) => (
            <React.Fragment key={k}>
              {i === 1 && <Text>—</Text>}
              <View style={[S.box, { width: '42%' }]}><Text style={{ fontSize: 12, color: c.m }}>{k === 'min' ? 'Minimum' : 'Maximum'}</Text><TextInput keyboardType="number-pad" value={`US$${f[k]}`} onChangeText={(t) => num(k, t)} style={{ fontSize: 16, paddingVertical: 4 }} /></View>
            </React.Fragment>
          ))}
        </View>
        <Text style={[S.h1, { marginTop: 10, marginBottom: 12 }]}>Type of place</Text>
        {T.map(([t, d]) => (<View key={t} style={[S.between, { marginBottom: 16 }]}><View style={{ flex: 1, paddingRight: 16 }}><Text style={{ fontWeight: '700' }}>{t}</Text><Text style={S.muted}>{d}</Text></View><Check on={f.types.includes(t)} onPress={() => tog('types', t)} /></View>))}
        <Text style={[S.h1, { marginTop: 10, marginBottom: 12 }]}>Facilities</Text>
        {facilities.map((t) => (<View key={t} style={[S.between, { marginBottom: 16 }]}><Text style={{ fontSize: 16 }}>{t}</Text><Check on={f.facilities.includes(t)} onPress={() => tog('facilities', t)} /></View>))}
      </ScrollView>
      <View style={[S.between, { padding: 16, borderTopWidth: 1, borderColor: c.soft }]}>
        <Pressable onPress={() => setF({ min: 0, max: 1000, types: [], facilities: [], total: f.total })}><Text style={{ color: c.m, fontSize: 16 }}>Clear all</Text></Pressable>
        <Btn title="View Results" onPress={() => { setFilters(f); navigation.goBack(); }} />
      </View>
    </Screen>
  );
}
