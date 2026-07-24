'use client';

/**
 * components/cad/ZonePanel.tsx — Zone tool (24/07, GAP-COLOR-FILL N3):
 *  - ZonePanel: cấu hình zone/arrow (6 nhóm chức năng VN hoá · kiểu biên oval/polygon · opacity
 *    · mũi tên 2 đầu) + lớp ảnh aerial site (upload/fit/scale/move/opacity) + nút "Xuất Presenting"
 *    (render zone map + legend → slide mới ở chặng Presenting).
 *  - ZonesLegend: chú giải chấm màu tự sinh từ các zone đang có trong doc — KÉO ĐƯỢC quanh
 *    canvas, click 1 zone để chọn + zoom tới.
 * UI nội bộ theo ngôn ngữ panel sẵn có của CadEditor (var(--panel)/keyline mảnh) — TTT design
 * áp dụng theo TINH THẦN (label tracked uppercase, keyline 1px), xem CLAUDE.md.
 */

import { useRef, useState } from 'react';
import { X, Upload, Trash2, Maximize, ArrowRight, Eye, EyeOff, MoveUpRight } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import type { ZoneEntity, ZoneGroup } from '@/lib/cad/model';
import { ZONE_GROUP_META, ZONE_GROUPS, docBox, zoneCentroid } from '@/lib/cad/model';

const panel: React.CSSProperties = {
  position: 'absolute',
  zIndex: 22,
  background: 'color-mix(in srgb, var(--panel) 92%, transparent)',
  backdropFilter: 'blur(14px)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 8,
  boxShadow: '0 8px 24px rgba(0,0,0,.18)',
};
const headStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 650,
  color: 'var(--t3)', padding: '2px 4px 8px',
};
const miniBtn: React.CSSProperties = {
  display: 'grid', placeItems: 'center', width: 22, height: 22, borderRadius: 6,
  border: 'none', background: 'transparent', color: 'var(--t3)', cursor: 'pointer',
};
const rowLabel: React.CSSProperties = { fontSize: 10.5, color: 'var(--t4)', margin: '6px 4px 3px' };

