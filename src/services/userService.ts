import { api } from './api';
import type { User } from '@/store/types';

export type UpdateUserPayload = { name?: string; phone?: string };

type UpdateUserResponse = { user: User };

export const userService = {
  getProfile: (token: string) => api<{ user: User }>('/auth/me', { token }),
  updateProfile: (payload: UpdateUserPayload, token: string) =>
    api<UpdateUserResponse>('/auth/me', { method: 'PATCH', body: payload, token }),
};
