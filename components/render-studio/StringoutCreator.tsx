'use client';

/**
 * components/render-studio/StringoutCreator.tsx — BẢN DỰNG THÔ (stringout) của đường render phim.
 *
 * "Stringout" là chữ của nghề dựng: xếp mọi cảnh đã render nối đuôi nhau theo thứ tự, KHÔNG cắt,
 * KHÔNG chuyển cảnh — bản dựng đầu tiên để thấy mình đang CÓ GÌ. Màn này là mặt tiền của
 * `lib/render-studio/stringout.ts` (01/09), trước bản này là mã mồ côi: 0 nơi import.
 *
 * ── DÙNG LẠI, KHÔNG DỰNG MỚI (B25) ─────────────────────────────────────────────────────────────
 *  · Toán trục thời gian + luật bỏ cảnh: `stringoutTuKho()` / `maThoiGian()` / `inStringout()`.
 *    Màn này KHÔNG có một phép cộng khung nào của riêng nó.
 *  · Nguồn dữ liệu: `useKhoKetQua` (`lib/capabilities/render.ts`) — đúng kho mà `KetXuatPanel`
 *    đang ghi vào. Không đẻ kho thứ hai, không chép dữ liệu sang chỗ khác.
 *
 * ── ĐIỀU MÀN NÀY KHÔNG LÀM ────────────────────────────────────────────────────────────────────
 *  ⛔ Không độn khung cho đủ thời lượng. Cảnh chưa render xong / không khai thời lượng bị BỎ RA
 *     và GỌI TÊN ở khối dưới — một bản dựng thô nói dối về vật liệu là bản dựng thô vô dụng.
 *  ⛔ Không xuất phim. Đây là bản dựng để XEM MÌNH CÓ GÌ; xuất là việc của đường render.
 */

import { useMemo, useState } from 'react';
import { Clapperboard, Copy, X } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useKhoKetQua } from '@/lib/capabilities/render';
import {
  FPS_MAC_DINH,
  inStringout,
  maThoiGian,
  stringoutTuKho,
  type BanGhiCanh,
} from '@/lib/render-studio/stringout';

/** fps chọn được — PAL 25 là mặc định phim kiến trúc; 24 điện ảnh; 30 web. */
const FPS_CHON = [24, FPS_MAC_DINH, 30] as const;

export interface StringoutCreatorProps {
  /** Đóng màn. Bỏ trống ⇒ không vẽ nút đóng (dùng khi nhúng thẳng vào một ổ). */
  onClose?: () => void;
}

