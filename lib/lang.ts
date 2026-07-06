/**
 * lib/lang.ts — hằng số ngôn ngữ THUẦN (không phụ thuộc store) để phá vòng import
 * store ↔ i18n. store.ts import từ đây; i18n.ts (chứa hook) import store + đây.
 */
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
