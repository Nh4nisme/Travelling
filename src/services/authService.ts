import { api } from './api';
import type { User } from '@/store/types';

type AuthResponse = { token: string; user: User };

export const authService = {
  login: (email: string, password: string) =>
    api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),
  register: (p: { name: string; email: string; password: string; phone?: string }) =>
    api<AuthResponse>('/auth/register', { method: 'POST', body: p }),
  me: (token: string) => api<{ user: User }>('/auth/me', { token }),
};
