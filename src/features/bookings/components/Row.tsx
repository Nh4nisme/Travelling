import { View, Text } from 'react-native';
import { S } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

/** Một dòng "nhãn ... giá trị" dùng chung cho các màn booking. */
export const Row = ({
  a,
  b,
  bold,
  color,
  sub,
}: {
  a: string;
  b: string;
  bold?: boolean;
  color?: string;
  sub?: string;
}) => {
  const { colors } = useTheme();

  return (
    <View style={[S.between, { marginVertical: 6, alignItems: 'flex-start' }]}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ fontSize: 15, color: colors.text }}>{a}</Text>
        {!!sub && <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>{sub}</Text>}
      </View>
      <Text
        style={{
          fontWeight: bold ? '700' : '600',
          fontSize: 15,
          color: color ?? colors.text,
          flexShrink: 1,
          textAlign: 'right',
        }}
      >
        {b}
      </Text>
    </View>
  );
};

export const Divider = ({ my = 12 }: { my?: number }) => {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: my }} />;
};
