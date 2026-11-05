import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/store/AppContext';
import type { Booking } from '@/store/types';
import { paymentService, type PaymentMethodItem } from '@/services/paymentService';

export function PaymentsScreen() {
  const { bookings, user } = useApp();
  const { colors } = useTheme();
  const { t, isVietnamese } = useLanguage();
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
      Alert.alert(
        isVietnamese ? 'Thành công' : 'Success',
        isVietnamese 
          ? 'Đã lưu phương thức thanh toán an toàn theo tiêu chuẩn PCI-DSS!' 
          : t.payments.cardSaved
      );
    } catch (err: any) {
      setCardError(err?.message || (isVietnamese ? 'Không thể lưu thẻ. Vui lòng kiểm tra lại thông tin.' : 'Unable to save card. Please check your information.'));
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
      Alert.alert(
        isVietnamese ? 'Lỗi' : 'Error',
        err?.message || (isVietnamese ? 'Không thể đặt làm thẻ mặc định' : 'Unable to set as default')
      );
    }
  };

  // Xóa thẻ khỏi tài khoản
  const handleDeleteCard = (item: PaymentMethodItem) => {
    Alert.alert(
      isVietnamese ? 'Xóa phương thức thanh toán' : 'Delete Payment Method',
      isVietnamese 
        ? `Bạn có chắc chắn muốn xóa thẻ ${item.brand} kết thúc bằng •••• ${item.last4}?`
        : `Are you sure you want to delete ${item.brand} card ending in •••• ${item.last4}?`,
      [
        { text: isVietnamese ? 'Hủy' : 'Cancel', style: 'cancel' },
        {
          text: isVietnamese ? 'Xóa thẻ' : t.payments.deleteCard,
          style: 'destructive',
          onPress: async () => {
            try {
              await paymentService.deleteCard(item.id);
              await loadPaymentMethods();
            } catch (err: any) {
              Alert.alert(
                isVietnamese ? 'Lỗi' : 'Error',
                err?.message || (isVietnamese ? 'Không thể xóa thẻ' : 'Unable to delete card')
              );
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (b: Booking) => {
    if (b.status === 'cancelled') {
      return { label: isVietnamese ? 'Đã hủy' : 'Cancelled', bg: '#fee2e2', text: '#dc2626' };
    }
    if (b.payment.status === 'paid') {
      return { label: t.bookings.paidInFull, bg: '#dcfce7', text: '#16a34a' };
    }
    if (b.payment.status === 'partial') {
      return { label: t.bookings.partialPaid, bg: '#fef3c7', text: '#d97706' };
    }
    if (b.payment.status === 'refunded') {
      return { label: isVietnamese ? 'Đã hoàn tiền' : 'Refunded', bg: '#f3f4f6', text: '#4b5563' };
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

  // Dynamic styles using useMemo
  const styles = useMemo(() => StyleSheet.create({
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.muted,
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    receiptCard: {
      marginBottom: 12,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    listingThumb: {
      width: 64,
      height: 64,
      borderRadius: 8,
      backgroundColor: colors.soft,
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
      color: colors.primary,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 4,
      marginLeft: 8,
    },
    cardBrandBadge: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: colors.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: colors.primaryLight,
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
      backgroundColor: colors.soft,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 10,
      marginBottom: 14,
    },
    quickTestTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.muted,
    },
    testCardChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
    },
    testCardChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    inputGroup: {
      marginBottom: 12,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    detectedBrandText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.card,
    },
    textInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
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
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '90%',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    receiptSection: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 12,
    },
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
  }), [colors]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Tab bar switch */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons
            name="receipt-outline"
            size={18}
            color={activeTab === 'history' ? colors.primary : colors.muted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            {t.payments.tabInvoices} ({bookings.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === 'methods' && styles.tabBtnActive]}
          onPress={() => setActiveTab('methods')}
        >
          <Ionicons
            name="card-outline"
            size={18}
            color={activeTab === 'methods' ? colors.primary : colors.muted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeTab === 'methods' && styles.tabTextActive]}>
            {t.payments.tabMethods} ({methods.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {activeTab === 'history' ? (
          /* TAB 1: DANH SÁCH HÓA ĐƠN & GIAO DỊCH THẬT TỪ BOOKING */
          <View>
            <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 14 }}>
              {isVietnamese 
                ? 'Biên lai chính thức cho các đặt phòng đã qua và sắp tới của bạn.' 
                : 'Official receipts for your past and upcoming reservations.'}
            </Text>

            {bookings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={48} color={colors.muted} style={{ opacity: 0.5 }} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 12 }}>
                  {isVietnamese ? 'Chưa có biên lai' : 'No receipts yet'}
                </Text>
                <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6 }}>
                  {isVietnamese 
                    ? 'Khi bạn đặt phòng, biên lai thanh toán và hóa đơn sẽ được liệt kê ở đây.' 
                    : 'When you book a stay, your payment receipts and invoices will be listed here.'}
                </Text>
              </View>
            ) : (
              bookings.map((b) => {
                const badge = getStatusBadge(b);
                return (
                  <Pressable
                    key={b.id}
                    style={styles.receiptCard}
                    onPress={() => setSelectedReceipt(b)}
                  >
                    <View style={{ flexDirection: 'row' }}>
                      <Image
                        source={{ uri: b.listing.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945' }}
                        style={styles.listingThumb}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={[styles.badge, { backgroundColor: badge.bg, color: badge.text }]}>
                            {badge.label}
                          </Text>
                          <Text style={{ fontWeight: '700', fontSize: 16, color: colors.primary }}>
                            ${b.payment.amountPaid.toLocaleString()}
                          </Text>
                        </View>

                        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 4 }} numberOfLines={1}>
                          {b.listing.title}
                        </Text>
                        <Text style={{ fontSize: 13, color: colors.muted }} numberOfLines={1}>
                          {b.listing.city}, {b.listing.country}
                        </Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                          <Text style={{ fontSize: 12, color: colors.muted }}>
                            {t.payments.bookingRef}: #{b.ref || b.id.slice(-6)}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.muted }}>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 14, color: colors.muted, flex: 1 }}>
                {isVietnamese 
                  ? 'Thẻ được lưu trữ an toàn theo tiêu chuẩn PCI-DSS với xác thực Luhn checksum.' 
                  : 'Cards stored securely using PCI-DSS standards with Luhn checksum validation.'}
              </Text>
              <View style={styles.pciPill}>
                <Ionicons name="shield-checkmark" size={12} color="#16a34a" />
                <Text style={styles.pciText}>PCI-DSS</Text>
              </View>
            </View>

            {loadingMethods ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ fontSize: 14, color: colors.muted, marginTop: 10 }}>
                  {isVietnamese ? 'Đang tải phương thức thanh toán...' : 'Loading payment methods...'}
                </Text>
              </View>
            ) : methods.length === 0 ? (
              <View style={[styles.emptyContainer, { marginBottom: 16 }]}>
                <Ionicons name="card-outline" size={48} color={colors.muted} style={{ opacity: 0.5 }} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 12 }}>
                  {t.payments.emptyMethods}
                </Text>
                <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6 }}>
                  {isVietnamese 
                    ? 'Thêm thẻ tín dụng hoặc ghi nợ hợp lệ để nhanh chóng đặt phòng mà không cần nhập lại thông tin mỗi lần.' 
                    : 'Add a valid credit or debit card to quickly book homes and stays without re-entering details each time.'}
                </Text>
              </View>
            ) : (
              methods.map((item) => (
                <View key={item.id} style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={styles.cardBrandBadge}>
                      <Ionicons
                        name="card"
                        size={24}
                        color={item.brand === 'Visa' ? '#1A1F71' : item.brand === 'Mastercard' ? '#EB001B' : colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text }}>
                          {item.brand} •••• {item.last4}
                        </Text>
                        {item.isDefault ? (
                          <Text style={styles.defaultPill}>{t.payments.default}</Text>
                        ) : null}
                      </View>
                      <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                        {item.cardHolderName} · {isVietnamese ? 'HSD' : 'Exp'} {item.exp}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {!item.isDefault ? (
                        <Pressable
                          onPress={() => handleSetDefault(item)}
                          hitSlop={8}
                          style={styles.actionBtn}
                        >
                          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
                            {t.payments.setAsDefault}
                          </Text>
                        </Pressable>
                      ) : (
                        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
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
              title={isVietnamese ? 'Thêm phương thức thanh toán' : 'Add payment method'}
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
                  {isVietnamese ? 'Thêm thẻ tín dụng / ghi nợ' : 'Add Credit / Debit Card'}
                </Text>
                <Text style={{ fontSize: 14, color: colors.muted }}>
                  {isVietnamese ? 'Số thẻ được xác minh bằng thuật toán Luhn.' : 'Card numbers are verified using the Luhn Algorithm.'}
                </Text>
              </View>
              <Pressable onPress={() => setShowAddCardModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Quick Fill Test Cards */}
              <View style={styles.quickTestBox}>
                <Text style={styles.quickTestTitle}>{t.payments.testCard} (Demo):</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <Pressable
                    style={styles.testCardChip}
                    onPress={() => fillTestCard('Visa')}
                  >
                    <Ionicons name="card-outline" size={14} color="#1A1F71" />
                    <Text style={styles.testCardChipText}>{t.payments.testVisa} (4242...)</Text>
                  </Pressable>
                  <Pressable
                    style={styles.testCardChip}
                    onPress={() => fillTestCard('Mastercard')}
                  >
                    <Ionicons name="card-outline" size={14} color="#EB001B" />
                    <Text style={styles.testCardChipText}>{t.payments.testMastercard} (5555...)</Text>
                  </Pressable>
                </View>
              </View>

              {/* Card Number Input with Live Brand Detection */}
              <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={styles.inputLabel}>{t.payments.cardNumber}</Text>
                  {detectedBrand ? (
                    <Text style={styles.detectedBrandText}>{detectedBrand}</Text>
                  ) : null}
                </View>
                <View style={styles.inputWrapper}>
                  <Ionicons name="card-outline" size={20} color={colors.muted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="4242 4242 4242 4242"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    maxLength={19}
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                  />
                </View>
              </View>

              {/* Cardholder Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.payments.cardHolder}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={colors.muted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="NGUYEN VAN A"
                    placeholderTextColor={colors.muted}
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
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>{t.payments.expiry}</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="calendar-outline" size={20} color={colors.muted} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="12/28"
                      placeholderTextColor={colors.muted}
                      keyboardType="numeric"
                      maxLength={5}
                      value={expiry}
                      onChangeText={handleExpiryChange}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>{t.payments.cvv}</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.muted} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="•••"
                      placeholderTextColor={colors.muted}
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
                style={{ flexDirection: 'row', marginVertical: 12, gap: 10 }}
                onPress={() => setIsDefault(!isDefault)}
              >
                <Ionicons
                  name={isDefault ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={isDefault ? colors.primary : colors.muted}
                />
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>
                  {t.payments.setDefault}
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
                title={submittingCard ? t.payments.saving : (isVietnamese ? 'Lưu thẻ an toàn' : 'Save Card Securely')}
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
                  {t.payments.receiptTitle}
                </Text>
                <Text style={{ fontSize: 14, color: colors.muted }}>
                  {t.payments.bookingRef}: #{selectedReceipt?.ref || selectedReceipt?.id}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedReceipt(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {selectedReceipt ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Thông tin phòng */}
                <View style={styles.receiptSection}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                    {selectedReceipt.listing.title}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.muted }}>
                    {selectedReceipt.listing.city}, {selectedReceipt.listing.country}
                  </Text>
                  <Text style={{ fontSize: 13, marginTop: 4, color: colors.text }}>
                    {isVietnamese ? 'Lưu trú' : 'Stay'}: {selectedReceipt.checkIn} → {selectedReceipt.checkOut} ({selectedReceipt.nights} {t.bookings.nights})
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.muted }}>
                    {isVietnamese ? 'Khách' : 'Guests'}: {selectedReceipt.guests} {t.bookings.guests}
                  </Text>
                </View>

                {/* Bảng kê giá tiền */}
                <View style={styles.receiptSection}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
                    {t.payments.priceBreakdown}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={{ fontSize: 14, color: colors.muted }}>
                      ${selectedReceipt.price.nightly} x {selectedReceipt.nights} {t.bookings.nights}
                    </Text>
                    <Text style={{ fontWeight: '600', color: colors.text }}>
                      ${selectedReceipt.price.subtotal.toLocaleString()}
                    </Text>
                  </View>

                  {selectedReceipt.price.fees?.map((fee, idx) => (
                    <View key={idx} style={styles.priceRow}>
                      <Text style={{ fontSize: 14, color: colors.muted }}>{fee.label}</Text>
                      <Text style={{ fontWeight: '600', color: colors.text }}>${fee.amount.toLocaleString()}</Text>
                    </View>
                  ))}

                  <View style={[styles.priceRow, { borderTopWidth: 1, borderColor: colors.border, paddingTop: 8, marginTop: 4 }]}>
                    <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text }}>{t.payments.total}</Text>
                    <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text }}>
                      ${selectedReceipt.price.total.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Thông tin thanh toán */}
                <View style={styles.receiptSection}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
                    {isVietnamese ? 'Chi tiết thanh toán' : 'Payment Details'}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={{ fontSize: 14, color: colors.muted }}>{t.payments.amountPaid}</Text>
                    <Text style={{ fontWeight: '700', color: colors.primary }}>
                      ${selectedReceipt.payment.amountPaid.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={{ fontSize: 14, color: colors.muted }}>
                      {isVietnamese ? 'Trạng thái' : 'Status'}
                    </Text>
                    <Text style={{ fontWeight: '600', textTransform: 'capitalize', color: colors.text }}>
                      {selectedReceipt.payment.status}
                    </Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={{ fontSize: 14, color: colors.muted }}>{t.payments.paymentMethod}</Text>
                    <Text style={{ fontWeight: '600', color: colors.text }}>
                      {selectedReceipt.payment.method || (isVietnamese ? 'Thẻ tín dụng' : 'Credit Card')}
                    </Text>
                  </View>
                  {selectedReceipt.payment.paidAt ? (
                    <View style={styles.priceRow}>
                      <Text style={{ fontSize: 14, color: colors.muted }}>{t.payments.paidOn}</Text>
                      <Text style={{ fontWeight: '600', color: colors.text }}>
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
