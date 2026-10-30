import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Modal, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Btn } from '@/components';
import { c, S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import type { Booking } from '@/store/types';

type PaymentMethodItem = {
  id: string;
  last4: string;
  brand: string;
  exp: string;
  isDefault: boolean;
};

export function PaymentsScreen() {
  const { bookings } = useApp();
  const [activeTab, setActiveTab] = useState<'history' | 'methods'>('history');

  // Danh sách phương thức thanh toán
  const [methods, setMethods] = useState<PaymentMethodItem[]>([
    { id: '1', last4: '4242', brand: 'Visa', exp: '12/26', isDefault: true },
    { id: '2', last4: '8888', brand: 'Mastercard', exp: '08/25', isDefault: false },
  ]);

  // Modal hóa đơn chi tiết
  const [selectedReceipt, setSelectedReceipt] = useState<Booking | null>(null);

  // Thêm thẻ mới
  const handleAddPayment = () => {
    Alert.prompt
      ? Alert.prompt('Add Card', 'Enter 4-digit last digits of your card:', (text) => {
          if (text && text.trim().length === 4) {
            setMethods((prev) => [
              ...prev,
              { id: Date.now().toString(), last4: text.trim(), brand: 'Visa', exp: '12/28', isDefault: false },
            ]);
          }
        })
      : Alert.alert('Add Card', 'Virtual test card added successfully!', [
          {
            text: 'OK',
            onPress: () => {
              const rand4 = Math.floor(1000 + Math.random() * 9000).toString();
              setMethods((prev) => [
                ...prev,
                { id: Date.now().toString(), last4: rand4, brand: 'Visa', exp: '10/28', isDefault: false },
              ]);
            },
          },
        ]);
  };

  const getStatusBadge = (b: Booking) => {
    if (b.status === 'cancelled') {
      return { label: 'Cancelled', bg: '#fee2e2', text: '#dc2626' };
    }
    if (b.payment.status === 'paid') {
      return { label: 'Paid in full', bg: '#dcfce7', text: '#16a34a' };
    }
    if (b.payment.status === 'partial') {
      return { label: 'Partial paid', bg: '#fef3c7', text: '#d97706' };
    }
    if (b.payment.status === 'refunded') {
      return { label: 'Refunded', bg: '#f3f4f6', text: '#4b5563' };
    }
    return { label: b.payment.status, bg: '#e0f2fe', text: '#0284c7' };
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return isNaN(d.getTime()) ? isoString : d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Tab bar switch */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons
            name="receipt-outline"
            size={18}
            color={activeTab === 'history' ? c.p : c.m}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Invoices & Receipts ({bookings.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === 'methods' && styles.tabBtnActive]}
          onPress={() => setActiveTab('methods')}
        >
          <Ionicons
            name="card-outline"
            size={18}
            color={activeTab === 'methods' ? c.p : c.m}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeTab === 'methods' && styles.tabTextActive]}>
            Payment Methods
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {activeTab === 'history' ? (
          /* TAB 1: DANH SÁCH HÓA ĐƠN & GIAO DỊCH THẬT TỪ BOOKING */
          <View>
            <Text style={[S.muted, { marginBottom: 14 }]}>
              Official receipts for your past and upcoming reservations.
            </Text>

            {bookings.length === 0 ? (
              <View style={[S.box, styles.emptyContainer]}>
                <Ionicons name="receipt-outline" size={48} color={c.m} style={{ opacity: 0.5 }} />
                <Text style={[{ fontSize: 16, fontWeight: '700', color: c.t }, { marginTop: 12 }]}>No receipts yet</Text>
                <Text style={[S.muted, { textAlign: 'center', marginTop: 6 }]}>
                  When you book a stay, your payment receipts and invoices will be listed here.
                </Text>
              </View>
            ) : (
              bookings.map((b) => {
                const badge = getStatusBadge(b);
                return (
                  <Pressable
                    key={b.id}
                    style={[S.box, styles.receiptCard]}
                    onPress={() => setSelectedReceipt(b)}
                  >
                    <View style={S.row}>
                      <Image
                        source={{ uri: b.listing.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945' }}
                        style={styles.listingThumb}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={[S.row, { justifyContent: 'space-between' }]}>
                          <Text style={[styles.badge, { backgroundColor: badge.bg, color: badge.text }]}>
                            {badge.label}
                          </Text>
                          <Text style={{ fontWeight: '700', fontSize: 16, color: c.p }}>
                            ${b.payment.amountPaid.toLocaleString()}
                          </Text>
                        </View>

                        <Text style={[{ fontSize: 15, fontWeight: '700', color: c.t }, { marginTop: 4 }]} numberOfLines={1}>
                          {b.listing.title}
                        </Text>
                        <Text style={[S.muted, { fontSize: 13 }]} numberOfLines={1}>
                          {b.listing.city}, {b.listing.country}
                        </Text>

                        <View style={[S.row, { justifyContent: 'space-between', marginTop: 8 }]}>
                          <Text style={{ fontSize: 12, color: c.m }}>
                            Ref: #{b.ref || b.id.slice(-6)}
                          </Text>
                          <Text style={{ fontSize: 12, color: c.m }}>
                            {formatDate(b.payment.paidAt || b.createdAt)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        ) : (
          /* TAB 2: QUẢN LÝ THẺ & PHƯƠNG THỨC THANH TOÁN */
          <View>
            <Text style={[S.muted, { marginBottom: 14 }]}>
              Secure payment methods saved to your account.
            </Text>

            {methods.map((item) => (
              <View key={item.id} style={[S.box, { marginBottom: 12 }]}>
                <View style={[S.row, { gap: 12 }]}>
                  <Ionicons
                    name="card-outline"
                    size={28}
                    color={item.isDefault ? c.p : c.m}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={S.row}>
                      <Text style={{ fontWeight: '700', fontSize: 16 }}>
                        {item.brand} •••• {item.last4}
                      </Text>
                      {item.isDefault ? (
                        <Text style={styles.defaultPill}>Default</Text>
                      ) : null}
                    </View>
                    <Text style={S.muted}>Expires {item.exp}</Text>
                  </View>
                  {item.isDefault ? (
                    <Ionicons name="checkmark-circle" size={22} color={c.p} />
                  ) : (
                    <Pressable
                      onPress={() =>
                        setMethods((prev) =>
                          prev.map((m) => ({ ...m, isDefault: m.id === item.id }))
                        )
                      }
                    >
                      <Text style={{ fontSize: 13, color: c.p, fontWeight: '600' }}>Make Default</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}

            <Btn
              title="Add payment method"
              icon="add-circle-outline"
              outline
              onPress={handleAddPayment}
              style={{ marginTop: 8 }}
            />
          </View>
        )}
      </ScrollView>

      {/* MODAL CHI TIẾT HÓA ĐƠN (RECEIPT / INVOICE MODAL) */}
      <Modal
        visible={!!selectedReceipt}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={[S.row, { justifyContent: 'space-between', marginBottom: 16 }]}>
              <View>
                <Text style={S.h2}>Payment Receipt</Text>
                <Text style={S.muted}>
                  Ref: #{selectedReceipt?.ref || selectedReceipt?.id}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedReceipt(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={c.t} />
              </Pressable>
            </View>

            {selectedReceipt ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Thông tin phòng */}
                <View style={styles.receiptSection}>
                  <Text style={[{ fontSize: 16, fontWeight: '700', color: c.t }, { marginBottom: 4 }]}>{selectedReceipt.listing.title}</Text>
                  <Text style={S.muted}>
                    {selectedReceipt.listing.city}, {selectedReceipt.listing.country}
                  </Text>
                  <Text style={{ fontSize: 13, marginTop: 4, color: c.t }}>
                    Stay: {selectedReceipt.checkIn} → {selectedReceipt.checkOut} ({selectedReceipt.nights} nights)
                  </Text>
                  <Text style={{ fontSize: 13, color: c.m }}>
                    Guests: {selectedReceipt.guests} guest(s)
                  </Text>
                </View>

                {/* Bảng kê giá tiền */}
                <View style={styles.receiptSection}>
                  <Text style={[{ fontSize: 16, fontWeight: '700', color: c.t }, { marginBottom: 8 }]}>Price Breakdown</Text>
                  <View style={[S.row, styles.priceRow]}>
                    <Text style={S.muted}>
                      ${selectedReceipt.price.nightly} x {selectedReceipt.nights} nights
                    </Text>
                    <Text style={{ fontWeight: '600' }}>
                      ${selectedReceipt.price.subtotal.toLocaleString()}
                    </Text>
                  </View>

                  {selectedReceipt.price.fees?.map((fee, idx) => (
                    <View key={idx} style={[S.row, styles.priceRow]}>
                      <Text style={S.muted}>{fee.label}</Text>
                      <Text style={{ fontWeight: '600' }}>${fee.amount.toLocaleString()}</Text>
                    </View>
                  ))}

                  <View style={[S.row, styles.priceRow, { borderTopWidth: 1, borderColor: c.soft, paddingTop: 8, marginTop: 4 }]}>
                    <Text style={{ fontWeight: '700', fontSize: 16 }}>Total Amount</Text>
                    <Text style={{ fontWeight: '700', fontSize: 16 }}>
                      ${selectedReceipt.price.total.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Thông tin thanh toán */}
                <View style={styles.receiptSection}>
                  <Text style={[{ fontSize: 16, fontWeight: '700', color: c.t }, { marginBottom: 8 }]}>Payment Details</Text>
                  <View style={[S.row, styles.priceRow]}>
                    <Text style={S.muted}>Amount Paid</Text>
                    <Text style={{ fontWeight: '700', color: c.p }}>
                      ${selectedReceipt.payment.amountPaid.toLocaleString()}
                    </Text>
                  </View>
                  {selectedReceipt.payment.balanceDue > 0 ? (
                    <View style={[S.row, styles.priceRow]}>
                      <Text style={S.muted}>Balance Due at Check-in</Text>
                      <Text style={{ fontWeight: '600', color: '#d97706' }}>
                        ${selectedReceipt.payment.balanceDue.toLocaleString()}
                      </Text>
                    </View>
                  ) : null}
                  <View style={[S.row, styles.priceRow]}>
                    <Text style={S.muted}>Payment Method</Text>
                    <Text style={{ textTransform: 'capitalize' }}>
                      {selectedReceipt.payment.method === 'full' ? 'Full Payment' : '50% Deposit'} ({selectedReceipt.payment.provider || 'Card'})
                    </Text>
                  </View>
                  <View style={[S.row, styles.priceRow]}>
                    <Text style={S.muted}>Payment Date</Text>
                    <Text>{formatDate(selectedReceipt.payment.paidAt || selectedReceipt.createdAt)}</Text>
                  </View>
                </View>

                <Btn
                  title="Close Receipt"
                  onPress={() => setSelectedReceipt(null)}
                  style={{ marginTop: 16, marginBottom: 8 }}
                />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: c.soft,
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: c.p,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.m,
  },
  tabTextActive: {
    color: c.p,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  receiptCard: {
    marginBottom: 12,
    padding: 12,
  },
  listingThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: c.soft,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  defaultPill: {
    fontSize: 11,
    fontWeight: '600',
    color: c.p,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  receiptSection: {
    borderBottomWidth: 1,
    borderBottomColor: c.soft,
    paddingVertical: 12,
  },
  priceRow: {
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
});
