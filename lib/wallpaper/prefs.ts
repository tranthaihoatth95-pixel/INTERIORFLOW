/**
 * lib/wallpaper/prefs.ts — [marker: chonBoHinhNen] lưu lựa chọn bộ + nấc giảm chói.
 *
 * ⚠️ Đây là **lớp ② của hệ màu 3 lớp** (chốt 16/08 B13): *màu VỎ LÀM VIỆC — KTS chọn TRONG
 * BIÊN*. Không đụng lớp ① (màu của IF: logo · màn khoá · bộ cài) và không đụng màu mang
 * nghĩa nghề. Biên ở đây do `contrast.ts` giữ: mọi bộ được chọn đều đã qua cửa 4.5.
 *
 * Cùng khuôn khoá localStorage với `lib/lockscreen.ts` / `lib/resume.ts` — không đẻ quy ước mới.
 */

import { WALLPAPER_SETS } from './sets';
import type { NacGiamChoi, WallpaperPrefs } from './types';

const LS_KEY = 'interiorflow.wallpaper';

export const MAC_DINH: WallpaperPrefs = {
  /* 'binh-do' (bản vẽ, chỉ có nét) chứ KHÔNG phải bộ đầu danh sách — chốt 12 của Hoà:
   * *"nền = chính việc dở/giấy draft caro lam, KHÔNG ảnh phong cảnh"*. Lấy `WALLPAPER_SETS[0]`
   * là để thứ tự khai báo trong `sets.ts` quyết định mặt tiền của app: thêm/sắp lại một bộ là
   * đổi nền mặc định mà không ai định. Khai TÊN bộ thì ý định nằm ở đây, đọc được.
   * ⚠️ Chỉ đổi MẶC ĐỊNH. Người dùng đã chọn bộ khác thì `localStorage` vẫn thắng — đường đọc
   * prefs không đụng tới. */
  setId: 'binh-do',
  nacGiamChoi: 0,
  bat: true,
};

function hopLe(id: string): boolean {
  return WALLPAPER_SETS.some((s) => s.id === id);
}

export function docPrefs(): WallpaperPrefs {
  if (typeof window === 'undefined') return MAC_DINH;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return MAC_DINH;
    const p = JSON.parse(raw) as Partial<WallpaperPrefs>;
    const nac = p.nacGiamChoi;
    return {
      setId: typeof p.setId === 'string' && hopLe(p.setId) ? p.setId : MAC_DINH.setId,
      nacGiamChoi: nac === 1 || nac === 2 ? (nac as NacGiamChoi) : 0,
      bat: p.bat !== false,
    };
  } catch {
    return MAC_DINH;
  }
}

export function ghiPrefs(p: WallpaperPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch {
    /* quota đầy — lựa chọn vẫn áp trong phiên, không vỡ giao diện */
  }
}

/** Chuẩn hoá một object bất kỳ về prefs hợp lệ (dùng cho test + cho dữ liệu cũ/hỏng). */
export function chuanHoa(p: Partial<WallpaperPrefs> | null | undefined): WallpaperPrefs {
  if (!p) return MAC_DINH;
  const nac = p.nacGiamChoi;
  return {
    setId: typeof p.setId === 'string' && hopLe(p.setId) ? p.setId : MAC_DINH.setId,
    nacGiamChoi: nac === 1 || nac === 2 ? (nac as NacGiamChoi) : 0,
    bat: p.bat !== false,
  };
}
