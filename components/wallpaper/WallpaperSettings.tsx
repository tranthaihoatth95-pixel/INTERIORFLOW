'use client';

/**
 * components/wallpaper/WallpaperSettings.tsx — [marker: chonBoHinhNen] chỗ người dùng chọn bộ.
 *
 * ⚠️ Đây là **lớp ② của hệ màu 3 lớp** (chốt 16/08 B13 — *màu VỎ LÀM VIỆC, chọn TRONG BIÊN*).
 * Biên do máy giữ, không do mắt: mọi bộ ở đây đã qua cửa 4.5 ở cả 40 tổ hợp
 * (`lib/wallpaper/contrast.test.ts`). Không đụng lớp ① (màu của IF) và không đụng màu nghĩa nghề.
 *
 * ⚠️ Xem trước là **nền THẬT** — cùng hàm `nenCss` mà lớp nền dùng, không phải ô màu trơn.
 *
 * 📍 Vì sao mount ở đây: `components/settings/LockScreenSettings.tsx` là tệp DUY NHẤT vừa nằm
 * trong vùng ghi của phiếu P-O vừa **đã được mount thật** (`app/settings/_components/
 * PixelSettingsShell.tsx:218`). Chỗ đúng về nghĩa lâu dài là `AppearanceSettings` — ghi lại
 * làm đường may cần dọn, đừng để phiên sau tưởng là cố ý xếp nhầm.
 */

import { useEffect, useState } from 'react';
import { Check, ImageDown, SunMedium } from 'lucide-react';
import { useLang, useT } from '@/lib/i18n';
import { timeOfDayNow } from '@/lib/home/time-of-day';
import { nenCss } from '@/lib/wallpaper/css';
import { docPrefs, ghiPrefs } from '@/lib/wallpaper/prefs';
import { WALLPAPER_SETS, bangMau, nguonSang } from '@/lib/wallpaper/sets';
import { gioThapPhan } from '@/lib/wallpaper/settle';
import { MAC_DINH } from '@/lib/wallpaper/prefs';
import type { NacGiamChoi, WallpaperPrefs, WallpaperTheme } from '@/lib/wallpaper/types';

const NAC: { gt: NacGiamChoi; vi: string; en: string }[] = [
  { gt: 0, vi: 'Kính như thường', en: 'Normal glass' },
  { gt: 1, vi: 'Giảm chói', en: 'Reduce glare' },
  { gt: 2, vi: 'Tắt kính', en: 'No glass' },
];

