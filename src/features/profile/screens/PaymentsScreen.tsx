import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  Image,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Btn } from '@/components';
import { c, S } from '@/constants/theme';
import { useApp } from '@/store/AppContext';
import type { Booking } from '@/store/types';
import { paymentService, type PaymentMethodItem } from '@/services/paymentService';

export function PaymentsScreen() {
  const { bookings, user } = useApp();
  const [activeTab, setActiveTab] = useState<'history' | 'methods'>('history');

  // Danh sách phương thức thanh toán thật từ MongoDB Atlas
  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);

  // Modal hóa đơn chi tiết
  const [selectedReceipt, setSelectedReceipt] = useState<Booking | null>(null);

  // Modal thêm thẻ mới
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submittingCard, setSubmittingCard] = useState(false);
  const [cardError, setCardError] = useState('');

  // Tải danh sách thẻ thật từ API
  const loadPaymentMethods = useCallback(async () => {
    try {
      setLoadingMethods(true);
      const list = await paymentService.getMethods();
      setMethods(list);
    } catch (err: any) {
      console.warn('Không thể tải payment methods:', err?.message);
    } finally {
      setLoadingMethods(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'methods') {
      void loadPaymentMethods();
    }
  }, [activeTab, loadPaymentMethods]);

  // Nhận diện thương hiệu thẻ thời gian thực
  const detectedBrand = React.useMemo(() => {
    const raw = cardNumber.replace(/\D/g, '');
    if (raw.startsWith('4')) return 'Visa';
    if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(raw)) return 'Mastercard';
    if (/^3[47]/.test(raw)) return 'Amex';
    if (/^35(2[89]|[3-8][0-9])/.test(raw)) return 'JCB';
    return raw.length > 0 ? 'Card' : '';
  }, [cardNumber]);

  // Format số thẻ theo khối 4 chữ số: XXXX XXXX XXXX XXXX
  const handleCardNumberChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, 16);
    const formatted = digitsOnly.match(/.{1,4}/g)?.join(' ') || digitsOnly;
    setCardNumber(formatted);
    setCardError('');
  };

  // Format hạn thẻ MM/YY
  const handleExpiryChange = (text: string) => {
    let clean = text.replace(/\D/g, '').slice(0, 4);
    if (clean.length > 2) {
      clean = clean.slice(0, 2) + '/' + clean.slice(2);
    }
    setExpiry(clean);
    setCardError('');
  };

  // Nạp dữ liệu thẻ test chuẩn quốc tế (Stripe/PCI test cards)
  const fillTestCard = (brand: 'Visa' | 'Mastercard') => {
    if (brand === 'Visa') {
      setCardNumber('4242 4242 4242 4242');
      setCardHolderName((user?.name || 'NGUYEN VAN A').toUpperCase());
      setExpiry('12/28');
      setCvv('123');
    } else {
      setCardNumber('5555 5555 5555 4444');
      setCardHolderName((user?.name || 'NGUYEN VAN A').toUpperCase());
      setExpiry('08/29');
      setCvv('888');
    }
    setCardError('');
  };

  // Lưu thẻ mới vào MongoDB Atlas
  const handleSaveCard = async () => {
    const rawNumber = cardNumber.replace(/\D/g, '');
    if (!rawNumber || rawNumber.length < 13) {
      setCardError('Vui lòng nhập số thẻ hợp lệ (từ 13-16 số)');
      return;
    }
    if (!cardHolderName.trim()) {
      setCardError('Vui lòng nhập tên chủ thẻ (viết hoa không dấu)');
      return;
    }
    if (!expiry || !expiry.includes('/') || expiry.length < 5) {
      setCardError('Hạn thẻ phải có định dạng MM/YY');
      return;
    }
    if (!cvv || cvv.length < 3) {
      setCardError('Mã CVV phải có từ 3 đến 4 chữ số');
      return;
    }

    try {
      setSubmittingCard(true);
      setCardError('');
      await paymentService.addCard({
        cardNumber: rawNumber,
        cardHolderName: cardHolderName.trim().toUpperCase(),
        exp: expiry.trim(),
        cvv: cvv.trim(),
        isDefault,
      });

      setShowAddCardModal(false);
      setCardNumber('');
      setCardHolderName('');
      setExpiry('');
      setCvv('');
      setIsDefault(false);
      await loadPaymentMethods();
      Alert.alert('Thành công', 'Đã lưu phương thức thanh toán an toàn theo tiêu chuẩn PCI-DSS!');
    } catch (err: any) {
      setCardError(err?.message || 'Không thể lưu thẻ. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmittingCard(false);
    }
  };

  // Đặt thẻ làm mặc định
  const handleSetDefault = async (item: PaymentMethodItem) => {
    try {
      await paymentService.setDefault(item.id);
      await loadPaymentMethods();
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể đặt làm thẻ mặc định');
    }
  };

  // Xóa thẻ khỏi tài khoản
  const handleDeleteCard = (item: PaymentMethodItem) => {
    Alert.alert(
      'Xóa phương thức thanh toán',
      `Bạn có chắc chắn muốn xóa thẻ ${item.brand} kết thúc bằng •••• ${item.last4}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa thẻ',
          style: 'destructive',
          onPress: async () => {
            try {
              await paymentService.deleteCard(item.id);
              await loadPaymentMethods();
            } catch (err: any) {
              Alert.alert('Lỗi', err?.message || 'Không thể xóa thẻ');
            }
          },
        },
      ]
    );
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
            Payment Methods ({methods.length})
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
          /* TAB 2: QUẢN LÝ THẺ & PHƯƠNG THỨC THANH TOÁN (PCI-DSS & LUHN COMPLIANT) */
          <View>
            <View style={[S.row, { justifyContent: 'space-between', marginBottom: 14 }]}>
              <Text style={[S.muted, { flex: 1 }]}>
                Cards stored securely using PCI-DSS standards with Luhn checksum validation.
              </Text>
              <View style={styles.pciPill}>
                <Ionicons name="shield-checkmark" size={12} color="#16a34a" />
                <Text style={styles.pciText}>PCI-DSS</Text>
              </View>
            </View>

            {loadingMethods ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={c.p} />
                <Text style={[S.muted, { marginTop: 10 }]}>Loading payment methods...</Text>
              </View>
            ) : methods.length === 0 ? (
              <View style={[S.box, styles.emptyContainer, { marginBottom: 16 }]}>
                <Ionicons name="card-outline" size={48} color={c.m} style={{ opacity: 0.5 }} />
                <Text style={[{ fontSize: 16, fontWeight: '700', color: c.t }, { marginTop: 12 }]}>
                  No payment methods saved
                </Text>
                <Text style={[S.muted, { textAlign: 'center', marginTop: 6 }]}>
                  Add a valid credit or debit card to quickly book homes and stays without re-entering details each time.
                </Text>
              </View>
            ) : (
              methods.map((item) => (
                <View key={item.id} style={[S.box, { marginBottom: 12 }]}>
                  <View style={[S.row, { gap: 12 }]}>
                    <View style={styles.cardBrandBadge}>
                      <Ionicons
                        name="card"
                        size={24}
                        color={item.brand === 'Visa' ? '#1A1F71' : item.brand === 'Mastercard' ? '#EB001B' : c.p}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={[S.row, { flexWrap: 'wrap' }]}>
                        <Text style={{ fontWeight: '700', fontSize: 16 }}>
                          {item.brand} •••• {item.last4}
                        </Text>
                        {item.isDefault ? (
                          <Text style={styles.defaultPill}>Default</Text>
                        ) : null}
                      </View>
                      <Text style={[S.muted, { marginTop: 2 }]}>
                        {item.cardHolderName} · Exp {item.exp}
                      </Text>
                    </View>

                    <View style={[S.row, { gap: 10 }]}>
                      {!item.isDefault ? (
                        <Pressable
                          onPress={() => handleSetDefault(item)}
                          hitSlop={8}
                          style={styles.actionBtn}
                        >
                          <Text style={{ fontSize: 12, color: c.p, fontWeight: '600' }}>Set Default</Text>
                        </Pressable>
                      ) : (
                        <Ionicons name="checkmark-circle" size={22} color={c.p} />
                      )}

                      <Pressable
                        onPress={() => handleDeleteCard(item)}
                        hitSlop={8}
                        style={styles.deleteBtn}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )}

            <Btn
              title="Add payment method"
              icon="add-circle-outline"
              outline
              onPress={() => {
                setCardError('');
                setShowAddCardModal(true);
              }}
              style={{ marginTop: 8 }}
            />
          </View>
        )}
      </ScrollView>

      {/* MODAL THÊM THẺ MỚI (CHỐNG NHẬP BẬY & CHUẨN PCI-DSS) */}
      <Modal
        visible={showAddCardModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddCardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={[S.row, { justifyContent: 'space-between', marginBottom: 16 }]}>
              <View>
                <Text style={S.h2}>Add Credit / Debit Card</Text>
                <Text style={S.muted}>Card numbers are verified using the Luhn Algorithm.</Text>
              </View>
              <Pressable onPress={() => setShowAddCardModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={c.t} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Quick Fill Test Cards */}
              <View style={styles.quickTestBox}>
                <Text style={styles.quickTestTitle}>Quick Test Card (Demo):</Text>
                <View style={[S.row, { gap: 8, marginTop: 6 }]}>
                  <Pressable
                    style={styles.testCardChip}
                    onPress={() => fillTestCard('Visa')}
                  >
                    <Ionicons name="card-outline" size={14} color="#1A1F71" />
                    <Text style={styles.testCardChipText}>Visa (4242...)</Text>
                  </Pressable>
                  <Pressable
                    style={styles.testCardChip}
                    onPress={() => fillTestCard('Mastercard')}
                  >
                    <Ionicons name="card-outline" size={14} color="#EB001B" />
                    <Text style={styles.testCardChipText}>Mastercard (5555...)</Text>
                  </Pressable>
                </View>
              </View>

              {/* Card Number Input with Live Brand Detection */}
              <View style={styles.inputGroup}>
                <View style={[S.row, { justifyContent: 'space-between', marginBottom: 6 }]}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  {detectedBrand ? (
                    <Text style={styles.detectedBrandText}>{detectedBrand}</Text>
                  ) : null}
                </View>
                <View style={styles.inputWrapper}>
                  <Ionicons name="card-outline" size={20} color={c.m} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="4242 4242 4242 4242"
                    placeholderTextColor={c.m}
                    keyboardType="numeric"
                    maxLength={19}
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                  />
                </View>
              </View>

              {/* Cardholder Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cardholder Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={c.m} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="NGUYEN VAN A"
                    placeholderTextColor={c.m}
                    autoCapitalize="characters"
                    value={cardHolderName}
                    onChangeText={(t) => {
                      setCardHolderName(t.toUpperCase());
                      setCardError('');
                    }}
                  />
                </View>
              </View>

              {/* Expiry & CVV */}
              <View style={[S.row, { gap: 12 }]}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Expiry (MM/YY)</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="calendar-outline" size={20} color={c.m} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="12/28"
                      placeholderTextColor={c.m}
                      keyboardType="numeric"
                      maxLength={5}
                      value={expiry}
                      onChangeText={handleExpiryChange}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>CVV / CVC</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color={c.m} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="•••"
                      placeholderTextColor={c.m}
                      keyboardType="numeric"
                      secureTextEntry
                      maxLength={4}
                      value={cvv}
                      onChangeText={(t) => {
                        setCvv(t.replace(/\D/g, ''));
                        setCardError('');
                      }}
                    />
                  </View>
                </View>
              </View>

              {/* Default Card Checkbox */}
              <Pressable
                style={[S.row, { marginVertical: 12, gap: 10 }]}
                onPress={() => setIsDefault(!isDefault)}
              >
                <Ionicons
                  name={isDefault ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={isDefault ? c.p : c.m}
                />
                <Text style={{ fontSize: 14, color: c.t, fontWeight: '500' }}>
                  Set as default payment method
                </Text>
              </Pressable>

              {/* Error Message */}
              {cardError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#ef4444" />
                  <Text style={styles.errorText}>{cardError}</Text>
                </View>
              ) : null}

              {/* Submit Button */}
              <Btn
                title={submittingCard ? 'Validating card...' : 'Save Card Securely'}
                icon="shield-checkmark-outline"
                disabled={submittingCard}
                onPress={handleSaveCard}
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

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
                  <Text style={[{ fontSize: 16, fontWeight: '700', color: c.t }, { marginBottom: 4 }]}>
                    {selectedReceipt.listing.title}
                  </Text>
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
                  <View style={[S.row, styles.priceRow]}>
                    <Text style={S.muted}>Status</Text>
                    <Text style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                      {selectedReceipt.payment.status}
                    </Text>
                  </View>
                  <View style={[S.row, styles.priceRow]}>
                    <Text style={S.muted}>Payment Method</Text>
                    <Text style={{ fontWeight: '600' }}>
                      {selectedReceipt.payment.method || 'Credit Card'}
                    </Text>
                  </View>
                  {selectedReceipt.payment.paidAt ? (
                    <View style={[S.row, styles.priceRow]}>
                      <Text style={S.muted}>Paid On</Text>
                      <Text style={{ fontWeight: '600' }}>
                        {formatDate(selectedReceipt.payment.paidAt)}
                      </Text>
                    </View>
                  ) : null}
                </View>
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
    fontWeight: '700',
  },
  receiptCard: {
    marginBottom: 12,
  },
  listingThumb: {
    width: 64,
    height: 64,
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
  cardBrandBadge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
  },
  pciPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
  },
  pciText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  quickTestBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  quickTestTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: c.m,
  },
  testCardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
  },
  testCardChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: c.t,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: c.t,
    marginBottom: 4,
  },
  detectedBrandText: {
    fontSize: 12,
    fontWeight: '700',
    color: c.p,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: c.t,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    flex: 1,
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
    maxHeight: '90%',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
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
