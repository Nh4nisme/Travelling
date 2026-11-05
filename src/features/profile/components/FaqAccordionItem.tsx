import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import type { FaqItem } from '../types';

function FeedbackButton({ label, icon, onPress, colors }: { label: string; icon: 'thumbs-up-outline' | 'thumbs-down-outline'; onPress: () => void; colors: any }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label === 'Yes' ? 'Yes, this answer was helpful' : 'No, this answer was not helpful'}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 }}
    >
      <Ionicons name={icon} size={14} color={colors.text} />
      <Text style={{ fontSize: 13, color: colors.text, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );
}

interface FaqAccordionItemProps {
  item: FaqItem;
  expanded: boolean;
  onToggle: () => void;
  onContactSupport: () => void;
}

export function FaqAccordionItem({ item, expanded, onToggle, onContactSupport }: FaqAccordionItemProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [helpful, setHelpful] = useState<boolean | null>(null);

  return (
    <View style={{ borderBottomWidth: 1, borderColor: colors.soft }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, gap: 12 }}
      >
        <Text style={{ flex: 1, fontSize: 16, color: colors.text, fontWeight: expanded ? '700' : '600' }}>{item.question}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>

      {expanded && (
        <View style={{ paddingBottom: 18 }}>
          <Text style={{ fontSize: 15, lineHeight: 22, color: colors.text }}>{item.answer}</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 10, flexWrap: 'wrap' }}>
            {helpful === null ? (
              <>
                <Text style={{ color: colors.muted }}>{t.helpCenter.wasHelpful}</Text>
                <FeedbackButton label={t.helpCenter.yes} icon="thumbs-up-outline" onPress={() => setHelpful(true)} colors={colors} />
                <FeedbackButton label={t.helpCenter.no} icon="thumbs-down-outline" onPress={() => setHelpful(false)} colors={colors} />
              </>
            ) : helpful ? (
              <Text style={{ color: colors.muted }}>{t.helpCenter.thanksFeedback}</Text>
            ) : (
              <>
                <Text style={{ color: colors.muted }}>{t.helpCenter.sorryAboutThat}</Text>
                <Pressable onPress={onContactSupport} hitSlop={8} accessibilityRole="link">
                  <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>{t.helpCenter.contactSupport}</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
