'use client';

/**
 * components/present-editor/ImageEditor.tsx — Chế độ CHỈNH ẢNH kiểu Canva.
 *
 * Mở khi NHẤP ĐÚP một image element. Overlay giữa màn:
 *   - Xem ảnh gốc lớn + KÉO KHUNG CROP trực tiếp (4 góc + kéo cả khung).
 *   - Fit/Fill, xoay-lật (không có — giữ gọn), thay ảnh (upload máy / thư viện Reference).
 *   - Filter preset (1 chạm áp bộ sáng/tương phản/bão hoà/nhiệt).
 *   - Sliders sáng · tương phản · bão hoà · nhiệt (live).
 *   - Bo góc.
 * Thoát bằng Esc / nút Xong / click nền tối. Mọi thay đổi ghi thẳng lên model → phản
 * chiếu ở canvas (Element/render.ts) và export (không lệch).
 *
 * Crop lưu theo model: CropRect (x,y,w,h ∈ 0..1 của ảnh gốc). Kéo khung trên khung xem
 * ảnh "contain" rồi quy đổi ngược về 0..1.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ImageElement, ImageAdjust, CropRect } from '@/lib/present-editor/model';
import { DEFAULT_ADJUST, adjustToCssFilter } from '@/lib/present-editor/model';
import { X, Check, Crop as CropIcon, Maximize, RotateCcw, Upload, Images } from 'lucide-react';
import type { GuAsset } from '@/lib/gu';

interface Props {
  el: ImageElement;
  /** ảnh thư viện Reference để "thay ảnh" nhanh. */
  libAssets: GuAsset[];
  onUpdate: (mutate: (el: ImageElement) => void, live?: boolean) => void;
  onClose: () => void;
}

/** Bộ lọc dựng sẵn (áp 1 chạm). Giá trị khớp ImageAdjust. */
const FILTER_PRESETS: { id: string; label: string; adjust: ImageAdjust }[] = [
  { id: 'original', label: 'Gốc', adjust: { ...DEFAULT_ADJUST } },
  { id: 'warm', label: 'Ấm', adjust: { brightness: 104, contrast: 104, saturate: 108, temperature: 34 } },
  { id: 'cool', label: 'Lạnh', adjust: { brightness: 102, contrast: 106, saturate: 96, temperature: -30 } },
  { id: 'muted', label: 'Trầm', adjust: { brightness: 100, contrast: 96, saturate: 74, temperature: 8 } },
  { id: 'vivid', label: 'Rực', adjust: { brightness: 104, contrast: 116, saturate: 138, temperature: 4 } },
  { id: 'noir', label: 'Đen trắng', adjust: { brightness: 104, contrast: 118, saturate: 0, temperature: 0 } },
  { id: 'soft', label: 'Dịu', adjust: { brightness: 108, contrast: 88, saturate: 92, temperature: 12 } },
];

type CropHandle = 'nw' | 'ne' | 'sw' | 'se' | 'move';

