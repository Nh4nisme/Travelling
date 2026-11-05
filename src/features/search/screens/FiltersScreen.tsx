import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn, Check } from '@/components';
import { S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export function FiltersScreen({ navigation }: any) {
  const { filters, setFilters, listings } = useApp();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [f, setF] = useState({ ...filters });

  const tog = (k: 'types' | 'facilities', v: string) =>
    setF({
      ...f,
      [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v],
    });

  const num = (k: 'min' | 'max', text: string) =>
    setF({ ...f, [k]: Number(text.replace(/\D/g, '')) || 0 });

  const typeDescriptions: Record<string, string> = (t.filters.types as Record<string, string>) || {
    'Entire place': 'Entire apartments, condos, houses',
    'Private room': 'A private room in a shared property',
    Dormitories: 'Shared rooms with multiple beds',
  };

  const types = [...new Set(listings.map((listing) => listing.type))];
  const facilities = [...new Set(listings.flatMap((listing) => listing.facilities))];
  const T = types.map((type) => [type, typeDescriptions[type] ?? type]);

  return (
    <Screen>
      {/* Top Header */}
      <View
        style={[
          S.between,
          {
            padding: 16,
            borderBottomWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
      >
        <View style={{ width: 24 }} />
        <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text }}>
          {t.filters.title}
        </Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Price Range */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
          {t.filters.priceRange}
        </Text>
        <View style={[S.between, { marginVertical: 14 }]}>
          {(['min', 'max'] as const).map((k, i) => (
            <React.Fragment key={k}>
              {i === 1 && (
                <Text style={{ color: colors.muted, fontSize: 18, fontWeight: '600' }}>—</Text>
              )}
              <View
                style={{
                  width: '42%',
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {k === 'min' ? t.filters.minimum : t.filters.maximum}
                </Text>
                <TextInput
                  keyboardType="number-pad"
                  value={`US$${f[k]}`}
                  onChangeText={(text) => num(k, text)}
                  style={{ fontSize: 16, paddingVertical: 4, color: colors.text, fontWeight: '600' }}
                />
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Type of place */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 18, marginBottom: 12 }}>
          {t.filters.typeOfPlace}
        </Text>
        {T.map(([type, desc]) => (
          <View key={type} style={[S.between, { marginBottom: 16 }]}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>{type}</Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>{desc}</Text>
            </View>
            <Check on={f.types.includes(type)} onPress={() => tog('types', type)} />
          </View>
        ))}

        {/* Facilities */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 18, marginBottom: 12 }}>
          {t.filters.facilities}
        </Text>
        {facilities.map((facility) => (
          <View key={facility} style={[S.between, { marginBottom: 16 }]}>
            <Text style={{ fontSize: 15, color: colors.text, fontWeight: '500' }}>{facility}</Text>
            <Check on={f.facilities.includes(facility)} onPress={() => tog('facilities', facility)} />
          </View>
        ))}
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
          onPress={() => setF({ min: 0, max: 1000, types: [], facilities: [], total: f.total })}
          hitSlop={10}
        >
          <Text style={{ color: colors.muted, fontSize: 16, fontWeight: '500' }}>
            {t.filters.clearAll}
          </Text>
        </Pressable>
        <Btn
          title={t.filters.viewResults}
          onPress={() => {
            setFilters(f);
            navigation.goBack();
          }}
          style={{ paddingHorizontal: 28 }}
        />
      </View>
    </Screen>
  );
}
