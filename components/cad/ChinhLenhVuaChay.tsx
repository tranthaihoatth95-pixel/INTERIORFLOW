'use client';

/**
 * components/cad/ChinhLenhVuaChay.tsx — MẶT TIỀN "Chỉnh lệnh vừa chạy" (Blender F9 *Adjust Last
 * Operation*; brief ngoài gọi là MasterTool) — tầng ③ `docs/TICKET-KIEN-TRUC-LENH-3-TANG.md` §2.
 *
 * Nó là gì: một dải LỆNH NGỮ CẢNH nhỏ mọc ra cạnh chỗ tay vừa thao tác, NGAY SAU KHI một lệnh nhiều
 * bước vừa chốt (Dời · Chép · Xoay · Offset · Tường). Hiện tham số thật vừa dùng, cho gõ lại số →
 * hình học tái áp từ BẢN GỐC (không cộng dồn), mỗi lần = 1 nấc undo. Người dùng khỏi phải Undo
 * rồi làm lại cả chuỗi click; với bút/ngón tay (Sơ phác) đây là ĐƯỜNG DUY NHẤT gõ số sau thao tác.
 *
 * Ranh giới (giữ đúng luật đã chốt):
 *  · Lõi thuần + luật hợp lệ ở `lib/commands/chinh-lenh-vua-chay.ts`; trạng thái + cầu nối ở
 *    `lib/commands/chinh-lenh-store.ts`; bản gốc hình học ở `CadCanvas.tsx`. File này CHỈ vẽ.
 *  · Bàn phím = chuột = chạm: Enter chốt · Esc đóng (GIỮ kết quả) · Tab qua trường · F9/ADJ focus
 *    ô đầu · nút Hoàn tác = `undo()` thật của store rồi đóng. Gõ số thẳng trên canvas (VCB) vẫn
 *    chạy song song và mặt tiền cập nhật theo — hai cửa vào, một trạng thái.
 *  · KHÔNG tự cướp focus khi mọc ra (Chuyên gõ-đuổi trên canvas phải còn nguyên); chỉ focus khi
 *    người dùng bấm vào ô, F9, hoặc gõ ADJ.
 *  · Lớp NỘI DUNG, không phải vỏ ⇒ nền ĐẶC (`--panel`), không kính (chốt 16/08 "kính là vỏ").
 *  · Không hex, không màu tự chế: token panel · field · border · t1..t3 · accent-soft/ring · danger;
 *    bo `RADIUS.r2`; ô nhập cao `--tap` (tự nở 44px trên cảm ứng qua token mật độ sẵn có).
 *  · Từ chối = nói lý do ngay dưới ô (aria-live), KHÔNG đụng hình học, KHÔNG im lặng.
 */

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';
import { Check, SlidersHorizontal, Undo2 } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { useChinhLenh } from '@/lib/commands/chinh-lenh-store';
import { moTaLenh, tenLenh, truongCuaLenh } from '@/lib/commands/chinh-lenh-vua-chay';
import { RADIUS } from '@/lib/geometry';
import { useT } from '@/lib/i18n';

const PANEL_W = 272;
/** Ước lượng cao để kẹp trong khung: đầu 30 + mỗi trường 64 + đáy 44 + lề. */
function uocCao(soTruong: number): number {
  return 30 + soTruong * 64 + 44 + 20;
}

interface Props {
  /** Khung canvas (`wrapRef` của CadCanvas) — để kẹp mặt tiền trong màn. */
  wrapRef: RefObject<HTMLDivElement | null>;
  /** Vùng đáy bị dock nổi che (px) — đọc từ `canvasSafeAreaInsets`, không tự đoán số. */
  bottomInset: number;
}

