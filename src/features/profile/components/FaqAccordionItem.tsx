import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { c, S } from '@/constants/theme';
import type { FaqItem } from '../types';

function FeedbackButton({ label, icon, onPress }: { label: 'Yes' | 'No'; icon: 'thumbs-up-outline' | 'thumbs-down-outline'; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label === 'Yes' ? 'Yes, this answer was helpful' : 'No, this answer was not helpful'}
      style={[S.row, { gap: 6, borderWidth: 1, borderColor: c.b, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 }]}
    >
      <Ionicons name={icon} size={14} color={c.t} />
      <Text style={{ fontSize: 13, color: c.t, fontWeight: '500' }}>{label}</Text>
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
  const [helpful, setHelpful] = useState<boolean | null>(null);

  return (
    <View style={{ borderBottomWidth: 1, borderColor: c.soft }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={[S.between, { paddingVertical: 16, gap: 12 }]}
      >
        <Text style={{ flex: 1, fontSize: 16, color: c.t, fontWeight: expanded ? '700' : '600' }}>{item.question}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={c.m} />
      </Pressable>

      {expanded && (
        <View style={{ paddingBottom: 18 }}>
          <Text style={{ fontSize: 15, lineHeight: 22, color: c.t }}>{item.answer}</Text>

          <View style={[S.row, { marginTop: 16, gap: 10, flexWrap: 'wrap' }]}>
            {helpful === null ? (
              <>
                <Text style={S.muted}>Was this helpful?</Text>
                <FeedbackButton label="Yes" icon="thumbs-up-outline" onPress={() => setHelpful(true)} />
                <FeedbackButton label="No" icon="thumbs-down-outline" onPress={() => setHelpful(false)} />
              </>
            ) : helpful ? (
              <Text style={S.muted}>Thanks for your feedback!</Text>
            ) : (
              <>
                <Text style={S.muted}>Sorry about that.</Text>
                <Pressable onPress={onContactSupport} hitSlop={8} accessibilityRole="link">
                  <Text style={{ color: c.p, fontWeight: '600', fontSize: 14 }}>Contact support</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
