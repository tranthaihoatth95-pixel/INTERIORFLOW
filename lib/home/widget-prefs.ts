'use client';

/**
 * lib/home/widget-prefs.ts — [marker: xuongCaNhan-prefs] Cá nhân hoá cụm phụ Home, PER-USER,
 * localStorage — cùng khuôn `lib/units/settings.ts` (đọc→hydrate trong `useEffect`→ghi lại mỗi
 * lần đổi), theo đúng luật kho §9 "MÁY MÌNH": cách bày trên màn của TÔI, không phải VẬT dùng
 * chung — không cần API/DB.
 *
 * ⚠️ RANH GIỚI KIẾN TRÚC (đọc trước khi đụng): brief gốc mô tả "kéo-thả vào Ô lưới, 3 cỡ định
 * sẵn 1×1/2×1/2×2" — đó là ngôn ngữ của bố cục BENTO đã bị `xuong-layout.ts` THAY THẾ 20/08
 * ("MỘT TIÊU ĐIỂM · MỘT CỤM PHỤ", cấm lưới thẻ đều — xem docstring ở đó). Bố cục lưới 9 ô chỉ
 * còn sống ở nhánh XẾP DỌC hẹp (<1100px, `bento-layout.ts`), không phải bố cục người dùng thấy
 * trên desktop. ⇒ Cá nhân hoá THẬT cho bố cục ĐANG SỐNG là: ẨN/HIỆN mục tuỳ chọn + THỨ TỰ trong
 * CỤM PHỤ (không phải toạ độ ô + cỡ ô — những khái niệm đó không còn tồn tại trên màn rộng).
 * Không xây lại lưới bento để có chỗ "resize 1×1/2×1/2×2" — làm vậy là ĐÈ NGƯỢC chốt 20/08.
 *
 * KHÔNG đụng `chao`/`ghiChu` (luôn sống, không cho ẩn — chúng là neo "bây giờ là lúc nào" và
 * "chỗ ghi", ẩn đi thì Home mất định vị). Mọi mục TUỲ CHỌN (`homNay`/`mocToi`/`vatLieu`/
 * `anhTuan`/`bieuDo`/`dongTin`) ẩn/hiện + thứ tự được.
 */

import { useEffect, useState } from 'react';
import type { MucPhu } from '@/components/home/xuong-layout';

const PREFIX = 'interiorflow.homeWidgetPrefs.';

/** Mục KHÔNG cho ẩn — luôn giữ tối thiểu hai neo định vị (chốt xuong-layout §THU_TU_PHU). */
const LOCKED: readonly MucPhu[] = ['chao', 'ghiChu'];

export interface HomeWidgetPrefs {
  /** Mục người dùng đã ẨN thủ công (chỉ áp cho mục không nằm trong LOCKED). */
  hidden: readonly MucPhu[];
  /** Thứ tự do người dùng đặt — CHỈ chứa các mục đã từng sắp xếp; mục mới/chưa từng thấy
   * không có trong mảng này, xử lý ở `applyOrder` (nối vào SAU theo thứ tự mặc định). */
  order: readonly MucPhu[];
}

const DEFAULTS: HomeWidgetPrefs = { hidden: [], order: [] };

function keyFor(userId: string): string {
  return PREFIX + userId;
}

function readStorage(userId: string): HomeWidgetPrefs {
  if (typeof window === 'undefined' || !userId) return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<HomeWidgetPrefs>;
    return {
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden.filter((m): m is MucPhu => typeof m === 'string') : [],
      order: Array.isArray(parsed.order) ? parsed.order.filter((m): m is MucPhu => typeof m === 'string') : [],
    };
  } catch {
    return DEFAULTS;
  }
}

function writeStorage(userId: string, prefs: HomeWidgetPrefs): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(prefs));
  } catch {
    /* quota/private-mode — không chặn UI, chỉ mất bền giữa phiên */
  }
}

