import { View, Text } from 'react-native';
import type { BookingStage } from '@/store/types';
import { STAGE_COLOR, STAGE_LABEL } from '../utils';

export const StatusBadge = ({ stage }: { stage: BookingStage }) => (
  <View style={{ alignSelf: 'flex-start', backgroundColor: STAGE_COLOR[stage].bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
    <Text style={{ color: STAGE_COLOR[stage].fg, fontSize: 12, fontWeight: '700' }}>{STAGE_LABEL[stage]}</Text>
  </View>
);
