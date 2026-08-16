'use client';

/**
 * components/home/widgets/LightClock.tsx — [marker: DongStudio v3] Ô B "Chào + Đồng hồ ánh
 * sáng" (phiếu docs/phieu-giao/home-bento-v3.md ④.2) — gộp lời chào (trước ở dải hero Trang 1
 * của v2) với widget sáng tạo #1: cung mặt trời SVG theo giờ thật (`lib/home/time-of-day.ts`
 * `sunPosition`/`kelvin`/`lightLabel`).
 *
 * GU (chỉ đạo giữa phiên, `docs/nc/NC-GU-BENTRAN-PINTEREST-2026-08-13.md` mạch #2+#3) — vẽ kiểu
 * SƠ ĐỒ KỸ THUẬT (đúng thứ Hoà pin: bảng vật lý ánh sáng V-Ray), KHÔNG mặt trời cartoon:
 * hairline arc + tick mốc giờ + chấm tròn nhỏ + nhãn `font-mono` uppercase, không tô màu vàng
 * loè loẹt, không icon mặt trời có tia.
 *
 * `tick` (prop) = mốc phút do DongStudioHome cấp qua MỘT interval toàn trang (luật ⑤ phiếu) —
 * component chỉ đọc `new Date()` lại mỗi khi `tick` đổi, không tự giữ interval riêng.
 *
 * v4 (13/08, phiếu home-bento-v4.md ④.5, lỗi #5 "cung mặt trời mảnh vô hình") — nét cung
 * `var(--border)` 1px gần như vô hình trên nền card; đổi sang `var(--t3)` 2px + fill nhẹ dưới
 * cung (`var(--accent-warm)` alpha thấp) để đọc được là MỘT hình sơ đồ, không chỉ một gợi ý mờ.
 * Chấm mặt trời 3.5px→5px bán kính (đường kính ~10px, đúng khoảng 8-10px phiếu yêu cầu). Nhãn
 * rút gọn còn "BAN NGÀY · 5600K" (`tod.label` + `tod.kelvin`) thay vì câu dài `lightLabel` — gọn,
 * đúng gu số-là-nhân-vật. Khối chào+cung không còn `justify-between` kéo giãn 2 đầu card (rời
 * rạc) — chuyển `flex flex-col gap-2.5` để 2 phần dính liền thành MỘT khối kể chuyện.
 */

import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { timeOfDayNow, sunPosition } from '@/lib/home/time-of-day';
import { DISPLAY_NAME_MAX } from '@/lib/home/greeting';
import { useT } from '@/lib/i18n';
import WidgetCard from './WidgetCard';

const W = 220;
const H = 64;
const PAD = 10;

