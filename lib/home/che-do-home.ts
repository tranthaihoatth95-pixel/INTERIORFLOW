/**
 * lib/home/che-do-home.ts — CHẾ ĐỘ MÀN HÌNH CHÍNH (§4).
 *
 * Trang chủ là **NƠI CHỐN CỦA MỘT CON NGƯỜI**, không phải bảng điều khiển. Thứ tự đọc chính tắc:
 *   KHÔNG KHÍ → MỘT ĐÍCH TIẾP TỤC → KỆ DỰ ÁN → CẢM HỨNG
 * Bốn dải, theo đúng thứ tự đó, và **không có tường widget** chen vào giữa.
 *
 * ⚖️ VÌ SAO CÓ CHẾ ĐỘ CHỨ KHÔNG XOÁ THẲNG các widget cũ: chúng đang chạy thật và có người dùng.
 * Bỏ hẳn là phá chức năng để chiều một bố cục. Nên: **mặc định `calm`** (bốn dải, sạch), còn
 * `custom` giữ NGUYÊN VẸN bố cục hai cột cũ cho ai đã quen. Không chế độ nào là "bản cắt xén".
 */

export type CheDoHome = 'calm' | 'editorial' | 'compact' | 'custom';

export const CHE_DO_HOME: readonly CheDoHome[] = ['calm', 'editorial', 'compact', 'custom'] as const;

export const NHAN_CHE_DO: Record<CheDoHome, { vi: string; en: string; moTa: [string, string] }> = {
  calm: { vi: 'Điềm tĩnh', en: 'Calm', moTa: ['Bốn dải, nhiều khoảng thở', 'Four bands, generous breathing room'] },
  editorial: { vi: 'Biên tập', en: 'Editorial', moTa: ['Chữ lớn hơn, ảnh mạnh hơn', 'Larger type, stronger imagery'] },
  compact: { vi: 'Gọn', en: 'Compact', moTa: ['Cùng thứ tự, ít khoảng trống hơn', 'Same order, tighter spacing'] },
  custom: { vi: 'Tự sắp', en: 'Custom', moTa: ['Bố cục hai cột cũ + tự chọn widget', 'The older two-column layout + widget picker'] },
};

/** Ba chế độ đầu dùng CHUNG một thứ tự đọc; chúng chỉ khác MẬT ĐỘ, không khác cấu trúc. */
export function laBonDai(c: CheDoHome): boolean {
  return c !== 'custom';
}

/** Mật độ theo chế độ — px. Cùng bố cục, khác nhịp thở. */
export function nhipDai(c: CheDoHome): { gap: number; leTren: number; coChu: number } {
  if (c === 'compact') return { gap: 16, leTren: 18, coChu: 34 };
  if (c === 'editorial') return { gap: 34, leTren: 48, coChu: 52 };
  return { gap: 26, leTren: 36, coChu: 44 };
}

const KHOA = 'interiorflow.home.cheDo_v1';

export function docCheDo(): CheDoHome {
  if (typeof localStorage === 'undefined') return 'calm';
  const v = localStorage.getItem(KHOA);
  return (CHE_DO_HOME as readonly string[]).includes(v ?? '') ? (v as CheDoHome) : 'calm';
}

export function ghiCheDo(c: CheDoHome): void {
  try {
    localStorage.setItem(KHOA, c);
  } catch {
    /* chế độ xem là sở thích của MÁY NÀY; ghi hỏng thì thôi, không chặn việc */
  }
}
