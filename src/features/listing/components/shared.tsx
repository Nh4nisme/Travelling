import { View, Text } from 'react-native';
import { Btn } from '@/components';
import { c, S } from '@/constants/theme';
import { listingService } from '@/services/listingService';
import type { Listing } from '@/types/listing';

export const ICON: Record<string, any> = { Wifi: 'wifi', Kitchen: 'restaurant-outline', Pool: 'water-outline', Garden: 'leaf-outline', Gym: 'barbell-outline', 'Exercise equipment': 'barbell-outline' };

export const getListing = (r: any): Listing => listingService.getById(r.params.id);

export const Section = ({ title, right, children }: any) => (<View style={{ padding: 16, borderTopWidth: 1, borderColor: c.soft }}><View style={[S.between, { marginBottom: 10 }]}><Text style={S.h2}>{title}</Text>{right}</View>{children}</View>);

export const More = ({ t, onPress }: { t: string; onPress: () => void }) => <Btn outline title={t} onPress={onPress} style={{ marginTop: 12 }} />;
