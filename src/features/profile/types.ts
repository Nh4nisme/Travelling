import type { Ionicons } from '@expo/vector-icons';
import type { ReportCategoryId } from '@/services/supportService';

type IconName = keyof typeof Ionicons.glyphMap;

export type ThemeOption = 'light' | 'dark' | 'system';

export type SettingsState = { theme: ThemeOption; language: string };

export type PersonalInfoFormState = { name: string; phone: string };

// ---- Help Center ----

export type FaqCategoryId = 'booking' | 'payments' | 'cancellations' | 'account' | 'stays' | 'safety';

export type FaqCategory = { id: FaqCategoryId; title: string; icon: IconName };

export type FaqItem = {
  id: string;
  category: FaqCategoryId;
  question: string;
  answer: string;
  /** Từ khoá phụ để tìm kiếm (từ đồng nghĩa, cách gọi khác). */
  keywords?: string[];
  /** Hiển thị ở mục "Popular questions" trên trang chủ Help Center. */
  popular?: boolean;
};

export type ReportCategory = { id: ReportCategoryId; label: string; icon: IconName };
