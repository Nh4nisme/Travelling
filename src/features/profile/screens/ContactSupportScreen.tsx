import { View, Text, ScrollView, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Btn } from '@/components';
import { c, S } from '@/constants/theme';
import type { RootStackParamList } from '@/app/navigation/types';
import { useApp } from '@/store/AppContext';
import { ContactOption } from '../components/ContactOption';
import { SUPPORT_CONTACT } from '../data/helpContent';

const SectionTitle = ({ children }: { children: string }) => (
  <Text style={[S.muted, { marginTop: 24, marginBottom: 12, fontWeight: '600', letterSpacing: 0.5 }]}>{children}</Text>
);

export function ContactSupportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useApp();

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
      <Header title="Contact Support" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <View style={[S.box, { alignItems: 'center', paddingVertical: 24, backgroundColor: c.soft, borderColor: c.soft }]}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.pl, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="headset-outline" size={28} color={c.p} />
          </View>
          <Text style={[S.h2, { marginTop: 12 }]}>We're here to help</Text>
          <Text style={[S.muted, { marginTop: 4, textAlign: 'center' }]}>
            Our team is available {SUPPORT_CONTACT.hours} and usually replies {SUPPORT_CONTACT.responseTime}.
          </Text>
        </View>

        <SectionTitle>CHOOSE HOW TO REACH US</SectionTitle>
        <ContactOption
          icon="chatbubbles-outline"
          title="Message us"
          subtitle="Chat with Travelling Support in your Inbox"
          onPress={() => navigation.navigate('Main', { screen: 'Inbox' })}
        />
        <ContactOption icon="mail-outline" title="Email" subtitle={SUPPORT_CONTACT.email} onPress={handleEmail} />
        <ContactOption icon="call-outline" title="Call" subtitle={`${SUPPORT_CONTACT.phoneDisplay} · ${SUPPORT_CONTACT.hours}`} onPress={handleCall} />

        <SectionTitle>BEFORE YOU GET IN TOUCH</SectionTitle>
        <View style={{ gap: 10 }}>
          <View style={[S.row, { gap: 10, alignItems: 'flex-start' }]}>
            <Ionicons name="receipt-outline" size={18} color={c.m} style={{ marginTop: 2 }} />
            <Text style={{ flex: 1, color: c.t, lineHeight: 20 }}>Have your booking reference ready. You can find it in the Booking tab.</Text>
          </View>
          <View style={[S.row, { gap: 10, alignItems: 'flex-start' }]}>
            <Ionicons name="help-circle-outline" size={18} color={c.m} style={{ marginTop: 2 }} />
            <Text style={{ flex: 1, color: c.t, lineHeight: 20 }}>Many questions are answered instantly in our FAQs.</Text>
          </View>
        </View>

        <Btn outline title="Browse FAQs" icon="help-circle-outline" onPress={() => navigation.navigate('Faq')} style={{ marginTop: 20 }} />
        <Btn
          outline
          title="Report a Problem"
          icon="warning-outline"
          onPress={() => navigation.navigate('ReportProblem')}
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </Screen>
  );
}