/** Panel cấu hình Zone/Arrow — hiện khi tool='zone' hoặc 'arrow' (CadEditor mount). */
export function ZonePanel({ onClose, onExportPresent }: { onClose: () => void; onExportPresent: () => void }) {
  const zoneGroup = useCadStore((s) => s.zoneGroup);
  const setZoneGroup = useCadStore((s) => s.setZoneGroup);
  const zoneOpacity = useCadStore((s) => s.zoneOpacity);
  const setZoneOpacity = useCadStore((s) => s.setZoneOpacity);
  const mode = useCadStore((s) => s.zoneBoundaryMode);
  const setMode = useCadStore((s) => s.setZoneBoundaryMode);
  const bothHeads = useCadStore((s) => s.arrowBothHeads);
  const setBothHeads = useCadStore((s) => s.setArrowBothHeads);
  const tool = useCadStore((s) => s.tool);
  const site = useCadStore((s) => s.doc.siteImage);
  const setSiteImage = useCadStore((s) => s.setSiteImage);
  const updateSiteImage = useCadStore((s) => s.updateSiteImage);
  const fileRef = useRef<HTMLInputElement>(null);

  // Upload aerial: đọc data URL + kích thước thật của ảnh → world bounds mặc định TRẢI THEO
  // bao hình bản vẽ (giữ tỉ lệ ảnh); bản vẽ trống → 20m bề ngang neo tại gốc.
  const onPickAerial = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    ev.target.value = '';
    if (!f || !f.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onload = () => {
        const st = useCadStore.getState();
        const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
        const box = docBox(st.doc);
        let x = 0;
        let y = 0;
        let w = 20000;
        if (box) {
          const bw = Math.max(1, box.maxX - box.minX);
          const bh = Math.max(1, box.maxY - box.minY);
          w = Math.max(bw, bh * aspect) * 1.15; // phủ trùm bản vẽ + lề 15%
          x = (box.minX + box.maxX) / 2 - w / 2;
          y = (box.minY + box.maxY) / 2 - w / aspect / 2;
        }
        st.setSiteImage({ src, x, y, w, h: w / aspect, opacity: 0.6, visible: true });
        st.setStatus('Đã trải ảnh aerial theo bản vẽ — chỉnh vị trí/tỉ lệ/độ mờ trong panel Zone.');
      };
      img.src = src;
    };
    reader.readAsDataURL(f);
  };

  const fitToDrawing = () => {
    const st = useCadStore.getState();
    const s = st.doc.siteImage;
    const box = docBox(st.doc);
    if (!s || !box) return;
    const aspect = s.w / Math.max(1, s.h);
    const bw = Math.max(1, box.maxX - box.minX);
    const bh = Math.max(1, box.maxY - box.minY);
    const w = Math.max(bw, bh * aspect) * 1.15;
    st.updateSiteImage({ w, h: w / aspect, x: (box.minX + box.maxX) / 2 - w / 2, y: (box.minY + box.maxY) / 2 - w / aspect / 2 });
  };

  const scaleSite = (f: number) => {
    if (!site) return;
    const cx = site.x + site.w / 2;
    const cy = site.y + site.h / 2;
    const w = site.w * f;
    const h = site.h * f;
    updateSiteImage({ w, h, x: cx - w / 2, y: cy - h / 2 });
  };
  const nudge = (dx: number, dy: number) => {
    if (!site) return;
    updateSiteImage({ x: site.x + dx, y: site.y + dy });
  };
  const NUDGE = 500; // mm

  const segBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '4px 0', borderRadius: 7, border: '1px solid var(--border)', fontSize: 11,
    background: active ? 'var(--accent)' : 'transparent', color: active ? '#fff' : 'var(--t3)', cursor: 'pointer',
  });

  return (
    // zIndex 24 > legend (22) — panel cấu hình đang thao tác luôn nổi trên legend tĩnh.
    <div style={{ ...panel, left: 12, top: 70, width: 252, zIndex: 24 }}>
      <div style={headStyle}>
        <span>Zone · Diagram</span>
        <button type="button" onClick={onClose} style={miniBtn} title="Đóng">
          <X size={14} />
        </button>
      </div>

      {tool === 'zone' && (
        <>
          <div style={rowLabel}>Kiểu biên</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button type="button" onClick={() => setMode('ellipse')} style={segBtn(mode === 'ellipse')}>Oval</button>
            <button type="button" onClick={() => setMode('polygon')} style={segBtn(mode === 'polygon')}>Polygon</button>
          </div>

          <div style={rowLabel}>Nhóm chức năng · Function group</div>
          <div style={{ display: 'grid', gap: 3 }}>
            {ZONE_GROUPS.map((g: ZoneGroup) => {
              const meta = ZONE_GROUP_META[g];
              const on = zoneGroup === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setZoneGroup(g)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '5px 7px', borderRadius: 8,
                    border: on ? '1px solid var(--accent)' : '1px solid transparent',
                    background: on ? 'var(--accent-soft)' : 'transparent', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: meta.color, opacity: 0.85, flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, color: on ? 'var(--t1)' : 'var(--t2)', fontWeight: on ? 650 : 450 }}>{meta.vi}</span>
                  <span style={{ fontSize: 10, color: 'var(--t4)', marginLeft: 'auto' }}>{meta.en}</span>
                </button>
              );
            })}
          </div>

          <div style={rowLabel}>Độ mờ fill — {Math.round(zoneOpacity * 100)}%</div>
          <input
            type="range" min={10} max={80} value={Math.round(zoneOpacity * 100)}
            onChange={(e) => setZoneOpacity(parseInt(e.target.value, 10) / 100)}
            style={{ width: '100%' }}
          />
        </>
      )}

      {tool === 'arrow' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px', cursor: 'pointer' }}>
          <input type="checkbox" checked={bothHeads} onChange={(e) => setBothHeads(e.target.checked)} />
          <MoveUpRight size={13} />
          <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>Mũi tên CẢ 2 đầu (song hướng)</span>
        </label>
      )}

      {/* ── Ảnh aerial site ── */}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 6 }}>
        <div style={rowLabel}>Ảnh aerial site (nền)</div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickAerial} />
        {!site && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center', padding: '6px 0', borderRadius: 8, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--t2)', fontSize: 11.5, cursor: 'pointer' }}
          >
            <Upload size={13} /> Tải ảnh vệ tinh / hiện trạng
          </button>
        )}
        {site && (
          <div style={{ display: 'grid', gap: 5 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <button type="button" onClick={() => updateSiteImage({ visible: !site.visible })} style={{ ...segBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }} title="Ẩn/hiện ảnh nền">
                {site.visible ? <Eye size={12} /> : <EyeOff size={12} />} {site.visible ? 'Hiện' : 'Ẩn'}
              </button>
              <button type="button" onClick={fitToDrawing} style={{ ...segBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }} title="Trải lại theo bao hình bản vẽ">
                <Maximize size={12} /> Fit
              </button>
              <button type="button" onClick={() => setSiteImage(null)} style={{ ...segBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }} title="Gỡ ảnh nền">
                <Trash2 size={12} /> Gỡ
              </button>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, color: 'var(--t4)', width: 52 }}>Tỉ lệ</span>
              <button type="button" onClick={() => scaleSite(0.9)} style={segBtn(false)}>−10%</button>
              <button type="button" onClick={() => scaleSite(1.1)} style={segBtn(false)}>+10%</button>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, color: 'var(--t4)', width: 52 }}>Di chuyển</span>
              <button type="button" onClick={() => nudge(-NUDGE, 0)} style={segBtn(false)}>←</button>
              <button type="button" onClick={() => nudge(NUDGE, 0)} style={segBtn(false)}>→</button>
              <button type="button" onClick={() => nudge(0, NUDGE)} style={segBtn(false)}>↑</button>
              <button type="button" onClick={() => nudge(0, -NUDGE)} style={segBtn(false)}>↓</button>
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: 'var(--t4)', marginBottom: 2 }}>Độ mờ ảnh — {Math.round(site.opacity * 100)}%</div>
              <input
                type="range" min={10} max={100} value={Math.round(site.opacity * 100)}
                onChange={(e) => updateSiteImage({ opacity: parseInt(e.target.value, 10) / 100 })}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Xuất Presenting ── */}
      <button
        type="button"
        onClick={onExportPresent}
        title="Render zone map + legend thành 1 slide mới ở chặng Presenting"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 8, padding: '7px 0', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
      >
        Xuất Presenting <ArrowRight size={13} />
      </button>
    </div>
  );
}

