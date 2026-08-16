'use client';

/**
 * components/wallpaper/SystemWallpaper.tsx — [marker: hinhNenNguon · chamDanDung] LỚP NỀN
 * hình nền hệ thống: sinh bằng mã, đổi ánh sáng theo giờ, **chậm dần rồi dừng hẳn** khi vào.
 *
 * ⚠️ KHÔNG có `requestAnimationFrame`, KHÔNG có `setInterval` trong file này. Nhịp thời gian
 * là **một `setTimeout`** hẹn tới mốc 30 phút kế tiếp (`msToiMocSau`) — giữa hai mốc, khung
 * hình đứng yên tuyệt đối. Đây là điều kiện của "dừng hẳn = ngừng tiêu CPU/GPU" (phiếu ⑤).
 *
 * ⚠️ `pointer-events:none` + `aria-hidden` — nền **không bao giờ khoá tay người dùng**; bấm
 * được ngay từ khung hình đầu, không phải đợi hết hiệu ứng vào.
 *
 * ⚠️ Nền là **TẦNG ĐẤT**, không phải tín hiệu trạng thái: nó không được đọc nhầm thành một
 * trong ba tầng ánh sáng đã chốt (① kính nhận sáng · ② viền đứng yên khi trỏ · ③ viền chạy
 * khi render). Vì thế nền không có viền, không quầng bám con trỏ, không nhấp nháy.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { timeOfDayFromHour } from '@/lib/home/time-of-day';
import { nenCss } from '@/lib/wallpaper/css';
import { docPrefs } from '@/lib/wallpaper/prefs';
import { bangMau, nguonSang, timBo } from '@/lib/wallpaper/sets';
import {
  SETTLE_MS,
  gioThapPhan,
  msToiMocSau,
  styleNen,
  type PhaChuyenDong,
} from '@/lib/wallpaper/settle';
import { MAC_DINH } from '@/lib/wallpaper/prefs';
import type { WallpaperPrefs, WallpaperTheme } from '@/lib/wallpaper/types';

/** Theme hiện tại, đọc từ `document.documentElement.dataset.theme` (nguồn `lib/store.ts:555`). */
function themeHienTai(): WallpaperTheme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export default function SystemWallpaper() {
  // SSR-safe: server dựng mặc định, mount xong mới đọc localStorage/DOM.
  const [prefs, setPrefs] = useState<WallpaperPrefs>(MAC_DINH);
  const [theme, setTheme] = useState<WallpaperTheme>('dark');
  const [gio, setGio] = useState<number>(12);
  const [pha, setPha] = useState<PhaChuyenDong>('entering');
  /** transition đã chạy xong chưa — mốc để GỠ HẲN `transition` + `will-change`. */
  const [daXong, setDaXong] = useState(false);
  const [giamChuyenDong, setGiamChuyenDong] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* ---------- ① đọc lựa chọn + theme + giờ, MỘT LẦN lúc mount ---------- */
  useEffect(() => {
    setPrefs(docPrefs());
    setTheme(themeHienTai());
    setGio(gioThapPhan());
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setGiamChuyenDong(mq.matches);
    const onMq = () => setGiamChuyenDong(mq.matches);
    mq.addEventListener('change', onMq);

    // đổi theme → đổi bảng màu. Quan sát THUỘC TÍNH, không hỏi vòng (không polling).
    const mo = new MutationObserver(() => setTheme(themeHienTai()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // đổi lựa chọn ở màn Cài đặt → cập nhật ngay, không phải tải lại trang.
    const onPrefs = () => setPrefs(docPrefs());
    window.addEventListener('if-wallpaper-prefs', onPrefs);
    window.addEventListener('storage', onPrefs);

    return () => {
      mq.removeEventListener('change', onMq);
      mo.disconnect();
      window.removeEventListener('if-wallpaper-prefs', onPrefs);
      window.removeEventListener('storage', onPrefs);
    };
  }, []);

  /* ---------- ② NHỊP THỜI GIAN — một setTimeout, tự hẹn lại; KHÔNG interval ---------- */
  useEffect(() => {
    let id: number | undefined;
    const hen = () => {
      id = window.setTimeout(() => {
        setGio(gioThapPhan());
        hen();
      }, Math.max(1000, msToiMocSau()));
    };
    hen();
    return () => {
      if (id !== undefined) window.clearTimeout(id);
    };
  }, []);

  /* ---------- ③ CHẬM DẦN RỒI DỪNG HẲN ---------- */
  useEffect(() => {
    if (giamChuyenDong) {
      // 🔴 reduced-motion ⇒ KHÔNG chuyển động chút nào, vào thẳng khung cuối.
      setPha('stopped');
      setDaXong(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    // ép trình duyệt nhận khung đầu (scale 1.045) rồi mới chuyển về 1 — không có bước này
    // thì trình duyệt gộp hai style thành một, hiệu ứng biến mất.
    const raf = window.requestAnimationFrame(() => setPha('stopped'));
    // Lưới đỡ: nếu `transitionend` không bắn (tab nền ⇒ transition bị hoãn), vẫn phải chốt
    // trạng thái dừng để không kẹt ở pha có `will-change`.
    const chot = window.setTimeout(() => {
      setPha('stopped');
      setDaXong(true);
    }, SETTLE_MS + 400);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(chot);
    };
  }, [giamChuyenDong]);

  /* ---------- ④ giải nền — thuần, cùng hàm mà bản vẽ dùng ---------- */
  const background = useMemo(() => {
    const set = timBo(prefs.setId);
    return nenCss(set, bangMau(set, timeOfDayFromHour(gio).period, theme), nguonSang(gio));
  }, [prefs.setId, gio, theme]);

  if (!prefs.bat) return null;

  /* Ba trạng thái THẬT trên DOM, tuy hợp đồng logic ở `settle.ts` chỉ có hai (đang-vào ↔
   * đã-dừng). Trạng thái giữa là lúc transition ĐANG chạy — phải giữ `will-change` suốt lúc
   * đó, gỡ sớm là mất mượt; và phải gỡ NGAY khi xong, giữ lại là nuôi một lớp GPU vĩnh viễn. */
  const vao = styleNen('entering', giamChuyenDong);
  const dung = styleNen('stopped', giamChuyenDong);
  const daDung = pha === 'stopped';
  const haCanhXong = daDung && daXong;

  return (
    <div
      ref={ref}
      aria-hidden
      data-if-wallpaper=""
      /* 🔴 Bằng chứng máy đọc được của "đã dừng hẳn" — soi DOM là thấy, không phải tin lời.
       * `stopped` chỉ xuất hiện khi transition đã kết thúc và mọi thuộc tính hoạt hoạ đã gỡ. */
      data-wp-motion={haCanhXong || giamChuyenDong ? 'stopped' : daDung ? 'landing' : 'entering'}
      data-wp-set={prefs.setId}
      data-wp-period={timeOfDayFromHour(gio).period}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        background,
        transform: daDung ? dung.transform : vao.transform,
        transition: haCanhXong || giamChuyenDong ? 'none' : vao.transition,
        animation: 'none',
        willChange: haCanhXong || giamChuyenDong ? 'auto' : 'transform',
      }}
      onTransitionEnd={(e) => {
        if (e.propertyName === 'transform') setDaXong(true);
      }}
    />
  );
}
