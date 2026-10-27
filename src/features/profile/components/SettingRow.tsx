import { View, Text, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { c, S } from '@/constants/theme';

interface SettingRowProps {
  label: string;
  type: 'navigate' | 'select' | 'toggle';
  value?: string;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  isToggled?: boolean;
}

export function SettingRow({ label, type, value, onPress, onToggle, isToggled }: SettingRowProps) {
  const renderRightElement = () => {
    switch (type) {
      case 'navigate':
        return <Ionicons name="chevron-forward" size={18} color={c.m} />;
      case 'select':
        return (
          <View style={[S.row, { gap: 4 }]}>
            {value && <Text style={[S.muted]}>{value}</Text>}
            <Ionicons name="chevron-forward" size={18} color={c.m} />
          </View>
        );
      case 'toggle':
        return (
          <Switch
            value={isToggled ?? false}
            onValueChange={onToggle}
            trackColor={{ false: c.b, true: c.pl }}
            thumbColor={isToggled ? c.p : '#f4f3f4'}
          />
        );
    }
  };

  return (
    <Pressable
      onPress={type !== 'toggle' ? onPress : undefined}
      style={[S.between, { paddingVertical: 16, borderBottomWidth: 1, borderColor: c.soft }]}
    >
      <Text style={{ fontSize: 16, color: c.t }}>{label}</Text>
      {renderRightElement()}
    </Pressable>
  );
}