export default function ImageEditor({ el, libAssets, onUpdate, onClose }: Props) {
  const [tab, setTab] = useState<'crop' | 'adjust' | 'replace'>('adjust');
  const fileRef = useRef<HTMLInputElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ handle: CropHandle; startX: number; startY: number; crop: CropRect } | null>(null);
  // kích thước thật của khung ảnh "contain" (để quy đổi kéo → 0..1).
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  // tỉ lệ ảnh gốc (naturalW / naturalH) — để crop theo tỉ lệ hiển thị đúng.
  const natRef = useRef(1);

  const crop = el.crop ?? { x: 0, y: 0, w: 1, h: 1 };
  const adjust = el.adjust ?? DEFAULT_ADJUST;

  // Esc để thoát.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  // Đo khung ảnh contain khi ảnh load (để crop chồng đúng vùng ảnh, không phải vùng letterbox).
  const measure = useCallback((imgW: number, imgH: number) => {
    natRef.current = imgW / Math.max(imgH, 1);
    const vp = viewRef.current;
    if (!vp) return;
    const availW = vp.clientWidth;
    const availH = vp.clientHeight;
    const scale = Math.min(availW / imgW, availH / imgH);
    setBox({ w: imgW * scale, h: imgH * scale });
  }, []);

  function setAdjust(next: ImageAdjust, live: boolean) {
    onUpdate((im) => (im.adjust = next), live);
  }
  function set(k: keyof ImageAdjust, v: number, live: boolean) {
    setAdjust({ ...adjust, [k]: v }, live);
  }

  function clampCrop(c: CropRect): CropRect {
    const w = Math.min(Math.max(c.w, 0.08), 1);
    const h = Math.min(Math.max(c.h, 0.08), 1);
    const x = Math.min(Math.max(c.x, 0), 1 - w);
    const y = Math.min(Math.max(c.y, 0), 1 - h);
    return { x, y, w, h };
  }

  /* --------- kéo khung crop (quy đổi px trên box → 0..1) --------- */
  function onCropDown(e: React.PointerEvent, handle: CropHandle) {
    e.stopPropagation();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* bỏ qua nếu con trỏ không active */
    }
    dragRef.current = { handle, startX: e.clientX, startY: e.clientY, crop: { ...crop } };
  }
  function onCropMove(e: React.PointerEvent) {
    const st = dragRef.current;
    if (!st || !box) return;
    const dx = (e.clientX - st.startX) / box.w;
    const dy = (e.clientY - st.startY) / box.h;
    let c = { ...st.crop };
    if (st.handle === 'move') {
      c.x = st.crop.x + dx;
      c.y = st.crop.y + dy;
    } else {
      if (st.handle.includes('e')) c.w = st.crop.w + dx;
      if (st.handle.includes('s')) c.h = st.crop.h + dy;
      if (st.handle.includes('w')) {
        c.w = st.crop.w - dx;
        c.x = st.crop.x + dx;
      }
      if (st.handle.includes('n')) {
        c.h = st.crop.h - dy;
        c.y = st.crop.y + dy;
      }
    }
    onUpdate((im) => (im.crop = clampCrop(c)), true);
  }
  function onCropUp(e: React.PointerEvent) {
    if (!dragRef.current) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    onUpdate((im) => (im.crop = clampCrop(im.crop)), false);
    dragRef.current = null;
  }

  // Crop giữ giữa theo tỉ lệ hiển thị rw:rh (quy đổi qua tỉ lệ ảnh gốc để KHUNG đúng tỉ lệ).
  function ratioCrop(rw: number, rh: number): CropRect {
    const nat = natRef.current || 1; // natW/natH
    // w/h (trong không gian 0..1 của ảnh gốc) = (rw/rh) / nat
    const target = rw / rh / nat;
    let w = 1;
    let h = 1;
    if (target >= 1) h = 1 / target;
    else w = target;
    return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
  }

  function replaceSrc(src: string) {
    onUpdate((im) => {
      im.src = src;
      im.crop = { x: 0, y: 0, w: 1, h: 1 }; // ảnh mới → bỏ crop cũ
    });
    setTab('adjust');
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => replaceSrc(String(reader.result));
    reader.readAsDataURL(f);
    e.target.value = '';
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(10,10,12,.72)',
        backdropFilter: 'blur(6px)',
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* thanh trên */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--panel)',
        }}
      >
        <CropIcon size={16} style={{ color: 'var(--accent)' }} />
        <strong style={{ fontSize: 13, color: 'var(--t1)' }}>Chỉnh ảnh</strong>
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          <Tab active={tab === 'adjust'} onClick={() => setTab('adjust')}>Chỉnh màu</Tab>
          <Tab active={tab === 'crop'} onClick={() => setTab('crop')}>Cắt</Tab>
          <Tab active={tab === 'replace'} onClick={() => setTab('replace')}>Thay ảnh</Tab>
        </div>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={onClose} style={doneBtn}>
          <Check size={14} /> Xong
        </button>
        <button type="button" onClick={onClose} style={iconBtn} title="Đóng (Esc)">
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* khung xem ảnh */}
        <div
          ref={viewRef}
          style={{
            flex: 1,
            minWidth: 0,
            display: 'grid',
            placeItems: 'center',
            padding: 28,
            position: 'relative',
          }}
        >
          <div style={{ position: 'relative', width: box?.w ?? 'auto', height: box?.h ?? 'auto' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={el.src}
              alt=""
              onLoad={(e) => measure(e.currentTarget.naturalWidth || 1600, e.currentTarget.naturalHeight || 1200)}
              style={{
                display: 'block',
                width: box ? box.w : 'auto',
                height: box ? box.h : 'auto',
                maxWidth: '78vw',
                maxHeight: '70vh',
                objectFit: 'contain',
                filter: tab === 'crop' ? 'none' : adjustToCssFilter(adjust),
                borderRadius: tab === 'crop' ? 0 : ((el.radius ?? 0) / 100) * Math.min(box?.w ?? 0, box?.h ?? 0) * 0.5,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />

            {/* lớp phủ cắt ảnh (chỉ ở tab crop) */}
            {tab === 'crop' && box && (
              <>
                {/* vùng mờ ngoài crop */}
                <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 9999px rgba(0,0,0,.42)', clipPath: cropInverseClip(crop), pointerEvents: 'none' }} />
                {/* khung crop */}
                <div
                  onPointerDown={(e) => onCropDown(e, 'move')}
                  onPointerMove={onCropMove}
                  onPointerUp={onCropUp}
                  style={{
                    position: 'absolute',
                    left: `${crop.x * 100}%`,
                    top: `${crop.y * 100}%`,
                    width: `${crop.w * 100}%`,
                    height: `${crop.h * 100}%`,
                    border: '1.5px solid #fff',
                    boxShadow: '0 0 0 1px rgba(0,0,0,.4)',
                    cursor: 'move',
                    touchAction: 'none',
                  }}
                >
                  {(['nw', 'ne', 'sw', 'se'] as CropHandle[]).map((h) => (
                    <span
                      key={h}
                      onPointerDown={(e) => onCropDown(e, h)}
                      onPointerMove={onCropMove}
                      onPointerUp={onCropUp}
                      style={cropHandleStyle(h)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* bảng điều khiển phải */}
        <aside
          style={{
            width: 300,
            flex: '0 0 300px',
            borderLeft: '1px solid var(--border)',
            background: 'var(--panel)',
            padding: 16,
            overflowY: 'auto',
          }}
        >
          {tab === 'adjust' && (
            <>
              <Section title="Bộ lọc">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {FILTER_PRESETS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setAdjust({ ...f.adjust }, false)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        padding: 4,
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--card)',
                        cursor: 'pointer',
                        color: 'var(--t2)',
                        fontSize: 10,
                      }}
                      title={f.label}
                    >
                      <div
                        style={{
                          aspectRatio: '16/10',
                          borderRadius: 5,
                          backgroundImage: `url("${el.src}")`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          filter: adjustToCssFilter(f.adjust),
                        }}
                      />
                      {f.label}
                    </button>
                  ))}
                </div>
              </Section>
              <Section title="Tinh chỉnh">
                <Slider label="Sáng" value={adjust.brightness} min={20} max={200} onChange={(v, l) => set('brightness', v, l)} />
                <Slider label="Tương phản" value={adjust.contrast} min={20} max={200} onChange={(v, l) => set('contrast', v, l)} />
                <Slider label="Bão hoà" value={adjust.saturate} min={0} max={250} onChange={(v, l) => set('saturate', v, l)} />
                <Slider label="Nhiệt độ" value={adjust.temperature} min={-100} max={100} onChange={(v, l) => set('temperature', v, l)} />
                <button type="button" onClick={() => setAdjust({ ...DEFAULT_ADJUST }, false)} style={ghostBtn}>
                  <RotateCcw size={12} /> Đặt lại màu
                </button>
              </Section>
              <Section title="Bo góc">
                <Slider
                  label={`${el.radius ?? 0}%`}
                  value={el.radius ?? 0}
                  min={0}
                  max={50}
                  onChange={(v, l) => onUpdate((im) => (im.radius = v), l)}
                />
              </Section>
            </>
          )}

          {tab === 'crop' && (
            <Section title="Cắt ảnh">
              <p style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5, margin: '0 0 8px' }}>
                Kéo khung trắng hoặc các góc để chọn vùng giữ lại.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <RatioBtn onClick={() => onUpdate((im) => (im.crop = { x: 0, y: 0, w: 1, h: 1 }))}>Toàn ảnh</RatioBtn>
                <RatioBtn onClick={() => onUpdate((im) => (im.crop = ratioCrop(1, 1)))}>Vuông 1:1</RatioBtn>
                <RatioBtn onClick={() => onUpdate((im) => (im.crop = ratioCrop(16, 9)))}>16:9</RatioBtn>
                <RatioBtn onClick={() => onUpdate((im) => (im.crop = ratioCrop(4, 3)))}>4:3</RatioBtn>
                <RatioBtn onClick={() => onUpdate((im) => (im.crop = ratioCrop(3, 4)))}>3:4 dọc</RatioBtn>
                <RatioBtn onClick={() => onUpdate((im) => (im.crop = ratioCrop(2, 3)))}>2:3 dọc</RatioBtn>
              </div>
              <button
                type="button"
                onClick={() => onUpdate((im) => (im.crop = { x: 0, y: 0, w: 1, h: 1 }))}
                style={{ ...ghostBtn, marginTop: 10 }}
              >
                <Maximize size={12} /> Bỏ crop
              </button>
            </Section>
          )}

          {tab === 'replace' && (
            <Section title="Thay ảnh">
              <button type="button" onClick={() => fileRef.current?.click()} style={primaryBtn}>
                <Upload size={14} /> Tải ảnh từ máy
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
              {libAssets.length > 0 ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '12px 0 8px', fontSize: 11, color: 'var(--t3)' }}>
                    <Images size={13} /> Thư viện Reference
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {libAssets.slice(0, 24).map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => replaceSrc(a.url)}
                        title={a.name}
                        style={{
                          aspectRatio: '4/3',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          backgroundImage: `url("${a.url}")`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 11, color: 'var(--t4)', lineHeight: 1.5, marginTop: 10 }}>
                  Chưa có ảnh trong thư viện Reference. Tải ảnh từ máy để thay.
                </p>
              )}
            </Section>
          )}
        </aside>
      </div>
    </div>
  );
}