export default function ChinhLenhVuaChay({ wrapRef, bottomInset }: Props) {
  const t = useT();
  const lenh = useChinhLenh((s) => s.lenh);
  const neo = useChinhLenh((s) => s.neo);
  const focusSeq = useChinhLenh((s) => s.focusSeq);
  const sua = useChinhLenh((s) => s.sua);
  const xoa = useChinhLenh((s) => s.xoa);
  const undo = useCadStore((s) => s.undo);
  const setStatus = useCadStore((s) => s.setStatus);

  // Bản nháp từng ô — chỉ đồng bộ lại từ store khi lệnh đổi (tránh ghi đè lúc đang gõ dở).
  const [nhap, setNhap] = useState<Record<string, string>>({});
  const [loi, setLoi] = useState<{ key: string; lyDo: [string, string] } | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const truong = lenh ? truongCuaLenh(lenh) : [];

  useEffect(() => {
    if (!lenh) { setNhap({}); setLoi(null); return; }
    setNhap(Object.fromEntries(truongCuaLenh(lenh).map((f) => [f.key, String(f.giaTri)])));
    setLoi(null);
  }, [lenh]);

  // F9 / gõ ADJ — chỉ focus theo YÊU CẦU, không tự cướp lúc mọc ra.
  useEffect(() => {
    if (focusSeq === 0) return;
    const el = firstRef.current;
    if (el) { el.focus(); el.select(); }
  }, [focusSeq]);

  if (!lenh || !neo) return null;

  const W = wrapRef.current?.clientWidth ?? 800;
  const H = wrapRef.current?.clientHeight ?? 600;
  const cao = uocCao(truong.length);
  const left = Math.min(Math.max(neo.x + 18, 8), Math.max(8, W - PANEL_W - 8));
  const top = Math.min(Math.max(neo.y + 18, 8), Math.max(8, H - bottomInset - cao - 8));

  const chot = (key: string) => {
    const r = sua(key, nhap[key] ?? '');
    if (r.ok) {
      setLoi(null);
      return true;
    }
    setLoi({ key, lyDo: r.lyDo });
    return false;
  };

  const dong = () => {
    xoa();
    setStatus(t('Đã giữ kết quả. F9 chỉ mở lại được cho lệnh kế tiếp.', 'Result kept. F9 reopens only for the next command.'));
  };

  const hoanTac = () => {
    undo();
    xoa();
    setStatus(t('Đã hoàn tác lệnh vừa chạy.', 'Last command undone.'));
  };

  const inputStyle: CSSProperties = {
    width: '100%',
    height: 'var(--tap)',
    minHeight: 'var(--tap)',
    borderRadius: RADIUS.r2,
    border: '1px solid var(--border)',
    background: 'var(--field)',
    color: 'var(--t1)',
    padding: '0 44px 0 10px',
    fontSize: 13,
    fontVariantNumeric: 'tabular-nums',
    boxSizing: 'border-box',
  };
  const btnStyle = (chinh: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 'var(--tap)',
    minWidth: 'var(--tap)',
    padding: '0 12px',
    borderRadius: RADIUS.full,
    border: chinh ? '1px solid var(--accent-ring)' : '1px solid var(--border)',
    background: chinh ? 'var(--accent-soft)' : 'transparent',
    color: 'var(--t1)',
    fontSize: 12,
    cursor: 'pointer',
  });

  return (
    <div
      role="group"
      aria-label={t('Chỉnh lệnh vừa chạy', 'Adjust last command')}
      data-chinh-lenh={lenh.kind}
      onKeyDown={(e) => {
        // Esc ở bất kỳ đâu trong mặt tiền = ĐÓNG (giữ kết quả); chặn lan ra canvas — Esc của canvas
        // là "huỷ mọi thứ + về Chọn", nặng tay hơn ý người dùng lúc này.
        if (e.key === 'Escape') {
          e.stopPropagation();
          (e.target as HTMLElement | null)?.blur?.();
          dong();
        }
      }}
      style={{
        position: 'absolute',
        left,
        top,
        zIndex: 30,
        width: PANEL_W,
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: RADIUS.r2,
        padding: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,.18)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--t1)' }}>
        <SlidersHorizontal size={13} aria-hidden />
        <span style={{ fontSize: 11.5, fontWeight: 600 }}>{t(...tenLenh(lenh.kind))}</span>
        <span style={{ fontSize: 10.5, color: 'var(--t3)', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
          {t(...moTaLenh(lenh))}
        </span>
      </div>
      {truong.map((f, i) => (
        <label key={f.key} style={{ display: 'block', marginBottom: 8 }}>
          <span style={{ display: 'block', fontSize: 10.5, color: 'var(--t3)', marginBottom: 3 }}>{t(...f.nhan)}</span>
          <span style={{ position: 'relative', display: 'block' }}>
            <input
              ref={i === 0 ? firstRef : undefined}
              value={nhap[f.key] ?? ''}
              inputMode="decimal"
              enterKeyHint="done"
              aria-invalid={loi?.key === f.key || undefined}
              aria-describedby={loi?.key === f.key ? `chinh-lenh-loi-${f.key}` : undefined}
              onChange={(e) => {
                const v = e.target.value;
                setNhap((prev) => ({ ...prev, [f.key]: v }));
                if (loi?.key === f.key) setLoi(null);
              }}
              onFocus={(e) => e.currentTarget.select()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  chot(f.key);
                }
              }}
              style={inputStyle}
            />
            {f.donVi && (
              <span
                aria-hidden
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--t3)' }}
              >
                {f.donVi}
              </span>
            )}
          </span>
          {loi?.key === f.key ? (
            <span id={`chinh-lenh-loi-${f.key}`} role="alert" style={{ display: 'block', fontSize: 10.5, color: 'var(--danger)', marginTop: 3 }}>
              {t(...loi.lyDo)}
            </span>
          ) : f.goiY ? (
            <span style={{ display: 'block', fontSize: 10.5, color: 'var(--t3)', marginTop: 3 }}>{t(...f.goiY)}</span>
          ) : null}
        </label>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
        <button type="button" onClick={hoanTac} style={btnStyle(false)} aria-label={t('Hoàn tác lệnh vừa chạy', 'Undo last command')}>
          <Undo2 size={13} aria-hidden /> {t('Hoàn tác', 'Undo')}
        </button>
        <span style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => {
              // Áp trường đầu (ô còn gõ dở) rồi đóng — chạm một lần trên tablet.
              const okAll = truong.every((f) => chot(f.key));
              if (okAll) dong();
            }}
            style={btnStyle(true)}
            aria-label={t('Áp dụng và đóng', 'Apply and close')}
          >
            <Check size={13} aria-hidden /> {t('Xong', 'Done')}
          </button>
        </span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 6 }}>
        {t('Enter áp · Esc đóng, giữ kết quả · F9 mở lại', 'Enter applies · Esc closes, keeps result · F9 reopens')}
      </div>
    </div>
  );
}
