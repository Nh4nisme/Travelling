import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { c, S } from '@/constants/theme';

interface HelpSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function HelpSearchBar({ value, onChangeText, onSubmit, placeholder = 'Search for help', autoFocus }: HelpSearchBarProps) {
  return (
    <View style={[S.row, { backgroundColor: c.soft, borderRadius: 12, paddingHorizontal: 12, gap: 8 }]}>
      <Ionicons name="search-outline" size={20} color={c.m} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={c.m}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        style={{ flex: 1, paddingVertical: 12, fontSize: 16, color: c.t }}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={18} color={c.m} />
        </Pressable>
      )}
    </View>
  );
}
