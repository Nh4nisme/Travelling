import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, Stepper, Photo } from '@/components';
import { c, S } from '@/constants/theme';
import { fmt } from '@/utils/date';
import { IMG } from '@/data/images';
import { useApp } from '@/store/AppContext';
import { defaultSearch } from '@/store/defaults';
import { Calendar } from '@/features/search/components/Calendar';

const REGION_IMAGES: Record<string, string> = { Europe: IMG.europe, Asia: IMG.asia, Americas: IMG.americas };

export function SearchScreen({ navigation }: any) {
  const { search, setSearch, listings } = useApp();
  const regions = [
    { name: 'Anywhere', image: IMG.anywhere },
    ...[...new Set(listings.map((listing) => listing.region))]
      .map((region) => ({ name: region, image: REGION_IMAGES[region] ?? IMG.anywhere })),
  ];
  const [s, setS] = useState({ ...search });
  const [open, setOpen] = useState<'where' | 'when' | 'who'>('where');
  const [anytime, setAnytime] = useState(false);
  const pick = (d: Date) => setS((p) => (!p.start || p.end ? { ...p, start: d, end: undefined } : d <= p.start ? { ...p, start: d } : { ...p, end: d }));
  const Row = ({ k, label, value }: { k: typeof open; label: string; value: string }) => (
    <Pressable onPress={() => setOpen(k)} style={[S.between, S.box, { padding: 18, marginBottom: 12 }]}><Text style={S.muted}>{label}</Text><Text style={{ fontWeight: '600' }}>{value}</Text></Pressable>
  );
  const guests = s.adults + s.children;
  const days = s.start && s.end ? Math.round((+s.end - +s.start) / 864e5) : 0;
  const doSearch = () => { setSearch(s); navigation.replace('Results'); };
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Pressable onPress={() => navigation.goBack()} style={{ alignSelf: 'flex-end', padding: 8 }}><Ionicons name="close" size={26} color={c.m} /></Pressable>
        {open === 'where' ? (
          <View style={[S.box, { padding: 18, marginBottom: 12 }]}>
            <Text style={[S.h1, { marginBottom: 14 }]}>Where to?</Text>
            <View style={[S.row, S.input, { gap: 8, paddingVertical: 4 }]}><Ionicons name="search" size={18} /><TextInput value={s.query} onChangeText={(q) => setS({ ...s, query: q })} placeholder="Search" style={{ flex: 1, fontSize: 16, paddingVertical: 8 }} /></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
              {regions.map(({ name, image }) => (
                <Pressable key={name} onPress={() => setS({ ...s, location: name })} style={{ marginRight: 14 }}>
                  <Photo uri={image} style={{ width: 110, height: 110, borderRadius: 12, borderWidth: 3, borderColor: s.location === name ? c.p : 'transparent' }} />
                  <Text style={{ marginTop: 6, fontWeight: s.location === name ? '700' : '400' }}>{name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : <Row k="where" label="Location" value={s.query || s.location} />}
        {open === 'when' ? (
          <View style={[S.box, { padding: 18, marginBottom: 12 }]}>
            <Text style={[S.h1, { marginBottom: 12 }]}>When staying</Text>
            <View style={{ flexDirection: 'row', backgroundColor: c.soft, borderRadius: 20, overflow: 'hidden' }}>
              {[['Choose dates', false], ['Anytime', true]].map(([t, v]) => (
                <Pressable key={t as string} onPress={() => { setAnytime(v as boolean); if (v) setS({ ...s, start: undefined, end: undefined }); }} style={{ flex: 1, padding: 12, alignItems: 'center', backgroundColor: anytime === v ? c.p : 'transparent', borderRadius: 20 }}>
                  <Text style={{ color: anytime === v ? '#fff' : c.t, fontWeight: '600' }}>{t as string}</Text>
                </Pressable>
              ))}
            </View>
            {!anytime && <><Calendar start={s.start} end={s.end} onPick={pick} /><Text style={{ textAlign: 'center', marginTop: 10, color: c.m }}>{days ? `${days} days` : 'Select check-in and check-out'}</Text></>}
            <View style={[S.between, { marginTop: 14 }]}>
              <Pressable onPress={() => setOpen('who')}><Text style={S.muted}>Skip</Text></Pressable>
              <Btn title="Next" onPress={() => setOpen('who')} style={{ backgroundColor: c.pl, paddingHorizontal: 50 }} />
            </View>
          </View>
        ) : <Row k="when" label="When" value={s.start ? `${fmt(s.start)} - ${fmt(s.end ?? s.start)}` : 'Add time'} />}
        {open === 'who' ? (
          <View style={[S.box, { padding: 18 }]}>
            <Text style={[S.h1, { marginBottom: 10 }]}>How many guests?</Text>
            {([['Adults', 'adults'], ['Children', 'children']] as const).map(([l, k]) => (
              <View key={k} style={[S.between, { paddingVertical: 12 }]}><Text style={{ fontSize: 16 }}>{l}</Text><Stepper value={s[k]} onChange={(n) => setS({ ...s, [k]: n })} /></View>
            ))}
          </View>
        ) : <Row k="who" label="Guests" value={guests ? `${guests} guest${guests > 1 ? 's' : ''}` : 'Add guests'} />}
      </ScrollView>
      <View style={[S.between, { padding: 16, borderTopWidth: 1, borderColor: c.soft }]}>
        <Pressable onPress={() => { setS(defaultSearch); setAnytime(false); }}><Text style={{ color: c.m, fontSize: 16 }}>Clear all</Text></Pressable>
        <Btn title="Search" icon="search" onPress={doSearch} />
      </View>
    </Screen>
  );
}