/** clip-path che vùng NGOÀI crop (để dim). Dùng polygon "khoét lỗ". */
function cropInverseClip(c: CropRect): string {
  const x0 = (c.x * 100).toFixed(2);
  const y0 = (c.y * 100).toFixed(2);
  const x1 = ((c.x + c.w) * 100).toFixed(2);
  const y1 = ((c.y + c.h) * 100).toFixed(2);
  // khung ngoài theo chiều kim đồng hồ, rồi lỗ theo ngược chiều (even-odd tự nhiên của polygon)
  return `polygon(0% 0%, 0% 100%, ${x0}% 100%, ${x0}% ${y0}%, ${x1}% ${y0}%, ${x1}% ${y1}%, ${x0}% ${y1}%, ${x0}% 100%, 100% 100%, 100% 0%)`;
}

function cropHandleStyle(h: CropHandle): React.CSSProperties {
  const s = 14;
  const off = -s / 2;
  const base: React.CSSProperties = {
    position: 'absolute',
    width: s,
    height: s,
    background: '#fff',
    border: '1px solid rgba(0,0,0,.35)',
    borderRadius: 3,
    touchAction: 'none',
  };
  const map: Record<string, React.CSSProperties> = {
    nw: { left: off, top: off, cursor: 'nwse-resize' },
    ne: { right: off, top: off, cursor: 'nesw-resize' },
    sw: { left: off, bottom: off, cursor: 'nesw-resize' },
    se: { right: off, bottom: off, cursor: 'nwse-resize' },
  };
  return { ...base, ...map[h] };
}