export default function StringoutCreator({ onClose }: StringoutCreatorProps) {
  const tr = useT();
  const kho = useKhoKetQua((s) => s.items);
  const [fps, setFps] = useState<number>(FPS_MAC_DINH);
  const [daChep, setDaChep] = useState(false);

  // `BanGhiKetQua` gán vừa khít `BanGhiCanh` (cổng hẹp của module thuần) — không map lại field,
  // không đẻ mô hình thứ hai. `luc` là mốc sinh, dùng để xếp thứ tự tất định.
  const dung = useMemo(() => stringoutTuKho(kho as readonly BanGhiCanh[], { fps }), [kho, fps]);
  const soAnh = useMemo(() => kho.filter((b) => b.loai === 'anh').length, [kho]);

  const chepBanIn = async () => {
    try {
      await navigator.clipboard.writeText(inStringout(dung));
      setDaChep(true);
      setTimeout(() => setDaChep(false), 2500);
    } catch {
      setDaChep(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tr('Bản dựng thô', 'Rough assembly')}
      style={{
        position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center',
        background: 'color-mix(in srgb, var(--bg) 62%, transparent)',
        // -webkit- đi kèm là BẮT BUỘC (cổng `kinh-webkit-prefix`): thiếu nó thì Safari/tablet
        // không mờ nền, lớp phủ đọc ra như một tấm màu phẳng.
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        style={{
          width: 'min(760px, 94vw)', maxHeight: '86vh', display: 'flex', flexDirection: 'column',
          borderRadius: 20, border: '1px solid var(--border)', background: 'var(--panel)',
          boxShadow: '0 24px 60px rgba(0,0,0,.34)', overflow: 'hidden',
        }}
      >
        {/* ── đầu bảng: tên + tổng thời lượng THẬT + fps ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
          <Clapperboard size={18} style={{ color: 'var(--t3)', flex: 'none' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>
            {tr('Bản dựng thô', 'Rough assembly')}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--t4)' }}>
            {tr('nối đuôi, không cắt, không chuyển cảnh', 'end to end — no cuts, no transitions')}
          </span>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--t3)' }}>
              {tr('Khung/giây', 'Frames/s')}
              <select
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                aria-label={tr('Khung hình mỗi giây', 'Frames per second')}
                style={{
                  height: 28, borderRadius: 10, padding: '0 6px', fontSize: 12, fontWeight: 600,
                  border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)',
                }}
              >
                {FPS_CHON.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
            <button
              type="button"
              onClick={() => void chepBanIn()}
              disabled={dung.canh.length === 0 && dung.boQua.length === 0}
              title={tr('Chép bản in cho người dựng (mã thời gian vào/ra từng cảnh)', 'Copy the editor’s list (per-shot in/out timecode)')}
              style={{
                height: 28, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 6,
                borderRadius: 10, border: '1px solid var(--border)', background: 'var(--field)',
                color: 'var(--t2)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Copy size={16} /> {daChep ? tr('Đã chép', 'Copied') : tr('Chép bản in', 'Copy list')}
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={tr('Đóng', 'Close')}
                style={{
                  height: 28, width: 28, display: 'grid', placeItems: 'center', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t3)', cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ── tổng: mã thời gian SMPTE, không phải "khoảng" ── */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 22, fontWeight: 650, color: 'var(--t1)', fontVariantNumeric: 'tabular-nums', letterSpacing: '.02em' }}>
            {maThoiGian(dung.tongKhung, dung.fps)}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--t4)', fontVariantNumeric: 'tabular-nums' }}>
            {tr(
              `${dung.canh.length} cảnh · ${dung.tongKhung} khung · ${dung.fps} fps`,
              `${dung.canh.length} shot(s) · ${dung.tongKhung} frames · ${dung.fps} fps`,
            )}
          </span>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 14, display: 'grid', gap: 14 }}>
          {/* ── trục thời gian: bề rộng thanh TỈ LỆ với số khung thật ── */}
          {dung.canh.length > 0 ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', height: 24, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--field)' }}>
                {dung.canh.map((c, i) => (
                  <div
                    key={c.id}
                    title={`${c.nhan} · ${maThoiGian(c.batDauKhung, dung.fps)} → ${maThoiGian(c.ketThucKhung, dung.fps)}`}
                    style={{
                      width: `${(c.soKhung / dung.tongKhung) * 100}%`,
                      background: i % 2 === 0 ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 62%, var(--field))',
                      borderRight: i === dung.canh.length - 1 ? 0 : '1px solid var(--panel)',
                    }}
                  />
                ))}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                <thead>
                  <tr style={{ color: 'var(--t4)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                    <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 650 }}>#</th>
                    <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 650 }}>{tr('Vào', 'In')}</th>
                    <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 650 }}>{tr('Ra', 'Out')}</th>
                    <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 650 }}>{tr('Cảnh', 'Shot')}</th>
                    <th style={{ textAlign: 'right', padding: '4px 6px', fontWeight: 650 }}>{tr('Giây', 'Sec')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dung.canh.map((c, i) => (
                    <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '5px 6px', color: 'var(--t4)' }}>{String(i + 1).padStart(3, '0')}</td>
                      <td style={{ padding: '5px 6px', color: 'var(--t2)' }}>{maThoiGian(c.batDauKhung, dung.fps)}</td>
                      <td style={{ padding: '5px 6px', color: 'var(--t2)' }}>{maThoiGian(c.ketThucKhung, dung.fps)}</td>
                      <td style={{ padding: '5px 6px', color: 'var(--t1)' }}>{c.nhan}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', color: 'var(--t3)' }}>{c.thoiLuongGiay.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '18px 12px', borderRadius: 14, border: '1px dashed var(--border)', color: 'var(--t3)', fontSize: 12.5, lineHeight: 1.6 }}>
              {tr(
                'Chưa có cảnh nào xếp được lên trục. Render một clip ở bảng Kết xuất rồi mở lại — bản dựng thô chỉ nhận cảnh CÓ TỆP và CÓ thời lượng khai rõ.',
                'No shot can be laid on the timeline yet. Render a clip in the Export panel and reopen — a rough assembly only takes shots that have a file and a declared duration.',
              )}
            </div>
          )}

          {/* ── BỎ RA: hộp rỗng phải nói ra là rỗng ── */}
          {dung.boQua.length > 0 && (
            <div style={{ borderRadius: 14, border: '1px solid color-mix(in srgb, var(--danger) 34%, var(--border))', overflow: 'hidden' }}>
              <div style={{ padding: '7px 12px', fontSize: 11, fontWeight: 650, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--danger)', background: 'color-mix(in srgb, var(--danger) 10%, transparent)' }}>
                {tr(`Bỏ ra ${dung.boQua.length} cảnh — không độn khung`, `${dung.boQua.length} shot(s) left out — no filler frames`)}
              </div>
              <ul style={{ margin: 0, padding: '8px 12px', listStyle: 'none', display: 'grid', gap: 5 }}>
                {dung.boQua.map((b) => (
                  <li key={b.id} style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.55 }}>
                    <b style={{ fontWeight: 600, color: 'var(--t1)' }}>{b.nhan}</b>
                    <span style={{ color: 'var(--t4)' }}> — {b.lyDo}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {soAnh > 0 && (
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--t4)', lineHeight: 1.6 }}>
              {tr(
                `${soAnh} ảnh tĩnh trong kho không nằm trong bản dựng — ảnh không phải một cảnh phim.`,
                `${soAnh} still image(s) in the store are not part of the assembly — a still is not a shot.`,
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