export default function LightClock({
  headline,
  signal,
  tick,
  index,
  displayName,
  onDisplayNameChange,
}: {
  headline: string;
  signal: string | null;
  /** đổi giá trị này (mốc phút) là component tính lại giờ — xem comment đầu file. */
  tick: number;
  index?: string;
  /** V1 (17/08, P-X ④.V1) — tên người dùng TỰ ĐẶT; `null` = đang dùng tên tài khoản. */
  displayName?: string | null;
  /** Bỏ trống = không cho sửa tên tại đây (ô chào vẫn chạy y nguyên). */
  onDisplayNameChange?: (raw: string) => void;
}) {
  const tr = useT();
  // ---- V1 · sửa TÊN HIỂN THỊ ngay tại lời chào ----------------------------------------------
  // Vì sao đặt ở đây mà không ở /settings: đây là chỗ cái tên sai ĐẬP VÀO MẮT. Sửa ngay chỗ nhìn
  // thấy lỗi là đường ngắn nhất; /settings vẫn nên có (bàn giao lên T, xem `useDisplayName.ts`).
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const moSua = () => {
    setDraft(displayName ?? '');
    setEditing(true);
  };
  const luu = () => {
    onDisplayNameChange?.(draft);
    setEditing(false);
  };
  void tick; // chỉ dùng để ép re-render đúng nhịp phút — không đọc trực tiếp giá trị
  const now = new Date();
  const tod = timeOfDayNow(now);
  const hourFloat = now.getHours() + now.getMinutes() / 60;
  const sun = sunPosition(hourFloat);

  const arcX = PAD + (sun.xPercent / 100) * (W - PAD * 2);
  const arcY = PAD + (sun.yPercent / 100) * (H - PAD * 2 - 8);

  // hairline arc thật (không chỉ ước lượng vị trí điểm) — vẽ bằng cùng công thức sin của
  // sunPosition, lấy mẫu 24 điểm để path mượt mà vẫn THUẦN SVG (không lib chart).
  const samplePts = Array.from({ length: 25 }, (_, i) => {
    const p = i / 24;
    const x = PAD + p * (W - PAD * 2);
    const y = PAD + (100 - Math.sin(p * Math.PI) * 100) / 100 * (H - PAD * 2 - 8);
    return [x, y] as const;
  });
  const samples = samplePts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  // fill nhẹ dưới cung — đóng path xuống đường chân trời (H-PAD) rồi về lại điểm đầu.
  const fillPath = `M ${samplePts[0][0].toFixed(1)},${(H - PAD).toFixed(1)} L ${samples} L ${samplePts[samplePts.length - 1][0].toFixed(1)},${(H - PAD).toFixed(1)} Z`;

  // nhãn rút gọn "BAN NGÀY · 5600K" (v4 lỗi #5) — thay câu dài lightLabel.
  const shortLabel = `${tr(tod.label[0], tod.label[1])} · ${tod.kelvin}K`;

  return (
    <WidgetCard dense>
      <div className="flex h-full flex-col gap-2.5">
        <div className="min-w-0">
          {index && (
            // P-X ⑤ — `--t5` đo được 1,98/2,21 (dưới 4,5:1) → lên `--t3` (7,24/5,20).
            <span className="font-mono text-[length:var(--fs-2xs)] uppercase tracking-wide text-[var(--t3)]">{index}</span>
          )}
          {editing ? (
            <div className="mt-0.5 flex items-center gap-1.5">
              <input
                ref={inputRef}
                value={draft}
                maxLength={DISPLAY_NAME_MAX}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); luu(); }
                  if (e.key === 'Escape') { e.preventDefault(); setEditing(false); }
                }}
                aria-label={tr('Tên hiển thị', 'Display name')}
                placeholder={tr('Gõ tên có dấu…', 'Type your name…')}
                className="min-w-0 flex-1 rounded-[var(--r-2)] px-2.5 py-1 text-[length:var(--fs-sm)] text-[var(--t1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                style={{ background: 'var(--field)', border: '1px solid var(--border)' }}
              />
              <button
                type="button"
                onClick={luu}
                className="shrink-0 rounded-[var(--r-2)] px-2.5 py-1 text-[length:var(--fs-xs)] font-medium text-[var(--t1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                style={{ background: 'var(--field)', border: '1px solid var(--border)' }}
              >
                {tr('Lưu', 'Save')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <h2 className="min-w-0 flex-1 truncate text-[length:var(--fs-md)] font-semibold leading-tight text-[var(--t1)]">
                {headline}
              </h2>
              {onDisplayNameChange && (
                <button
                  type="button"
                  onClick={moSua}
                  aria-label={tr('Đổi tên hiển thị', 'Change display name')}
                  title={tr('Đổi tên hiển thị', 'Change display name')}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--r-2)] text-[var(--t3)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                >
                  <Pencil size={13} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
          {signal && <p className="mt-0.5 truncate text-[length:var(--fs-2xs)] text-[var(--t3)]">{signal}</p>}
        </div>

        <div>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={tr(tod.lightLabel[0], tod.lightLabel[1])}>
            {/* fill nhẹ dưới cung — cho cung có "khối", không chỉ một nét mảnh trôi nổi */}
            <path d={fillPath} fill="var(--accent-warm)" opacity={0.1} stroke="none" />
            {/* cung sơ đồ kỹ thuật — 2px, màu đậm hơn hairline cũ để KHÔNG "vô hình" trên nền card */}
            <polyline points={samples} fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" />
            {/* 3 tick mốc: bình minh · giữa cung · hoàng hôn */}
            {[0, 0.5, 1].map((p) => {
              const x = PAD + p * (W - PAD * 2);
              return <line key={p} x1={x} y1={H - PAD + 1} x2={x} y2={H - PAD - 3} stroke="var(--t5)" strokeWidth="1" />;
            })}
            {/* đường chân trời */}
            <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
            {!sun.belowHorizon && (
              <>
                {/* leader line kiểu chú thích kỹ thuật, không tia mặt trời cartoon */}
                <line x1={arcX} y1={arcY} x2={arcX} y2={H - PAD} stroke="var(--t5)" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx={arcX} cy={arcY} r="5" fill="var(--accent-warm)" stroke="var(--card)" strokeWidth="1.5" />
              </>
            )}
          </svg>
          <div className="mt-1 flex items-center justify-between font-mono text-[length:var(--fs-2xs)] uppercase tracking-wide text-[var(--t4)]">
            <span>{tr('05:00', '05:00')}</span>
            <span className="text-[var(--t3)]">{shortLabel}</span>
            <span>{tr('20:00', '20:00')}</span>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
