import { ActivityIndicator, View, Text } from 'react-native';
import { Btn } from '@/components';
import { c, S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import type { Listing } from '@/types/listing';

export const ICON: Record<string, any> = { Wifi: 'wifi', Kitchen: 'restaurant-outline', Pool: 'water-outline', Garden: 'leaf-outline', Gym: 'barbell-outline', 'Exercise equipment': 'barbell-outline' };

export function useListing(id: string): Listing | undefined {
  const { listings } = useApp();
  return listings.find((listing) => listing.id === id);
}

export const Section = ({ title, right, children }: any) => (<View style={{ padding: 16, borderTopWidth: 1, borderColor: c.soft }}><View style={[S.between, { marginBottom: 10 }]}><Text style={S.h2}>{title}</Text>{right}</View>{children}</View>);

export const More = ({ t, onPress }: { t: string; onPress: () => void }) => <Btn outline title={t} onPress={onPress} style={{ marginTop: 12 }} />;

export function ListingState({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry: () => void }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {loading ? <ActivityIndicator color={c.p} /> : <Text style={[S.muted, { textAlign: 'center' }]}>{error ?? 'Place not found.'}</Text>}
      {!loading && <Btn title="Try again" outline onPress={onRetry} style={{ marginTop: 12 }} />}
    </View>
  );
}
