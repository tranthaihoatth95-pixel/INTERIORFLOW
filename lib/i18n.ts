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
import { type Lang, t } from '@/lib/lang';

// Re-export hằng số thuần từ lib/lang (giữ import cũ `from '@/lib/i18n'` chạy được).
export { type Lang, LANG_KEY, DEFAULT_LANG, isLang, t } from '@/lib/lang';

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
