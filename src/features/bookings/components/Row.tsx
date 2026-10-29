import { View, Text } from 'react-native';
import { S } from '@/constants/theme';

/** Một dòng "nhãn ... giá trị" dùng chung cho các màn booking. */
export const Row = ({ a, b, bold, color, sub }: { a: string; b: string; bold?: boolean; color?: string; sub?: string }) => (
  <View style={[S.between, { marginVertical: 6, alignItems: 'flex-start' }]}>
    <View style={{ flex: 1, paddingRight: 12 }}>
      <Text style={{ fontSize: 16 }}>{a}</Text>
      {!!sub && <Text style={S.muted}>{sub}</Text>}
    </View>
    <Text style={{ fontWeight: bold ? '700' : '600', fontSize: 16, color, flexShrink: 1, textAlign: 'right' }}>{b}</Text>
  </View>
);

export const Divider = ({ my = 12 }: { my?: number }) => <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: my }} />;
