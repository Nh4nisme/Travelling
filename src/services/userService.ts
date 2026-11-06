import { api } from './api';
import type { User } from '@/store/types';

export type UpdateUserPayload = { name?: string; phone?: string };

type UpdateUserResponse = { user: User };

export const userService = {
  getProfile: (token: string) => api<{ user: User }>('/auth/me', { token }),
  updateProfile: (payload: UpdateUserPayload, token: string) =>
    api<UpdateUserResponse>('/auth/me', { method: 'PATCH', body: payload, token }),
  toggleFavorite: (listingId: string, token: string) =>
    api<{ favorites: string[] }>(`/auth/favorites/${listingId}`, { method: 'POST', token }),
  
  // Set/Update Payment PIN
  setPaymentPin: (currentPin: string | null, newPin: string, token: string) =>
    api<{ message: string; user: User }>('/auth/payment-pin', {
      method: 'POST',
      body: { currentPin, newPin },
      token,
    }),
  
  // Verify Payment PIN
  verifyPaymentPin: (pin: string, token: string) =>
    api<{ valid: boolean; message: string }>('/auth/verify-payment-pin', {
      method: 'POST',
      body: { pin },
      token,
    }),

  // Change Password
  changePassword: (currentPassword: string, newPassword: string, token: string) =>
    api<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
      token,
    }),
};
