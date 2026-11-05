import { View, Text, ScrollView, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Btn } from '@/components';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import type { RootStackParamList } from '@/app/navigation/types';
import { useApp } from '@/store/AppContext';
import { ContactOption } from '../components/ContactOption';
import { SUPPORT_CONTACT } from '../data/helpContent';

const SectionTitle = ({ children, colors }: { children: string; colors: any }) => (
  <Text style={{ color: colors.muted, marginTop: 24, marginBottom: 12, fontWeight: '600', letterSpacing: 0.5 }}>{children}</Text>
);

export function ContactSupportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useApp();
  const { colors } = useTheme();
  const { t } = useLanguage();

  // Không dùng canOpenURL (iOS yêu cầu khai báo scheme); thử mở và báo lỗi nếu thiết bị không hỗ trợ (vd. simulator).
  const openLink = async (url: string, errorTitle: string, errorMessage: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(errorTitle, errorMessage);
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Travelling support request');
    const body = encodeURIComponent(
      `Hi Travelling Support,\n\n\n\n---\n${user ? `Account: ${user.email}\nUser ID: ${user.id}` : 'Not signed in'}`,
    );
    void openLink(
      `mailto:${SUPPORT_CONTACT.email}?subject=${subject}&body=${body}`,
      'No email app found',
      `Please email us at ${SUPPORT_CONTACT.email}.`,
    );
  };

  const handleCall = () =>
    void openLink(`tel:${SUPPORT_CONTACT.phoneDial}`, 'Unable to place call', `Please call us at ${SUPPORT_CONTACT.phoneDisplay}.`);

  return (
    <Screen>
      <Header title={t.helpCenter.contactSupport} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <View style={{ backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.soft, borderRadius: 12, padding: 16, alignItems: 'center', paddingVertical: 24 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="headset-outline" size={28} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 12 }}>{t.helpCenter.weAreHere}</Text>
          <Text style={{ color: colors.muted, marginTop: 4, textAlign: 'center' }}>
            Our team is available {SUPPORT_CONTACT.hours} and usually replies {SUPPORT_CONTACT.responseTime}.
          </Text>
        </View>

        <SectionTitle colors={colors}>{t.helpCenter.chooseHow}</SectionTitle>
        <ContactOption
          icon="chatbubbles-outline"
          title={t.helpCenter.messageUs}
          subtitle={t.helpCenter.chatInInbox}
          onPress={() => navigation.navigate('Main', { screen: 'Inbox' })}
        />
        <ContactOption icon="mail-outline" title={t.helpCenter.email} subtitle={SUPPORT_CONTACT.email} onPress={handleEmail} />
        <ContactOption icon="call-outline" title={t.helpCenter.call} subtitle={`${SUPPORT_CONTACT.phoneDisplay} · ${SUPPORT_CONTACT.hours}`} onPress={handleCall} />

        <SectionTitle colors={colors}>{t.helpCenter.beforeContact}</SectionTitle>
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Ionicons name="receipt-outline" size={18} color={colors.muted} style={{ marginTop: 2 }} />
            <Text style={{ flex: 1, color: colors.text, lineHeight: 20 }}>{t.helpCenter.haveBookingRef}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Ionicons name="help-circle-outline" size={18} color={colors.muted} style={{ marginTop: 2 }} />
            <Text style={{ flex: 1, color: colors.text, lineHeight: 20 }}>{t.helpCenter.manyAnswered}</Text>
          </View>
        </View>

        <Btn outline title={t.helpCenter.browseFaqs} icon="help-circle-outline" onPress={() => navigation.navigate('Faq')} style={{ marginTop: 20 }} />
        <Btn
          outline
          title={t.helpCenter.reportProblem}
          icon="warning-outline"
          onPress={() => navigation.navigate('ReportProblem')}
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </Screen>
  );
}
