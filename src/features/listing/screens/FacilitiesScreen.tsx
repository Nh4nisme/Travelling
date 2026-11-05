import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '@/components';
import { S } from '@/constants/theme';
import { ListingState, useListing, ICON } from '@/features/listing/components/shared';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export function FacilitiesScreen({ route }: any) {
  const l = useListing(route.params.id);
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

  const Row = ({ ic, t: title }: any) => (
    <View
      style={[
        S.row,
        {
          gap: 12,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderColor: colors.border,
        },
      ]}
    >
      <Ionicons name={ic} size={20} color={colors.primary} />
      <Text style={{ fontSize: 16, color: colors.text }}>{title}</Text>
    </View>
  );

  return (
    <Screen>
      <Header title={t.listing.facilities} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 16 }}>
          {t.listing.facilities}
        </Text>
        <Text style={{ color: colors.muted, marginVertical: 10, fontSize: 14 }}>
          {l.maxGuests} {t.listing.guests} · {l.bedrooms} {t.listing.bedrooms} · {l.beds} {t.listing.beds} · {l.baths} {t.listing.baths}
        </Text>
        {l.facilities.map((f) => (
          <Row key={f} ic={ICON[f] ?? 'checkmark-circle-outline'} t={f} />
        ))}
      </ScrollView>
    </Screen>
  );
}
