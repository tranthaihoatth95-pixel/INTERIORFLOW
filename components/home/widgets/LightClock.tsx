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
  truong = false,
  khongDongHo = false,
  displayName,
  onDisplayNameChange,
}: {
  headline: string;
  signal: string | null;
  /** ⛔ LUẬT 22/08 — ÁNH SÁNG NGÀY KHÔNG PHẢI MỘT VẬT TRÊN TRANG.
   *  Bật cờ này thì phần ĐỒNG HỒ ĐO (cung mặt trời · `05:00`/`20:00` · nhãn kelvin) KHÔNG dựng;
   *  chỉ còn lời chào. Ánh sáng ngày vẫn tác động — nhưng qua HƯỚNG SÁNG · ẤM/LẠNH · độ sáng
   *  môi trường · độ mềm bóng đổ, tức người dùng CẢM được giờ mà không phải ĐỌC một thiết bị đo.
   *  Home bật cờ này. Bố cục `custom` (hai cột cũ) KHÔNG bật — ở đó nó vẫn là widget thật. */
  khongDongHo?: boolean;
  /** đổi giá trị này (mốc phút) là component tính lại giờ — xem comment đầu file. */
  tick: number;
  index?: string;
  /**
   * TRƯỜNG, KHÔNG PHẢI THẺ (§4). Bố cục bốn dải đặt KHÔNG KHÍ ở dải đầu — mà không khí là một
   * TRƯỜNG để thở, không phải một ô có viền. Bật cờ này thì bỏ vỏ `WidgetCard` (viền + nền card),
   * chữ đứng thẳng trên nền trang.
   * ⚖️ Vẫn là PROP chứ không đổi luôn: bố cục `custom` hai cột vẫn cần vỏ thẻ để xếp hàng với các
   * ô khác. Một component, hai chỗ đứng — không đẻ bản thứ hai.
   */
  truong?: boolean;
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
  // (arcX/arcY đã theo khối cung ra đi — 22/08)

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
  // 🔴 22/08 — BỎ HẬU TỐ KELVIN. Trước: "BAN NGÀY · 5600K". Con số kelvin là ngôn ngữ THIẾT BỊ
  // ĐO, không phải ngôn ngữ buổi sáng — nằm đúng danh sách Hoà bác (§8). Giữ lại tên buổi, vì đó
  // là KHÔNG KHÍ (thứ cảm được), không phải số liệu (thứ phải đọc).
  const shortLabel = tr(tod.label[0], tod.label[1]);

  const ruot = (
      <div className="flex h-full flex-col gap-2.5">
        <div className="min-w-0">
          {/* 22/08 — thôi đánh số ô (Hoà: "No numbered 01/02/03 sections"). Xem WidgetCard.tsx. */}
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
                  <Pencil size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
          {signal && <p className="mt-0.5 truncate text-[length:var(--fs-2xs)] text-[var(--t3)]">{signal}</p>}
        </div>

        {/* 🔴 GỠ 22/08 (Hoà bác, §8 SAFE CONVERGENCE) — KHỐI ĐỒNG HỒ ĐO ĐÃ XOÁ HẲN, không phải tắt bằng cờ.
            Trước: cung mặt trời + mốc 05:00/20:00 + nhãn kelvin (2700K/5600K) — đọc ra như biểu đồ
            telemetry, không phải như một buổi sáng. Ba chỗ mount thì chỉ MỘT truyền `truong`, nên hai chỗ
            kia vẫn dựng nguyên widget kỹ thuật ⇒ nhánh đã bị bác VẪN VỚI TỚI ĐƯỢC.
            §17: đánh dấu superseded trong sổ mà mã còn render được thì đó là LỖI SẢN XUẤT, không phải nợ.
            ⇒ Xoá khối, không để cờ nào bật lại được. Ánh sáng ngày ở lại dưới dạng MÔI TRƯỜNG
            (độ sáng · ấm/lạnh · hướng · lời chào theo buổi) — thứ người dùng CẢM, không phải thứ họ ĐỌC. */}
      </div>
  );

  // TRƯỜNG: chữ đứng thẳng trên nền trang, không viền không nền thẻ. THẺ: vỏ cũ, nguyên vẹn.
  return truong ? <div className="w-full">{ruot}</div> : <WidgetCard dense>{ruot}</WidgetCard>;
}