function themeHienTai(): WallpaperTheme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function WallpaperSettings() {
  const tr = useT();
  const en = useLang() === 'en';
  const [prefs, setPrefs] = useState<WallpaperPrefs>(MAC_DINH);
  const [theme, setTheme] = useState<WallpaperTheme>('dark');
  const [gio, setGio] = useState(12);

  useEffect(() => {
    setPrefs(docPrefs());
    setTheme(themeHienTai());
    setGio(gioThapPhan());
    const mo = new MutationObserver(() => setTheme(themeHienTai()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  const luu = (p: WallpaperPrefs) => {
    setPrefs(p);
    ghiPrefs(p);
    // lớp nền đang mount ở màn khác — báo cho nó cập nhật ngay, không phải tải lại trang.
    window.dispatchEvent(new Event('if-wallpaper-prefs'));
  };

  const tod = timeOfDayNow();
  const sun = nguonSang(gio);

  return (
    <section>
      <h2 className="text-[15px] font-semibold text-[var(--t1)]">
        {tr('Hình nền hệ thống', 'System wallpaper')}
      </h2>
      <p className="mt-1 text-[12px] text-[var(--t2)]">
        {tr(
          'Năm bộ đi kèm, sinh bằng mã — không tệp ảnh nào. Ánh sáng đổi theo giờ trong ngày.',
          'Five built-in sets, generated in code — no image files. The light follows the hour.',
        )}{' '}
        <span className="text-[var(--t3)]">
          {tr('Đang là', 'Now')}: {tr(tod.label[0], tod.label[1])} · {tod.kelvin}K
        </span>
      </p>

      {/* ---------- chọn bộ — xem trước là NỀN THẬT, không phải ô màu trơn ---------- */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {WALLPAPER_SETS.map((s) => {
          const on = prefs.setId === s.id && prefs.bat;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => luu({ ...prefs, setId: s.id, bat: true })}
              aria-pressed={on}
              className="group flex flex-col gap-1.5 text-left"
              title={tr(s.cau[0], s.cau[1])}
            >
              <span
                className="relative block h-20 w-full overflow-hidden rounded-[var(--r-2)] border transition-transform group-hover:scale-[1.02]"
                style={{
                  background: nenCss(s, bangMau(s, tod.period, theme), sun),
                  borderColor: on ? 'var(--accent)' : 'var(--border)',
                  boxShadow: on ? '0 0 0 1px var(--accent)' : undefined,
                }}
              >
                {on && (
                  <span
                    className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-[var(--r-full)]"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Check size={14} strokeWidth={1.5} style={{ color: 'var(--bg)' }} aria-hidden />
                  </span>
                )}
              </span>
              {/* nhãn 1-2 từ vẫn GIỮ (luật B5: chê chữ NHỎ và NHIỀU, không chê nhãn) */}
              <span className="text-[12px] font-medium leading-none text-[var(--t2)]">
                {tr(s.ten[0], s.ten[1])}
              </span>
              {/* MỘT CÂU nó là gì — đây là chỗ "dừng lại đọc", chữ được phép ở đây */}
              {/* a11y: KHÔNG dùng --t4 cho chữ mang nghĩa — đo được `--t4 #6e6e78` trên
                  `--bg #0c0c0e` chỉ đạt **3.91**, dưới ngưỡng 4.5. `--t3` đạt 7.2. */}
              <span className="text-[11px] leading-snug text-[var(--t3)]">
                {tr(s.cau[0], s.cau[1])}
              </span>
            </button>
          );
        })}

        {/* Tắt hẳn — ô trống là bằng chứng còn lựa chọn, không giấu đi cho gọn mắt */}
        <button
          type="button"
          onClick={() => luu({ ...prefs, bat: false })}
          aria-pressed={!prefs.bat}
          className="group flex flex-col gap-1.5 text-left"
        >
          <span
            className="relative grid h-20 w-full place-items-center overflow-hidden rounded-[var(--r-2)] border transition-transform group-hover:scale-[1.02]"
            style={{
              background: 'var(--bg)',
              borderColor: !prefs.bat ? 'var(--accent)' : 'var(--border)',
              boxShadow: !prefs.bat ? '0 0 0 1px var(--accent)' : undefined,
            }}
          >
            <ImageDown size={16} className="text-[var(--t4)]" aria-hidden />
          </span>
          <span className="text-[12px] font-medium leading-none text-[var(--t2)]">
            {tr('Không dùng', 'Off')}
          </span>
          <span className="text-[11px] leading-snug text-[var(--t3)]">
            {tr('Nền trơn như trước.', 'Plain background, as before.')}
          </span>
        </button>
      </div>

      {/* ---------- nấc giảm chói — bắt buộc có, và cắt ánh kim chứ không cắt độ đọc ---------- */}
      <div className="mt-5">
        <div className="flex items-center gap-2 text-[13px] text-[var(--t2)]">
          <SunMedium size={14} aria-hidden />
          {tr('Độ chói của kính', 'Glass glare')}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group">
          {NAC.map((n) => {
            const on = prefs.nacGiamChoi === n.gt;
            return (
              <button
                key={n.gt}
                type="button"
                onClick={() => luu({ ...prefs, nacGiamChoi: n.gt })}
                aria-pressed={on}
                className="rounded-[var(--r-2)] border px-3 py-1.5 text-[12px] transition-colors"
                style={{
                  borderColor: on ? 'var(--accent)' : 'var(--border)',
                  color: on ? 'var(--accent)' : 'var(--t3)',
                }}
              >
                {en ? n.en : n.vi}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-[var(--t3)]">
          {tr(
            'Nấc cao thì kính đặc hơn: bớt ánh kim, chữ chắc đọc hơn — không bao giờ ngược lại.',
            'Higher steps make the glass denser: less sheen, never less legibility.',
          )}
        </p>
      </div>
    </section>
  );
}

export default WallpaperSettings;
