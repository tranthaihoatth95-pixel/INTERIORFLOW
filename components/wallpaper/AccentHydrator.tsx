'use client';

/**
 * components/wallpaper/AccentHydrator.tsx — [marker: noiDayAccent] áp bốn token `--accent*`
 * lên `document.documentElement`, tính từ BỘ HÌNH NỀN đang chọn (`lib/wallpaper/prefs.ts`).
 *
 * Chỉ đạo Hoà 01/09 11:20: *"accent đi theo bộ hình nền người dùng chọn — người ta chọn hình gì
 * thì màu theo đó."* Đây là lượt NỐI DÂY của `docs/control/IF-HE-5-BO-MAU.md` §5 bước 2 —
 * `lib/wallpaper/mau-bo.ts` đã có bảng màu + cổng WCAG từ 30/08, `lib/wallpaper/accent-css.ts`
 * (lượt này) gọi đúng cổng đó ra bốn chuỗi CSS, và tệp NÀY là nơi DUY NHẤT đặt chúng lên DOM —
 * đúng khuôn `lib/wallpaper/css.ts`: lib THUẦN tính chuỗi, component ĐẶT style.
 *
 * ⚠️ VÌ SAO MỘT COMPONENT MỚI, KHÔNG GHÉP VÀO `SystemWallpaper.tsx` — nhìn kỹ trước khi ghép
 * (luật B25 LOOK INSIDE): `SystemWallpaper.tsx` (đã có) CHỈ mount ở 4 bề mặt có hình nền hiển
 * thị thật (`LoginScreen`, `BeMatHome`, `DongStudioHome`, `WidgetCard`) — route CAD/Present/
 * Photo/Settings vào bằng deep-link/tải lại cứng sẽ KHÔNG đụng nó, trong khi `--accent` thì MỌI
 * route đều đọc (nút, viền focus, slider…). Nơi bảo đảm "mọi route, kể cả deep-link" đã có sẵn
 * và đang chạy thật trong repo là khuôn `*Hydrator` render-null mount thẳng ở `app/layout.tsx`
 * (xem `components/entry/StoreHydrator.tsx`) — tệp này ĐI THEO đúng khuôn đó, không đẻ khuôn
 * thứ hai.
 *
 * FOUC chấp nhận được, cùng mức với `data-theme`/`lang`: SSR ra giá trị tĩnh trong
 * `app/globals.css` (khớp bộ mặc định `chan-troi` — `mau-bo.ts` giữ nguyên `#6a57f5` cho đúng
 * bộ này), client mount xong `useEffect` mới áp bộ khác nếu người dùng đã chọn khác mặc định.
 */

import { useEffect } from 'react';
import { docPrefs } from '@/lib/wallpaper/prefs';
import { tokenAccentCuaBo, type AccentTokens } from '@/lib/wallpaper/accent-css';

const CSS_VAR: Record<keyof AccentTokens, string> = {
  accent: '--accent',
  accentStrong: '--accent-strong',
  accentSoft: '--accent-soft',
  accentRing: '--accent-ring',
};

function apDung(setId: string): void {
  const t = tokenAccentCuaBo(setId);
  const root = document.documentElement.style;
  (Object.keys(CSS_VAR) as (keyof AccentTokens)[]).forEach((k) => root.setProperty(CSS_VAR[k], t[k]));
}

export function AccentHydrator() {
  useEffect(() => {
    apDung(docPrefs().setId);
    // đổi lựa chọn ở màn Cài đặt → cập nhật ngay, cùng sự kiện `WallpaperSettings.tsx` đã bắn
    // (xem `luu()` trong tệp đó) — không đẻ sự kiện thứ hai cho cùng một thay đổi.
    const onPrefs = () => apDung(docPrefs().setId);
    window.addEventListener('if-wallpaper-prefs', onPrefs);
    window.addEventListener('storage', onPrefs);
    return () => {
      window.removeEventListener('if-wallpaper-prefs', onPrefs);
      window.removeEventListener('storage', onPrefs);
    };
  }, []);

  return null;
}

export default AccentHydrator;
