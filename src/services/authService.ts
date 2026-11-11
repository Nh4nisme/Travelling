import { api } from './api';
import type { User } from '@/store/types';

export type AuthResponse = { token: string; user: User };

export type CheckEmailResponse = {
  exists: boolean;
  message?: string;
};

export type SendOtpResponse = {
  message: string;
  expiresInSeconds: number;
};

export type VerifyOtpResponse = {
  verified: boolean;
  verificationToken: string;
  message: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  verificationToken?: string;
};

export const authService = {
  checkEmail: (email: string) =>
    api<CheckEmailResponse>('/auth/check-email', {
      method: 'POST',
      body: { email },
    }),

  sendOtp: (email: string) =>
    api<SendOtpResponse>('/auth/send-otp', {
      method: 'POST',
      body: { email },
    }),

  verifyOtp: (email: string, otp: string) =>
    api<VerifyOtpResponse>('/auth/verify-otp', {
      method: 'POST',
      body: { email, otp },
    }),

  register: (p: RegisterPayload) =>
    api<AuthResponse>('/auth/register', {
      method: 'POST',
      body: p,
    }),

  login: (email: string, password: string) =>
    api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  me: (token: string) => api<{ user: User }>('/auth/me', { token }),
};
