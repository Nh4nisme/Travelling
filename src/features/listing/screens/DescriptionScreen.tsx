import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Photo } from '@/components';
import { S } from '@/constants/theme';
import { ListingState, useListing } from '@/features/listing/components/shared';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export function DescriptionScreen({ route }: any) {
  const l = useListing(route.params?.id ?? '');
  const { listingsLoading, listingsError, refreshListings } = useApp();
  const { colors } = useTheme();
  const { t } = useLanguage();

  if (!l) {
    return (
      <Screen>
        <ListingState loading={listingsLoading} error={listingsError} onRetry={() => void refreshListings()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={t.listing.description} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Photo uri={l.images[0]} style={{ height: 200, borderRadius: 12 }} />
        <Text style={{ marginTop: 16, lineHeight: 24, color: colors.text, fontSize: 15 }}>
          {l.desc}
        </Text>
        <View style={[S.between, { marginVertical: 20 }]}>
          <View style={[S.row, { gap: 6 }]}>
            <Ionicons name="location" color={colors.primary} size={18} />
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>
              {l.city}, {l.country}
            </Text>
          </View>
          <Text style={{ color: colors.primary, textDecorationLine: 'underline', fontWeight: '500' }}>
            {t.listing.openMap}
          </Text>
        </View>

        {l.facilities.map((facility) => (
          <View key={facility} style={[S.row, { gap: 10, marginVertical: 8 }]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={{ fontSize: 15, color: colors.text }}>{facility}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