/** Chú giải zone — tự sinh từ doc, hiện khi có ≥1 zone; kéo được quanh canvas. */
export function ZonesLegend() {
  const doc = useCadStore((s) => s.doc);
  const select = useCadStore((s) => s.select);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 16, y: -16 }); // y âm = neo từ đáy
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  const zones = doc.entities.filter((e): e is ZoneEntity => e.type === 'zone');
  if (!zones.length) return null;
  const hasArrow = doc.entities.some((e) => e.type === 'arrow');
  const used = ZONE_GROUPS.filter((g) => zones.some((z) => z.group === g));

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: pos.x, oy: pos.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setPos({ x: d.ox + (e.clientX - d.startX), y: d.oy + (e.clientY - d.startY) });
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const zoomToZone = (z: ZoneEntity) => {
    select([z.id]);
    const c = zoneCentroid(z);
    window.dispatchEvent(new CustomEvent('cad:zoom-to', { detail: { x: c.x, y: c.y } }));
  };

  return (
    <div
      style={{
        ...panel,
        left: pos.x,
        bottom: pos.y <= 0 ? -pos.y + 40 : undefined,
        top: pos.y > 0 ? pos.y : undefined,
        width: 248,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ ...headStyle, padding: '8px 12px 6px', cursor: 'grab', userSelect: 'none', touchAction: 'none', borderBottom: '1px solid var(--border)' }}
        title="Kéo để di chuyển legend"
      >
        <span>Nhóm chức năng · Legend</span>
      </div>
      <div style={{ padding: '6px 8px 8px' }}>
        {used.map((g) => {
          const meta = ZONE_GROUP_META[g];
          const members = zones.filter((z) => z.group === g);
          return (
            <div key={g} style={{ padding: '4px 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: meta.color, opacity: 0.85, flexShrink: 0 }} />
                <span style={{ fontSize: 10.5, fontWeight: 650, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t1)' }}>{meta.vi}</span>
                <span style={{ fontSize: 10, color: 'var(--t4)' }}>· {meta.en}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '3px 0 0 19px' }}>
                {members.map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => zoomToZone(z)}
                    title="Chọn + zoom tới zone này"
                    style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--t3)', borderRadius: 6, padding: '1px 6px', fontSize: 10, cursor: 'pointer' }}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {hasArrow && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px' }}>
            <MoveUpRight size={11} color="var(--t3)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, fontWeight: 650, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t1)' }}>Giao thông</span>
            <span style={{ fontSize: 10, color: 'var(--t4)' }}>· Circulation (mũi tên đứt)</span>
          </div>
        )}
      </div>
    </div>
  );
}
