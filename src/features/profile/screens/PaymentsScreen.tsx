import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Btn } from '@/components';
import { c, S } from '@/constants/theme';

export function PaymentsScreen() {
  const handleAddPayment = () => {
    Alert.alert('Coming soon', 'Add payment method feature coming soon');
  };

  return (
    <Screen>
      <Header title="Payments" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[S.muted, { marginBottom: 16 }]}>Manage your payment methods</Text>
        
        {/* Placeholder payment method cards */}
        <View style={[S.box, { marginBottom: 12 }]}>
          <View style={[S.row, { gap: 12 }]}>
            <Ionicons name="card-outline" size={24} color={c.p} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 16 }}>•••• •••• •••• 4242</Text>
              <Text style={S.muted}>Expires 12/25</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={c.p} />
          </View>
        </View>

        <View style={[S.box, { marginBottom: 12 }]}>
          <View style={[S.row, { gap: 12 }]}>
            <Ionicons name="card-outline" size={24} color={c.m} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 16 }}>•••• •••• •••• 1234</Text>
              <Text style={S.muted}>Expires 06/24</Text>
            </View>
          </View>
        </View>

        {/* Add payment method button */}
        <Btn
          title="Add payment method"
          icon="add-circle-outline"
          outline
          onPress={handleAddPayment}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </Screen>
  );
}
