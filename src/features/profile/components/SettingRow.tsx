import { View, Text, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface SettingRowProps {
  label: string;
  type: 'navigate' | 'select' | 'toggle';
  value?: string;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  isToggled?: boolean;
}

export function SettingRow({ label, type, value, onPress, onToggle, isToggled }: SettingRowProps) {
  const { colors } = useTheme();

  const renderRightElement = () => {
    switch (type) {
      case 'navigate':
        return <Ionicons name="chevron-forward" size={18} color={colors.muted} />;
      case 'select':
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {value && <Text style={{ color: colors.muted, fontSize: 14 }}>{value}</Text>}
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </View>
        );
      case 'toggle':
        return (
          <Switch
            value={isToggled ?? false}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={isToggled ? colors.primary : '#f4f3f4'}
          />
        );
    }
  };

  return (
    <Pressable
      onPress={type !== 'toggle' ? onPress : undefined}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: colors.soft,
      }}
    >
      <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>{label}</Text>
      {renderRightElement()}
    </Pressable>
  );
}
