import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Btn } from '@/components';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import type { RootStackParamList } from '@/app/navigation/types';
import { MenuItem } from '../components/MenuItem';
import { HelpSearchBar } from '../components/HelpSearchBar';
import { TopicCard } from '../components/TopicCard';
import { FAQS, FAQ_CATEGORIES, countFaqsByCategory, getFaqCategory } from '../data/helpContent';
import { searchFaqs } from '../utils/searchFaqs';

const MAX_INLINE_RESULTS = 5;

const SectionTitle = ({ children, colors }: { children: string; colors: any }) => (
  <Text style={{ color: colors.muted, marginTop: 28, marginBottom: 8, fontWeight: '600', letterSpacing: 0.5 }}>{children}</Text>
);

export function HelpCenterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const results = useMemo(() => searchFaqs(trimmed, FAQS), [trimmed]);
  const popular = useMemo(() => FAQS.filter((faq) => faq.popular), []);

  const openFaq = (faqId: string) => navigation.navigate('Faq', { faqId });

  return (
    <Screen>
      <Header title={t.helpCenter.title} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>{t.helpCenter.howCanWeHelp}</Text>
        <Text style={{ color: colors.muted, marginTop: 4, marginBottom: 16 }}>
          {t.helpCenter.subtitle}
        </Text>

        <HelpSearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={() => trimmed && navigation.navigate('Faq', { query: trimmed })}
          placeholder={t.helpCenter.searchPlaceholder}
        />

        {trimmed ? (
          // ---- Kết quả tìm kiếm nhanh ----
          <View style={{ marginTop: 8 }}>
            {results.length > 0 ? (
              <>
                <SectionTitle colors={colors}>{`${results.length} ${t.helpCenter.results}`}</SectionTitle>
                {results.slice(0, MAX_INLINE_RESULTS).map((faq) => (
                  <Pressable
                    key={faq.id}
                    onPress={() => openFaq(faq.id)}
                    accessibilityRole="button"
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderColor: colors.soft }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, color: colors.text, fontWeight: '600' }}>{faq.question}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{getFaqCategory(faq.category)?.title}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  </Pressable>
                ))}
                {results.length > MAX_INLINE_RESULTS && (
                  <Btn
                    outline
                    title={`${t.helpCenter.seeAll} ${results.length} ${t.helpCenter.results}`}
                    onPress={() => navigation.navigate('Faq', { query: trimmed })}
                    style={{ marginTop: 16 }}
                  />
                )}
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="search-outline" size={48} color={colors.border} />
                <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center' }}>
                  {t.helpCenter.noResults} "{trimmed}"
                </Text>
                <Text style={{ color: colors.muted, marginTop: 4, textAlign: 'center' }}>
                  {t.helpCenter.tryDifferent}
                </Text>
                <Btn
                  title={t.helpCenter.contactSupport}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 }}>
              <Text style={{ color: colors.muted, fontWeight: '600', letterSpacing: 0.5 }}>{t.helpCenter.browseTopics}</Text>
              <Pressable onPress={() => navigation.navigate('Faq')} hitSlop={10} accessibilityRole="link">
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>{t.helpCenter.seeAll}</Text>
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
            <SectionTitle colors={colors}>{t.helpCenter.popularTopics}</SectionTitle>
            {popular.map((faq) => (
              <Pressable
                key={faq.id}
                onPress={() => openFaq(faq.id)}
                accessibilityRole="button"
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, gap: 12, borderBottomWidth: 1, borderColor: colors.soft }}
              >
                <Text style={{ flex: 1, fontSize: 16, color: colors.text }}>{faq.question}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            ))}

            {/* ---- Liên hệ ---- */}
            <SectionTitle colors={colors}>STILL NEED HELP?</SectionTitle>
            <MenuItem
              icon="chatbubble-outline"
              title={t.helpCenter.contactSupport}
              onPress={() => navigation.navigate('ContactSupport')}
            />
            <MenuItem
              icon="warning-outline"
              title={t.helpCenter.reportProblem}
              onPress={() => navigation.navigate('ReportProblem')}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
