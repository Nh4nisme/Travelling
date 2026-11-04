import { api } from './api';
import { tokenStorage } from './tokenStorage';

export type PaymentMethodItem = {
  id: string;
  type: 'card';
  brand: string; // 'Visa' | 'Mastercard' | 'JCB' | 'Amex'
  last4: string;
  cardHolderName: string;
  exp: string;
  isDefault: boolean;
  createdAt?: string;
};

export type AddCardPayload = {
  cardNumber: string;
  cardHolderName: string;
  exp: string;
  cvv: string;
  isDefault?: boolean;
};

export const paymentService = {
  async getMethods(overrideToken?: string | null): Promise<PaymentMethodItem[]> {
    const token = overrideToken ?? (await tokenStorage.get());
    if (!token) return [];
    const res = await api<{ methods: PaymentMethodItem[] }>('/payments/methods', { token });
    return res.methods || [];
  },

  async addCard(
    payload: AddCardPayload,
    overrideToken?: string | null
  ): Promise<{ method: PaymentMethodItem; message: string }> {
    const token = overrideToken ?? (await tokenStorage.get());
    if (!token) throw new Error('Vui lòng đăng nhập để lưu phương thức thanh toán.');
    return api<{ method: PaymentMethodItem; message: string }>('/payments/methods', {
      method: 'POST',
      body: payload,
      token,
    });
  },

  async deleteCard(id: string, overrideToken?: string | null): Promise<void> {
    const token = overrideToken ?? (await tokenStorage.get());
    if (!token) throw new Error('Vui lòng đăng nhập.');
    await api<{ ok: boolean }>(`/payments/methods/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      token,
    });
  },

  async setDefault(id: string, overrideToken?: string | null): Promise<PaymentMethodItem> {
    const token = overrideToken ?? (await tokenStorage.get());
    if (!token) throw new Error('Vui lòng đăng nhập.');
    const res = await api<{ ok: boolean; method: PaymentMethodItem }>(
      `/payments/methods/${encodeURIComponent(id)}/default`,
      {
        method: 'PATCH',
        token,
      }
    );
    return res.method;
  },
};
