import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Btn } from '@/components';
import { c, S } from '@/constants/theme';
import type { RootStackParamList } from '@/app/navigation/types';
import { MenuItem } from '../components/MenuItem';
import { HelpSearchBar } from '../components/HelpSearchBar';
import { TopicCard } from '../components/TopicCard';
import { FAQS, FAQ_CATEGORIES, countFaqsByCategory, getFaqCategory } from '../data/helpContent';
import { searchFaqs } from '../utils/searchFaqs';

const MAX_INLINE_RESULTS = 5;

const SectionTitle = ({ children }: { children: string }) => (
  <Text style={[S.muted, { marginTop: 28, marginBottom: 8, fontWeight: '600', letterSpacing: 0.5 }]}>{children}</Text>
);

export function HelpCenterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const results = useMemo(() => searchFaqs(trimmed, FAQS), [trimmed]);
  const popular = useMemo(() => FAQS.filter((faq) => faq.popular), []);

  const openFaq = (faqId: string) => navigation.navigate('Faq', { faqId });

  return (
    <Screen>
      <Header title="Help Center" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={S.h1}>How can we help?</Text>
        <Text style={[S.muted, { marginTop: 4, marginBottom: 16 }]}>
          Search our FAQs or get in touch with the Travelling team.
        </Text>

        <HelpSearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={() => trimmed && navigation.navigate('Faq', { query: trimmed })}
          placeholder="Search for help (e.g. refund, check-in)"
        />

        {trimmed ? (
          // ---- Kết quả tìm kiếm nhanh ----
          <View style={{ marginTop: 8 }}>
            {results.length > 0 ? (
              <>
                <SectionTitle>{`${results.length} RESULT${results.length > 1 ? 'S' : ''}`}</SectionTitle>
                {results.slice(0, MAX_INLINE_RESULTS).map((faq) => (
                  <Pressable
                    key={faq.id}
                    onPress={() => openFaq(faq.id)}
                    accessibilityRole="button"
                    style={[S.between, { paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderColor: c.soft }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, color: c.t, fontWeight: '600' }}>{faq.question}</Text>
                      <Text style={[S.muted, { fontSize: 12, marginTop: 2 }]}>{getFaqCategory(faq.category)?.title}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={c.m} />
                  </Pressable>
                ))}
                {results.length > MAX_INLINE_RESULTS && (
                  <Btn
                    outline
                    title={`See all ${results.length} results`}
                    onPress={() => navigation.navigate('Faq', { query: trimmed })}
                    style={{ marginTop: 16 }}
                  />
                )}
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="search-outline" size={48} color={c.b} />
                <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600', color: c.t, textAlign: 'center' }}>
                  No results for "{trimmed}"
                </Text>
                <Text style={[S.muted, { marginTop: 4, textAlign: 'center' }]}>
                  Try different keywords or contact our team.
                </Text>
                <Btn
                  title="Contact Support"
                  icon="chatbubble-outline"
                  onPress={() => navigation.navigate('ContactSupport')}
                  style={{ marginTop: 20, alignSelf: 'stretch' }}
                />
              </View>
            )}
          </View>
        ) : (
          <>
            {/* ---- Chủ đề ---- */}
            <View style={[S.between, { marginTop: 28, marginBottom: 12 }]}>
              <Text style={[S.muted, { fontWeight: '600', letterSpacing: 0.5 }]}>TOPICS</Text>
              <Pressable onPress={() => navigation.navigate('Faq')} hitSlop={10} accessibilityRole="link">
                <Text style={{ color: c.p, fontWeight: '600', fontSize: 14 }}>Browse all FAQs</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }}>
              {FAQ_CATEGORIES.map((category) => (
                <TopicCard
                  key={category.id}
                  category={category}
                  count={countFaqsByCategory(category.id)}
                  onPress={() => navigation.navigate('Faq', { category: category.id })}
                />
              ))}
            </View>

            {/* ---- Câu hỏi phổ biến ---- */}
            <SectionTitle>POPULAR QUESTIONS</SectionTitle>
            {popular.map((faq) => (
              <Pressable
                key={faq.id}
                onPress={() => openFaq(faq.id)}
                accessibilityRole="button"
                style={[S.between, { paddingVertical: 16, gap: 12, borderBottomWidth: 1, borderColor: c.soft }]}
              >
                <Text style={{ flex: 1, fontSize: 16, color: c.t }}>{faq.question}</Text>
                <Ionicons name="chevron-forward" size={18} color={c.m} />
              </Pressable>
            ))}

            {/* ---- Liên hệ ---- */}
            <SectionTitle>STILL NEED HELP?</SectionTitle>
            <MenuItem
              icon="chatbubble-outline"
              title="Contact Support"
              onPress={() => navigation.navigate('ContactSupport')}
            />
            <MenuItem
              icon="warning-outline"
              title="Report a Problem"
              onPress={() => navigation.navigate('ReportProblem')}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
