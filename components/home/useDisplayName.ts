'use client';

/**
 * components/home/useDisplayName.ts — [marker: loiChao] TÊN HIỂN THỊ do người dùng tự đặt
 * (phiếu `docs/phieu-giao/P-X-sua-4-loi-home.md` ④.V1).
 *
 * VÌ SAO CÓ FILE NÀY — ảnh chụp màn 17/08 của Hoà ra **"Chào hoa"**: tên tài khoản đang lưu là
 * `hoa` (chữ thường, MẤT DẤU). Máy sửa được chữ thường (`capitalizeFirst` trong
 * `lib/home/greeting.ts`), nhưng **KHÔNG suy được dấu** — `hoa` có thể là Hoa · Hoà · Hoá · Hoạ.
 * Đoán dấu là bịa tên người dùng, phạm [N1] "dị ứng đồ giả". Đường duy nhất đúng: cho người dùng
 * tự gõ.
 *
 * LƯU Ở ĐÂU — localStorage per-máy, ĐÚNG khuôn cài đặt cục bộ sẵn có (`lib/units/settings.ts`,
 * `app/settings/_lib/local-state.ts`): đọc trong `useEffect` để không lệch hydrate SSR, ghi lại
 * mỗi lần đổi, hỏng/quota thì im lặng bỏ qua chứ không chặn UI. [Đ2] nhìn vào trong trước — KHÔNG
 * đẻ cơ chế lưu thứ hai.
 *
 * ⚠️ GIỚI HẠN ĐÃ BIẾT (bàn giao lên T): đây là bản vá TẠI CHỖ TAY ĐANG ĐẶT, chưa phải chỗ đúng
 * nhất. Chỗ đúng nhất là `components/settings/AccountSettings.tsx` (nay tên/email **chỉ ĐỌC** —
 * docstring `:8-9` tự khai *"chưa có API đổi tên"*) + một cột `displayName` trong `User`. Cả hai
 * đều NGOÀI vùng file của phiếu này (`prisma/**` bị CẤM, `components/settings/**` không nằm trong
 * danh sách ĐƯỢC ghi), nên phiên này dừng ở lớp cục bộ và đề xuất lên T. Hệ quả thật: đổi máy là
 * mất tên đã đặt.
 */

import { useCallback, useEffect, useState } from 'react';
import { DISPLAY_NAME_KEY, normalizeDisplayName } from '@/lib/home/greeting';

export function useDisplayName() {
  const [displayName, setState] = useState<string | null>(null);

  useEffect(() => {
    try {
      setState(normalizeDisplayName(window.localStorage.getItem(DISPLAY_NAME_KEY)));
    } catch {
      /* private-mode / storage bị chặn — lời chào rơi về tên tài khoản, không hỏng gì */
    }
  }, []);

  /** Gõ rỗng = XOÁ tên tự đặt, quay về tên tài khoản (không kẹt một cái tên sai vĩnh viễn). */
  const setDisplayName = useCallback((raw: string) => {
    const next = normalizeDisplayName(raw);
    setState(next);
    try {
      if (next) window.localStorage.setItem(DISPLAY_NAME_KEY, next);
      else window.localStorage.removeItem(DISPLAY_NAME_KEY);
    } catch {
      /* mất bền giữa các phiên, nhưng phiên hiện tại vẫn đúng tên */
    }
  }, []);

  return { displayName, setDisplayName };
}
