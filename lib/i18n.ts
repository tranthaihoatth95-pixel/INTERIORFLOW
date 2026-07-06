/**
 * lib/i18n.ts — Cơ chế song ngữ VI/EN GỌN cho demo (không thư viện nặng).
 *
 * Ý tưởng: mỗi chuỗi khai ngay tại chỗ dùng — `t(lang, vi, en)`. Không tách file
 * dictionary khổng lồ; chỉ dịch các CHUỖI CHÍNH ở màn demo hay thấy.
 *
 * Nguồn chân lý ngôn ngữ: `lang` trong lib/store.ts (persist localStorage
 * 'interiorflow.lang'). Component lấy qua hook `useLang()` rồi `t(lang, vi, en)`
 * — hoặc tiện hơn: `const tr = useT(); tr('Chạy', 'Run')`.
 *
 * LUẬT font vẫn giữ: sans hiện đại, không serif. i18n chỉ đổi text, không đụng style.
 */
'use client';

import { useFlowStore } from '@/lib/store';

export type Lang = 'vi' | 'en';

export const LANG_KEY = 'interiorflow.lang';
export const DEFAULT_LANG: Lang = 'vi';

export function isLang(v: unknown): v is Lang {
  return v === 'vi' || v === 'en';
}

/** Chọn chuỗi theo ngôn ngữ. `t('vi'|'en', 'chuỗi VI', 'chuỗi EN')`. */
export function t(lang: Lang, vi: string, en: string): string {
  return lang === 'en' ? en : vi;
}

/** Hook lấy ngôn ngữ hiện tại từ store (re-render khi đổi). */
export function useLang(): Lang {
  return useFlowStore((s) => s.lang);
}

/**
 * Hook tiện: trả về hàm `tr(vi, en)` đã gắn sẵn ngôn ngữ hiện tại.
 * @example const tr = useT(); <span>{tr('Chạy flow', 'Run flow')}</span>
 */
export function useT(): (vi: string, en: string) => string {
  const lang = useLang();
  return (vi: string, en: string) => t(lang, vi, en);
}