/* -------------------------------- UI bits -------------------------------- */
function Tab({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '5px 12px',
        borderRadius: 7,
        border: active ? '1px solid var(--accent)' : '1px solid transparent',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--t3)',
        fontSize: 12,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h4
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          color: 'var(--t3)',
          margin: '0 0 10px',
        }}
      >
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number, live: boolean) => void;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--t3)' }}>{label} {value}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(+e.target.value, true)}
        onPointerUp={(e) => onChange(+(e.target as HTMLInputElement).value, false)}
        style={{ width: '100%' }}
      />
    </label>
  );
}

function RatioBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 6px',
        borderRadius: 7,
        border: '1px solid var(--border)',
        background: 'var(--field)',
        color: 'var(--t2)',
        fontSize: 12,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

const doneBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 14px',
  borderRadius: 8,
  border: '1px solid var(--accent)',
  background: 'var(--accent)',
  color: '#fff',
  fontSize: 13,
  cursor: 'pointer',
};

const iconBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t2)',
  cursor: 'pointer',
};

const primaryBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  width: '100%',
  padding: '10px',
  borderRadius: 8,
  border: '1px solid var(--accent)',
  background: 'var(--accent-soft)',
  color: 'var(--accent)',
  fontSize: 13,
  cursor: 'pointer',
};

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
  padding: '7px 10px',
  borderRadius: 7,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t3)',
  fontSize: 12,
  cursor: 'pointer',
};
