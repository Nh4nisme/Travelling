import { ENV } from '@/config/env';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

type Options = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown; token?: string | null; timeoutMs?: number };

export async function api<T>(path: string, { method = 'GET', body, token, timeoutMs = 15000 }: Options = {}): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${ENV.apiUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError((data as any)?.message ?? 'Đã có lỗi xảy ra', res.status);
    return data as T;
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    if (e?.name === 'AbortError') throw new ApiError('Máy chủ phản hồi quá lâu, vui lòng thử lại');
    throw new ApiError(`Không kết nối được máy chủ tại ${ENV.apiUrl}. Kiểm tra máy chủ đang chạy và cấu hình EXPO_PUBLIC_API_URL cho simulator/thiết bị.`);
  } finally {
    clearTimeout(timer);
  }
}
