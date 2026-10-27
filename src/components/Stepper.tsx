import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { c, S } from '@/constants/theme';

export const Stepper = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
  <View style={[S.row, { gap: 14 }]}>
    {[-1, 1].map((d) => (
      <Pressable key={d} onPress={() => onChange(Math.max(0, value + d))} style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: d < 0 && value === 0 ? c.b : c.t, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={d < 0 ? 'remove' : 'add'} size={18} color={d < 0 && value === 0 ? c.b : c.t} />
      </Pressable>
    )).reduce((a: any[], el, i) => (i === 0 ? [el, <Text key="v" style={{ minWidth: 20, textAlign: 'center', fontSize: 16 }}>{value}</Text>] : [...a, el]), [])}
  </View>
);
