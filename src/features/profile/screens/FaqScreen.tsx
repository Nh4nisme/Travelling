import { useMemo, useState } from 'react';
import { View, Text, FlatList, ScrollView, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Btn } from '@/components';
import { c, S } from '@/constants/theme';
import type { RootStackParamList } from '@/app/navigation/types';
import { HelpSearchBar } from '../components/HelpSearchBar';
import { FaqAccordionItem } from '../components/FaqAccordionItem';
import { FAQS, FAQ_CATEGORIES } from '../data/helpContent';
import { searchFaqs } from '../utils/searchFaqs';
import type { FaqCategoryId } from '../types';

type CategoryFilter = FaqCategoryId | 'all';

const FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  ...FAQ_CATEGORIES.map((category) => ({ id: category.id, label: category.title })),
];

export function FaqScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const params = useRoute<RouteProp<RootStackParamList, 'Faq'>>().params;

  const [query, setQuery] = useState(params?.query ?? '');
  const [category, setCategory] = useState<CategoryFilter>(params?.category ?? 'all');
  const [expandedId, setExpandedId] = useState<string | null>(params?.faqId ?? null);
  // Câu hỏi được mở từ trang chủ/ gợi ý sẽ được ghim lên đầu danh sách.
  const focusId = params?.faqId;

  const items = useMemo(() => {
    const base = category === 'all' ? FAQS : FAQS.filter((faq) => faq.category === category);
    const filtered = query.trim() ? searchFaqs(query, base) : base;
    if (!focusId) return filtered;
    return [...filtered].sort((a, b) => Number(b.id === focusId) - Number(a.id === focusId));
  }, [query, category, focusId]);

  const goToContact = () => navigation.navigate('ContactSupport');

  return (
    <Screen>
      <Header title="FAQ" />

      <View style={{ paddingHorizontal: 16 }}>
        <HelpSearchBar value={query} onChangeText={setQuery} placeholder="Search FAQs" />
      </View>

      <View style={{ paddingVertical: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {FILTERS.map((filter) => {
            const active = category === filter.id;
            return (
              <Pressable
                key={filter.id}
                onPress={() => setCategory(filter.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: active ? c.p : c.b,
                  backgroundColor: active ? c.p : '#fff',
                }}
              >
                <Text style={{ fontSize: 13, color: active ? '#fff' : c.t, fontWeight: active ? '700' : '500' }}>{filter.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={items}
        keyExtractor={(faq) => faq.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 }}
        renderItem={({ item }) => (
          <FaqAccordionItem
            item={item}
            expanded={expandedId === item.id}
            onToggle={() => setExpandedId((current) => (current === item.id ? null : item.id))}
            onContactSupport={goToContact}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Ionicons name="search-outline" size={48} color={c.b} />
            <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600', color: c.t, textAlign: 'center' }}>
              {query.trim() ? `No results for "${query.trim()}"` : 'No questions in this topic yet'}
            </Text>
            <Text style={[S.muted, { marginTop: 4, textAlign: 'center' }]}>Try different keywords or another topic.</Text>
          </View>
        }
        ListFooterComponent={
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={[S.muted, { marginBottom: 12 }]}>Can't find what you're looking for?</Text>
            <Btn outline title="Contact Support" icon="chatbubble-outline" onPress={goToContact} style={{ alignSelf: 'stretch' }} />
          </View>
        }
      />
    </Screen>
  );
}
