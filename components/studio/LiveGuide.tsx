'use client';

/**
 * components/studio/LiveGuide.tsx — LỚP HƯỚNG DẪN SỐNG (Live Guide / Demo Conductor).
 *
 * KHÔNG phải tour tooltip · KHÔNG modal chặn · KHÔNG overlay tối toàn màn. Ba mảnh, đều nhẹ:
 *   ① VÒNG SÁNG MÉP MỎNG quanh phần tử neo THẬT của bước hiện tại (fixed, pointer-events:none —
 *      không cướp một cú chuột nào của workspace).
 *   ② CALLOUT NHỎ neo cạnh phần tử đó: số bước · hành động · một dòng vì sao · Next/Back.
 *      Mọc từ phía neo (transform-origin hướng về neo), thu về cùng chỗ khi tắt.
 *   ③ XƯƠNG TIẾN ĐỘ gọn (6 chấm) ở chân callout — không phải bảng điều khiển.
 *
 * TỰ TIẾN theo TRẠNG THÁI THẬT (`useBuocXong` — lib/studio/live-guide.ts): chọn ảnh xong thì
 * bước 1 tự qua, generation xong thì bước 3 tự qua… Next/Back chỉ là ghim tay tạm; bấm vào chấm
 * "theo trạng thái" là quay về tự tiến. Esc ẩn guide. KHÔNG bắt phím mũi tên trần (canvas node
 * dùng mũi tên dời node — cướp là phá thao tác thật).
 *
 * Sống ở `AppChrome` (mọi chặng) ⇒ guide SỐNG QUA điều hướng — sang màn không có neo thì callout
 * đứng góc dưới-phải kèm gợi ý đường đi, không bịa vị trí.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { RADIUS } from '@/lib/geometry';
import { DUONG_CONG, nhipToiBac, thoiLuong, giamChuyenDong } from '@/lib/ui/nhip';
import { BUOC_GUIDE, buocHienTai, useBuocXong, useGuideBat } from '@/lib/studio/live-guide';

interface HopNeo {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function LiveGuide() {
  const tr = useT();
  const [bat, datBat] = useGuideBat();
  const xong = useBuocXong();
  const [ghimTay, setGhimTay] = useState<number | null>(null);
  const [neo, setNeo] = useState<HopNeo | null>(null);
  const [mounted, setMounted] = useState(false);
  const [daNo, setDaNo] = useState(false);
  const giam = giamChuyenDong();
  const ms = thoiLuong(nhipToiBac('vien'), giam);
  const doDoi = useRef<number>(0);

  useEffect(() => setMounted(true), []);

  const iBuoc = buocHienTai(xong, ghimTay);
  const buoc = BUOC_GUIDE[iBuoc];

  // Đo neo mỗi 500ms khi guide bật — DOM đổi liên tục (node kéo, panel mở), đo một lần là mốc chết.
  // rAF-theo-frame là quá đắt cho một lớp chỉ dẫn; 500ms đủ mượt cho mắt người xem demo.
  useEffect(() => {
    if (!bat || !mounted) {
      setNeo(null);
      return;
    }
    const đo = () => {
      const el = buoc.timNeo();
      if (!el) {
        setNeo(null);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) {
        setNeo(null);
        return;
      }
      setNeo({ x: r.x, y: r.y, w: r.width, h: r.height });
    };
    đo();
    const t = setInterval(đo, 500);
    return () => clearInterval(t);
  }, [bat, mounted, buoc]);

  // Nở ra sau khung hình đầu — mọc, không teleport.
  useEffect(() => {
    if (!bat) {
      setDaNo(false);
      return;
    }
    const id = requestAnimationFrame(() => setDaNo(true));
    return () => cancelAnimationFrame(id);
  }, [bat, iBuoc]);

  // Esc ẩn guide — phím DUY NHẤT guide bắt (không đụng mũi tên của canvas).
  useEffect(() => {
    if (!bat) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const el = e.target;
      if (el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      datBat(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bat, datBat]);

  if (!mounted || !bat) return null;

  /* Vị trí callout: dưới neo nếu còn chỗ, không thì trên; không neo ⇒ góc dưới-phải. */
  const W_CALLOUT = 300;
  let calloutStyle: React.CSSProperties;
  let goc: string;
  if (neo) {
    const duoi = neo.y + neo.h + 250 < window.innerHeight;
    const trai = Math.max(12, Math.min(window.innerWidth - W_CALLOUT - 12, neo.x + neo.w / 2 - W_CALLOUT / 2));
    calloutStyle = duoi
      ? { position: 'fixed', top: neo.y + neo.h + 10, left: trai }
      : { position: 'fixed', bottom: window.innerHeight - neo.y + 10, left: trai };
    goc = duoi ? '50% 0%' : '50% 100%';
  } else {
    calloutStyle = { position: 'fixed', right: 16, bottom: 60 };
    goc = '100% 100%';
  }
  doDoi.current += 1;

  return createPortal(
    <>
      {/* ① vòng sáng mép — mỏng, không nền tối, không chặn chuột */}
      {neo && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            left: neo.x - 5,
            top: neo.y - 5,
            width: neo.w + 10,
            height: neo.h + 10,
            borderRadius: RADIUS.r3,
            border: '1.5px solid var(--accent)',
            boxShadow: '0 0 0 4px color-mix(in srgb, var(--accent) 14%, transparent)',
            pointerEvents: 'none',
            zIndex: 70,
            transition: giam ? 'none' : `all ${ms}ms ${DUONG_CONG}`,
          }}
        />
      )}

      {/* ② callout neo cạnh — nhỏ, mọc từ hướng neo */}
      <div
        role="complementary"
        aria-label={tr('Hướng dẫn sống', 'Live guide')}
        style={{
          ...calloutStyle,
          width: W_CALLOUT,
          zIndex: 71,
          borderRadius: RADIUS.r3,
          background: 'color-mix(in srgb, var(--panel) 94%, transparent)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-pop)',
          padding: '10px 12px',
          transformOrigin: goc,
          transform: daNo ? 'scale(1)' : 'scale(.94)',
          opacity: daNo ? 1 : 0,
          transition: giam ? 'none' : `transform ${ms}ms ${DUONG_CONG}, opacity ${ms}ms ${DUONG_CONG}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 20,
              height: 20,
              borderRadius: RADIUS.full,
              background: xong.has(buoc.id) ? 'var(--success)' : 'var(--accent)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {buoc.stt}
          </span>
          <strong style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--t1)' }}>
            {tr(buoc.hanhDong.vi, buoc.hanhDong.en)}
          </strong>
          <button
            type="button"
            onClick={() => datBat(false)}
            aria-label={tr('Ẩn hướng dẫn (Esc)', 'Hide guide (Esc)')}
            style={{ border: 0, background: 'none', color: 'var(--t4)', cursor: 'pointer', padding: 2 }}
          >
            <X size={13} />
          </button>
        </div>
        <p style={{ margin: '6px 0 0 28px', fontSize: 11, lineHeight: 1.55, color: 'var(--t3)' }}>
          {tr(buoc.viSao.vi, buoc.viSao.en)}
        </p>
        {!neo && (
          <p style={{ margin: '5px 0 0 28px', fontSize: 10.5, lineHeight: 1.5, color: 'var(--accent)' }}>
            {tr(buoc.goiYKhiVang.vi, buoc.goiYKhiVang.en)}
          </p>
        )}
        {xong.has(buoc.id) && (
          <p style={{ margin: '5px 0 0 28px', fontSize: 10.5, color: 'var(--success)' }}>
            {tr('Đã xong bước này — flow tự tiến tiếp.', 'Step done — the flow advances on its own.')}
          </p>
        )}

        {/* ③ xương tiến độ — 6 chấm, chấm đang là thanh, xong = đầy, chưa = viền */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '10px 0 0 28px' }}>
          {BUOC_GUIDE.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setGhimTay(i === iBuoc ? null : i)}
              aria-label={tr(`Bước ${b.stt}: ${b.hanhDong.vi}`, `Step ${b.stt}: ${b.hanhDong.en}`)}
              aria-current={i === iBuoc}
              style={{
                width: i === iBuoc ? 18 : 7,
                height: 7,
                borderRadius: RADIUS.full,
                border: xong.has(b.id) || i === iBuoc ? 'none' : '1px solid var(--t4)',
                background: i === iBuoc ? 'var(--accent)' : xong.has(b.id) ? 'var(--success)' : 'transparent',
                cursor: 'pointer',
                padding: 0,
                transition: giam ? 'none' : `all 160ms ${DUONG_CONG}`,
              }}
            />
          ))}
          <span style={{ flex: 1 }} />
          <button
            type="button"
            onClick={() => setGhimTay(Math.max(0, iBuoc - 1))}
            disabled={iBuoc === 0}
            aria-label={tr('Bước trước', 'Previous step')}
            style={{
              border: 0,
              background: 'none',
              color: iBuoc === 0 ? 'var(--t5)' : 'var(--t2)',
              cursor: iBuoc === 0 ? 'default' : 'pointer',
              padding: 2,
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => setGhimTay(iBuoc >= BUOC_GUIDE.length - 1 ? null : iBuoc + 1)}
            disabled={iBuoc >= BUOC_GUIDE.length - 1}
            aria-label={tr('Bước kế', 'Next step')}
            style={{
              border: 0,
              background: 'none',
              color: iBuoc >= BUOC_GUIDE.length - 1 ? 'var(--t5)' : 'var(--t2)',
              cursor: iBuoc >= BUOC_GUIDE.length - 1 ? 'default' : 'pointer',
              padding: 2,
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
        {ghimTay !== null && (
          <button
            type="button"
            onClick={() => setGhimTay(null)}
            style={{
              margin: '6px 0 0 28px',
              border: 0,
              background: 'none',
              color: 'var(--accent)',
              fontSize: 10.5,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {tr('← Quay về tự tiến theo trạng thái', '← Back to auto-advance')}
          </button>
        )}
      </div>
    </>,
    document.body,
  );
}

export default LiveGuide;