/**
 * Áp prefs lên danh sách mục THẬT SỰ có dữ liệu hôm nay (`cumPhuThat`, đã lọc bởi
 * `bocCucXuong` theo tín hiệu dữ liệu — cá nhân hoá KHÔNG được làm mục có dữ liệu thật biến
 * mất khỏi vòng đời dữ liệu, chỉ được ẨN THEO Ý NGƯỜI DÙNG bên trên tín hiệu đó).
 *
 * Thuần — test được không cần DOM.
 */
export function applyWidgetPrefs(cumPhuThat: readonly MucPhu[], prefs: HomeWidgetPrefs): MucPhu[] {
  const visible = cumPhuThat.filter((m) => LOCKED.includes(m) || !prefs.hidden.includes(m));
  if (prefs.order.length === 0) return visible;
  const visibleSet = new Set(visible);
  const ordered: MucPhu[] = [];
  // Mục đã có vị trí đã lưu → theo đúng thứ tự lưu (chỉ mục còn đang hiển thị hôm nay).
  for (const m of prefs.order) {
    if (visibleSet.has(m) && !ordered.includes(m)) ordered.push(m);
  }
  // Mục mới xuất hiện (chưa từng được sắp) → nối theo đúng thứ tự mặc định, sau các mục đã sắp.
  for (const m of visible) {
    if (!ordered.includes(m)) ordered.push(m);
  }
  return ordered;
}

export function useHomeWidgetPrefs(userId: string | null | undefined) {
  const [prefs, setPrefs] = useState<HomeWidgetPrefs>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!userId) {
      setPrefs(DEFAULTS);
      setHydrated(true);
      return;
    }
    setPrefs(readStorage(userId));
    setHydrated(true);
  }, [userId]);

  const mutate = (fn: (prev: HomeWidgetPrefs) => HomeWidgetPrefs) => {
    if (!userId) return;
    setPrefs((prev) => {
      const next = fn(prev);
      writeStorage(userId, next);
      return next;
    });
  };

  /** Ẩn/hiện — mục LOCKED bỏ qua (không có nút ẩn cho chúng ở UI, đây là hàng rào thứ hai). */
  const toggleHidden = (m: MucPhu) => {
    if (LOCKED.includes(m)) return;
    mutate((prev) => ({
      ...prev,
      hidden: prev.hidden.includes(m) ? prev.hidden.filter((x) => x !== m) : [...prev.hidden, m],
    }));
  };

  /** Ghim lên đầu cụm phụ (trong số các mục KHÔNG locked — `chao` luôn đứng đầu tuyệt đối vì
   * nó là neo giờ, ghim không vượt qua nó). */
  const pinTop = (m: MucPhu, currentVisible: readonly MucPhu[]) => {
    mutate((prev) => {
      const base = prev.order.length ? prev.order : currentVisible;
      const rest = base.filter((x) => x !== m && x !== 'chao');
      const hasChao = currentVisible.includes('chao');
      const next: MucPhu[] = hasChao ? ['chao', m, ...rest] : [m, ...rest];
      return { ...prev, order: next };
    });
  };

  const move = (m: MucPhu, dir: -1 | 1, currentVisible: readonly MucPhu[]) => {
    mutate((prev) => {
      const base = (prev.order.length ? prev.order : currentVisible).filter((x) =>
        currentVisible.includes(x),
      );
      const list = [...base];
      // đảm bảo mọi mục đang hiển thị có mặt trong list trước khi hoán vị
      for (const x of currentVisible) if (!list.includes(x)) list.push(x);
      const i = list.indexOf(m);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return prev;
      // `chao` luôn đứng đầu — không cho hoán vị vượt qua nó.
      if (list[j] === 'chao' || list[i] === 'chao') return prev;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...prev, order: list };
    });
  };

  const reset = () => {
    if (!userId) return;
    setPrefs(DEFAULTS);
    try {
      window.localStorage.removeItem(keyFor(userId));
    } catch {
      /* bỏ qua */
    }
  };

  return { prefs, hydrated, toggleHidden, pinTop, move, reset, LOCKED };
}
