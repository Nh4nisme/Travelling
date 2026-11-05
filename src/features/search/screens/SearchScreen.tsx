import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, Stepper, Photo } from '@/components';
import { S } from '@/constants/theme';
import { fmt } from '@/utils/date';
import { IMG } from '@/data/images';
import { useApp } from '@/store/AppContext';
import { defaultSearch } from '@/store/defaults';
import { Calendar } from '@/features/search/components/Calendar';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

const REGION_IMAGES: Record<string, string> = {
  Europe: IMG.europe,
  Asia: IMG.asia,
  Americas: IMG.americas,
};

export function SearchScreen({ navigation }: any) {
  const { search, setSearch, listings } = useApp();
  const { colors, isDark } = useTheme();
  const { t, isVietnamese } = useLanguage();

  const regions = [
    { name: t.search.anywhere, image: IMG.anywhere, key: 'Anywhere' },
    ...[...new Set(listings.map((listing) => listing.region))].map((region) => ({
      name: region,
      image: REGION_IMAGES[region] ?? IMG.anywhere,
      key: region,
    })),
  ];

  const [s, setS] = useState({ ...search });
  const [open, setOpen] = useState<'where' | 'when' | 'who'>('where');
  const [anytime, setAnytime] = useState(false);

  const pick = (d: Date) =>
    setS((p) =>
      !p.start || p.end
        ? { ...p, start: d, end: undefined }
        : d <= p.start
        ? { ...p, start: d }
        : { ...p, end: d }
    );

  const Row = ({ k, label, value }: { k: typeof open; label: string; value: string }) => (
    <Pressable
      onPress={() => setOpen(k)}
      style={[
        S.between,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 12,
          padding: 18,
          marginBottom: 12,
        },
      ]}
    >
      <Text style={{ color: colors.muted, fontSize: 14 }}>{label}</Text>
      <Text style={{ fontWeight: '600', color: colors.text, fontSize: 15 }}>{value}</Text>
    </Pressable>
  );

  const guests = s.adults + s.children;
  const days = s.start && s.end ? Math.round((+s.end - +s.start) / 864e5) : 0;

  const doSearch = () => {
    setSearch(s);
    navigation.replace('Results');
  };

  const guestsLabel = guests
    ? `${guests} ${guests > 1 ? t.search.guests : t.search.guest}`
    : t.search.addGuests;

  const datesLabel = s.start
    ? `${fmt(s.start)} - ${fmt(s.end ?? s.start)}`
    : t.search.addTime;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={{ alignSelf: 'flex-end', padding: 8, marginBottom: 8 }}
        >
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>

        {/* SECTION 1: WHERE */}
        {open === 'where' ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 18,
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 14 }}>
              {t.search.whereTo}
            </Text>
            <View
              style={[
                S.row,
                {
                  backgroundColor: colors.soft,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  gap: 8,
                },
              ]}
            >
              <Ionicons name="search" size={18} color={colors.primary} />
              <TextInput
                value={s.query}
                onChangeText={(q) => setS({ ...s, query: q })}
                placeholder={t.search.searchPlaceholder}
                placeholderTextColor={colors.muted}
                style={{ flex: 1, fontSize: 16, paddingVertical: 10, color: colors.text }}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
              {regions.map(({ name, key, image }) => {
                const isSelected = s.location === key || (key === 'Anywhere' && !s.location);
                return (
                  <Pressable
                    key={key}
                    onPress={() => setS({ ...s, location: key === 'Anywhere' ? '' : key })}
                    style={{ marginRight: 14 }}
                  >
                    <Photo
                      uri={image}
                      style={{
                        width: 110,
                        height: 110,
                        borderRadius: 12,
                        borderWidth: 3,
                        borderColor: isSelected ? colors.primary : 'transparent',
                      }}
                    />
                    <Text
                      style={{
                        marginTop: 6,
                        fontWeight: isSelected ? '700' : '500',
                        color: isSelected ? colors.primary : colors.text,
                        fontSize: 13,
                      }}
                    >
                      {name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          <Row k="where" label={t.search.location} value={s.query || s.location || t.search.anywhere} />
        )}

        {/* SECTION 2: WHEN */}
        {open === 'when' ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 18,
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              {t.search.whenStaying}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                backgroundColor: colors.soft,
                borderRadius: 20,
                padding: 3,
                marginBottom: 16,
              }}
            >
              {[
                [t.search.chooseDates, false],
                [t.search.anytime, true],
              ].map(([title, val]) => {
                const active = anytime === val;
                return (
                  <Pressable
                    key={title as string}
                    onPress={() => {
                      setAnytime(val as boolean);
                      if (val) setS({ ...s, start: undefined, end: undefined });
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      alignItems: 'center',
                      backgroundColor: active ? colors.primary : 'transparent',
                      borderRadius: 18,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? '#fff' : colors.text,
                        fontWeight: active ? '700' : '500',
                        fontSize: 14,
                      }}
                    >
                      {title as string}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {!anytime && (
              <>
                <Calendar start={s.start} end={s.end} onPick={pick} />
                <Text style={{ textAlign: 'center', marginTop: 12, color: colors.muted, fontSize: 13 }}>
                  {days
                    ? `${days} ${t.search.days}`
                    : t.search.selectDatesPrompt}
                </Text>
              </>
            )}

            <View style={[S.between, { marginTop: 18 }]}>
              <Pressable onPress={() => setOpen('who')} hitSlop={10}>
                <Text style={{ color: colors.muted, fontSize: 15, fontWeight: '500' }}>
                  {t.search.skip}
                </Text>
              </Pressable>
              <Btn
                title={t.search.next}
                onPress={() => setOpen('who')}
                style={{ paddingHorizontal: 36 }}
              />
            </View>
          </View>
        ) : (
          <Row k="when" label={t.search.whenStaying} value={datesLabel} />
        )}

        {/* SECTION 3: WHO */}
        {open === 'who' ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 18,
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              {t.search.howManyGuests}
            </Text>

            <View style={[S.between, { paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.soft }]}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                  {t.search.adults}
                </Text>
              </View>
              <Stepper
                value={s.adults}
                onChange={(n) => setS({ ...s, adults: n })}
              />
            </View>

            <View style={[S.between, { paddingVertical: 12 }]}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                  {t.search.children}
                </Text>
              </View>
              <Stepper
                value={s.children}
                onChange={(n) => setS({ ...s, children: n })}
              />
            </View>
          </View>
        ) : (
          <Row k="who" label={t.search.howManyGuests} value={guestsLabel} />
        )}
      </ScrollView>

      {/* Bottom Bar */}
      <View
        style={[
          S.between,
          {
            padding: 16,
            borderTopWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            setS(defaultSearch);
            setAnytime(false);
          }}
          hitSlop={10}
        >
          <Text style={{ color: colors.muted, fontSize: 16, fontWeight: '500' }}>
            {t.search.clearAll}
          </Text>
        </Pressable>
        <Btn title={t.search.searchBtn} icon="search" onPress={doSearch} style={{ paddingHorizontal: 28 }} />
      </View>
    </Screen>
  );
}
