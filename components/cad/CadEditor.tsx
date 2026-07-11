'use client';

/**
 * components/cad/CadEditor.tsx — Khung trình CAD 2D (chặng 1 "Layout CAD").
 * Ghép: CadToolbar (nổi) + CadCanvas (nền) + panel Layer (phải) + panel Nội thất (trái, ẩn/hiện)
 * + command-line mini (đáy) + thanh file (import DXF · export PNG/DXF · scale · Đưa sang Render).
 *
 * "Đưa sang Render →": render extents ra PNG dataURL (nền trắng nét đen) → tạo node Import Image
 * trên canvas Render (useFlowStore) rồi router.push('/') — đúng pattern onDrop asset của FlowCanvas.
 */

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderOpen, Download, ArrowRight, Eye, EyeOff, Lock, Unlock, Plus, Trash2, X, Command, Sparkles, Wand2,
} from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { parseDxf, exportDxf } from '@/lib/cad/dxf';
import { renderDocToDataURL } from '@/lib/cad/render';
import { BLOCKS } from '@/lib/cad/furniture';
import { buildDemoPlan } from '@/lib/cad/demo-plan';
import { describeToEntities } from '@/lib/cad/ai-assist';
import { docBox } from '@/lib/cad/model';
import { useFlowStore } from '@/lib/store';
import { stashCadHandoff } from '@/lib/cad/handoff';
import CadCanvas from './CadCanvas';
import CadToolbar from './CadToolbar';

export default function CadEditor() {
  const router = useRouter();
  const [furnitureOpen, setFurnitureOpen] = useState(false);
  const [handoffMsg, setHandoffMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const status = useCadStore((s) => s.status);

  // export/handoff nghe từ toolbar? Ở đây làm nút riêng trên thanh file.
  const doExportPng = () => {
    const doc = useCadStore.getState().doc;
    const url = renderDocToDataURL(doc, 2000);
    downloadDataUrl(url, 'layout.png');
  };
  const doExportDxf = () => {
    const doc = useCadStore.getState().doc;
    const blob = new Blob([exportDxf(doc)], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    downloadDataUrl(url, 'layout.dxf');
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const openDemo = () => {
    if (useCadStore.getState().doc.entities.length > 0) {
      const ok = window.confirm('Mở bản demo sẽ THAY THẾ bản vẽ hiện tại. Tiếp tục?');
      if (!ok) return;
    }
    useCadStore.getState().importDoc(buildDemoPlan(), 'replace');
    useCadStore.getState().setStatus('Đã mở bản demo — căn hộ mẫu 1PN (sơ phác DD). Bấm F để Zoom Extents.');
    window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
  };

  // AI-assist rule-based (lib/cad/ai-assist.ts) — stub tối giản, xem chỗ cắm LLM thật trong file đó.
  const aiAssist = () => {
    const desc = window.prompt('Mô tả nhanh (VD: "phòng ngủ 4x3.5 có giường và tủ áo"):', '');
    if (!desc) return;
    const st = useCadStore.getState();
    const box = docBox(st.doc);
    const origin = box ? { x: box.maxX + 1000, y: box.minY } : { x: 0, y: 0 };
    const wallLayer = st.doc.layers.find((l) => l.name === 'Tường')?.id ?? st.currentLayer;
    const textLayer = st.doc.layers.find((l) => l.name === 'Ghi chú')?.id ?? st.currentLayer;
    const { entities, note } = describeToEntities(desc, origin, wallLayer, textLayer, st.wallThickness);
    st.addEntities(entities);
    st.setStatus(note);
    window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
  };

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const doc = parseDxf(String(reader.result));
        useCadStore.getState().importDoc(doc, 'replace');
        useCadStore.getState().setStatus(`Đã mở ${f.name} — ${doc.entities.length} đối tượng. Dùng scale nếu đơn vị lạ.`);
        window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
      } catch {
        useCadStore.getState().setStatus('Không đọc được DXF (bỏ qua entity lạ).');
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  };

  // "Đưa sang Render →"
  const toRender = () => {
    const doc = useCadStore.getState().doc;
    if (!doc.entities.length) {
      setHandoffMsg('Bản vẽ trống — vẽ hoặc import trước.');
      setTimeout(() => setHandoffMsg(''), 2500);
      return;
    }
    const dataUrl = renderDocToDataURL(doc, 2000);
    const store = useFlowStore.getState();
    try {
      store.setWorkspace('render');
    } catch {
      /* ignore */
    }
    // Node add trực tiếp ở đây sẽ bị wipe khi '/' hydrate + bootstrap loadGraph đè
    // → stash, page.tsx/ProjectSelect consume SAU khi graph nạp xong.
    if (!stashCadHandoff(dataUrl)) {
      // sessionStorage hỏng — fallback add trực tiếp (có thể mất nếu bootstrap đè)
      const pos = { x: 220, y: 180 };
      store.addNode('input.image', pos);
      const newNode = useFlowStore.getState().nodes.at(-1);
      if (newNode) store.updateParam(newNode.id, 'file', dataUrl);
    }
    router.push('/');
  };

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* thanh file */}
      <div style={fileBar}>
        <button type="button" onClick={() => fileRef.current?.click()} style={fileBtn} title="Mở file .dxf">
          <FolderOpen size={14} /> Mở DXF
        </button>
        <input ref={fileRef} type="file" accept=".dxf" hidden onChange={onImportFile} />
        <button type="button" onClick={openDemo} style={fileBtn} title="Nạp 1 mặt bằng căn hộ mẫu đầy đủ (tường/phòng/cửa/kích thước/nội thất)">
          <Sparkles size={14} /> Mở bản demo
        </button>
        <button type="button" onClick={aiAssist} style={fileBtn} title="AI-assist (rule-based): mô tả nhanh 1 phòng → tự vẽ tường + đặt nội thất khớp từ khoá">
          <Wand2 size={14} /> AI mô tả
        </button>
        <ScaleButtons />
        <div style={{ flex: 1 }} />
        <button type="button" onClick={doExportPng} style={fileBtn} title="Xuất PNG nền trắng">
          <Download size={14} /> PNG
        </button>
        <button type="button" onClick={doExportDxf} style={fileBtn} title="Xuất DXF">
          <Download size={14} /> DXF
        </button>
        <button type="button" onClick={toRender} style={{ ...fileBtn, background: 'var(--accent)', color: '#fff', border: 'none' }} title="Kết xuất layout thành node Import Image ở chặng Render">
          Đưa sang Render <ArrowRight size={14} />
        </button>
      </div>

      {/* vùng canvas + panel */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <CadCanvas />
        <CadToolbar onToggleFurniture={() => setFurnitureOpen((o) => !o)} />
        {furnitureOpen && <FurniturePanel onClose={() => setFurnitureOpen(false)} />}
        <LayerPanel />
        {handoffMsg && (
          <div style={{ position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 30, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', fontSize: 12.5, color: 'var(--t2)' }}>
            {handoffMsg}
          </div>
        )}
      </div>

      {/* command line + status */}
      <CommandLine status={status} />
    </div>
  );
}

/* ───────── Scale nhanh ───────── */
function ScaleButtons() {
  const scaleAll = useCadStore((s) => s.scaleAll);
  const opts: [string, number][] = [
    ['×0.1', 0.1],
    ['×10', 10],
    ['×25.4', 25.4],
  ];
  return (
    <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--t4)', alignSelf: 'center' }}>Scale:</span>
      {opts.map(([lbl, f]) => (
        <button key={lbl} type="button" onClick={() => scaleAll(f)} style={{ ...fileBtn, padding: '4px 8px' }} title={`Nhân toàn bộ ×${f} (khi đơn vị import lạ)`}>
          {lbl}
        </button>
      ))}
    </div>
  );
}

/* ───────── Panel Layer ───────── */
function LayerPanel() {
  const doc = useCadStore((s) => s.doc);
  const current = useCadStore((s) => s.currentLayer);
  const setCurrent = useCadStore((s) => s.setCurrentLayer);
  const updateLayer = useCadStore((s) => s.updateLayer);
  const addLayer = useCadStore((s) => s.addLayer);
  const removeLayer = useCadStore((s) => s.removeLayer);

  return (
    <div style={{ ...panel, right: 12, top: 70, width: 230 }}>
      <div style={panelHead}>
        <span>Lớp (Layer)</span>
        <button type="button" onClick={addLayer} title="Thêm lớp" style={miniBtn}>
          <Plus size={14} />
        </button>
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {doc.layers.map((l) => {
          const on = l.id === current;
          return (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 8, background: on ? 'var(--accent-soft)' : 'transparent' }}>
              <input
                type="color"
                value={l.color}
                onChange={(e) => updateLayer(l.id, { color: e.target.value })}
                title="Màu lớp"
                style={{ width: 18, height: 18, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
              />
              <button type="button" onClick={() => setCurrent(l.id)} title="Đặt lớp hiện hành" style={{ flex: 1, textAlign: 'left', border: 'none', background: 'none', color: on ? 'var(--accent)' : 'var(--t2)', fontSize: 12, fontWeight: on ? 600 : 400, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {l.name}
              </button>
              <button type="button" onClick={() => updateLayer(l.id, { visible: !l.visible })} title="Ẩn/hiện" style={miniBtn}>
                {l.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
              <button type="button" onClick={() => updateLayer(l.id, { locked: !l.locked })} title="Khoá/mở" style={miniBtn}>
                {l.locked ? <Lock size={13} /> : <Unlock size={13} />}
              </button>
              <button type="button" onClick={() => removeLayer(l.id)} title="Xoá lớp" style={miniBtn}>
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── Panel Nội thất (block) ───────── */
function FurniturePanel({ onClose }: { onClose: () => void }) {
  const setPendingBlock = useCadStore((s) => s.setPendingBlock);
  const pending = useCadStore((s) => s.pendingBlock);
  const groups = Array.from(new Set(BLOCKS.map((b) => b.group)));
  return (
    <div style={{ ...panel, left: 12, top: 70, width: 210 }}>
      <div style={panelHead}>
        <span>Nội thất (block)</span>
        <button type="button" onClick={onClose} style={miniBtn} title="Đóng">
          <X size={14} />
        </button>
      </div>
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {groups.map((g) => (
          <div key={g} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--t4)', padding: '4px 6px' }}>{g}</div>
            {BLOCKS.filter((b) => b.group === g).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setPendingBlock(b.id)}
                title={`${b.name} — ${b.w}×${b.h}mm. Click canvas để đặt, R xoay 90°.`}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 8px', borderRadius: 7, border: 'none', fontSize: 12, background: pending === b.id ? 'var(--accent)' : 'transparent', color: pending === b.id ? '#fff' : 'var(--t2)', cursor: 'pointer' }}
              >
                {b.name}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Command line mini ───────── */
function CommandLine({ status }: { status: string }) {
  const [val, setVal] = useState('');
  const setTool = useCadStore((s) => s.setTool);
  const setStatus = useCadStore((s) => s.setStatus);
  const deleteSelected = useCadStore((s) => s.deleteSelected);
  const undo = useCadStore((s) => s.undo);
  const redo = useCadStore((s) => s.redo);
  const setOffsetDist = useCadStore((s) => s.setOffsetDist);
  const setWallThickness = useCadStore((s) => s.setWallThickness);
  const setPendingBlock = useCadStore((s) => s.setPendingBlock);
  const setFilletRadius = useCadStore((s) => s.setFilletRadius);
  const setChamferDist = useCadStore((s) => s.setChamferDist);
  const setLengthenDelta = useCadStore((s) => s.setLengthenDelta);

  const run = () => {
    const raw = val.trim();
    if (!raw) return;
    const [cmd, arg, arg2] = raw.split(/\s+/);
    const c = cmd.toUpperCase();
    const map: Record<string, () => void> = {
      L: () => setTool('line'),
      LINE: () => setTool('line'),
      PL: () => setTool('polyline'),
      PLINE: () => setTool('polyline'),
      REC: () => setTool('rect'),
      RECT: () => setTool('rect'),
      C: () => setTool('circle'),
      CIRCLE: () => setTool('circle'),
      A: () => setTool('arc'),
      ARC: () => setTool('arc'),
      M: () => setTool('move'),
      MOVE: () => setTool('move'),
      CO: () => setTool('copy'),
      COPY: () => setTool('copy'),
      RO: () => setTool('rotate'),
      ROTATE: () => setTool('rotate'),
      MI: () => setTool('mirror'),
      MIRROR: () => setTool('mirror'),
      O: () => {
        if (arg && Number.isFinite(parseFloat(arg))) setOffsetDist(parseFloat(arg));
        setTool('offset');
      },
      OFFSET: () => setTool('offset'),
      DIM: () => setTool('dimension'),
      DI: () => setTool('measure'),
      T: () => setTool('text'),
      TEXT: () => setTool('text'),
      W: () => {
        if (arg && Number.isFinite(parseFloat(arg))) setWallThickness(parseFloat(arg));
        setTool('wall');
      },
      WALL: () => setTool('wall'),
      ROOM: () => setTool('room'),
      D: () => setPendingBlock('door'),
      DOOR: () => setPendingBlock('door'),
      WIN: () => setPendingBlock('window'),
      WINDOW: () => setPendingBlock('window'),
      // Nấc 1 — bộ chỉnh sửa (alias chuẩn AutoCAD)
      TR: () => setTool('trim'),
      TRIM: () => setTool('trim'),
      EX: () => setTool('extend'),
      EXTEND: () => setTool('extend'),
      F: () => {
        if (arg && Number.isFinite(parseFloat(arg))) setFilletRadius(parseFloat(arg));
        setTool('fillet');
      },
      FILLET: () => setTool('fillet'),
      CHA: () => {
        const d1 = arg && Number.isFinite(parseFloat(arg)) ? parseFloat(arg) : undefined;
        const d2 = arg2 && Number.isFinite(parseFloat(arg2)) ? parseFloat(arg2) : d1;
        if (d1 !== undefined) setChamferDist(d1, d2 ?? d1);
        setTool('chamfer');
      },
      CHAMFER: () => setTool('chamfer'),
      AR: () => setTool('arrayrect'),
      ARRAY: () => setTool('arrayrect'),
      ARP: () => setTool('arraypolar'),
      ARRAYPOLAR: () => setTool('arraypolar'),
      SC: () => setTool('scale'),
      SCALE: () => setTool('scale'),
      S: () => setTool('stretch'),
      STRETCH: () => setTool('stretch'),
      BR: () => setTool('break'),
      BREAK: () => setTool('break'),
      J: () => setTool('join'),
      JOIN: () => setTool('join'),
      X: () => setTool('explode'),
      EXPLODE: () => setTool('explode'),
      LEN: () => {
        if (arg && Number.isFinite(parseFloat(arg))) setLengthenDelta(parseFloat(arg));
        setTool('lengthen');
      },
      LENGTHEN: () => setTool('lengthen'),
      E: () => deleteSelected(),
      DEL: () => deleteSelected(),
      ERASE: () => deleteSelected(),
      U: () => undo(),
      UNDO: () => undo(),
      RE: () => redo(),
      REDO: () => redo(),
      // Zoom Extents: KHÔNG dùng "F" ở dòng lệnh nữa (F = FILLET theo chuẩn AutoCAD, xem phía
      // trên) — phím tắt trực tiếp 'f' trên canvas (ngoài dòng lệnh) vẫn còn (CadCanvas.tsx).
      EXT: () => window.dispatchEvent(new CustomEvent('cad:zoom-extents')),
      Z: () => window.dispatchEvent(new CustomEvent('cad:zoom-extents')),
      SEL: () => setTool('select'),
    };
    const fn = map[c];
    if (fn) fn();
    else setStatus(`Lệnh không rõ: "${raw}". Thử L, PL, REC, C, A, W, ROOM, D, WIN, M, CO, RO, MI, O, DIM, T, E, U.`);
    setVal('');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 34, flex: '0 0 auto', padding: '0 12px', borderTop: '1px solid var(--border)', background: 'var(--panel)' }}>
      <Command size={14} style={{ color: 'var(--t4)' }} />
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') run();
        }}
        placeholder="Gõ lệnh: L · PL · REC · C · W 200 · ROOM · D · WIN · M · CO · RO · MI · O 150 · DIM · T · E · U…"
        style={{ width: 340, background: 'var(--field)', border: '1px solid var(--border)', borderRadius: 7, padding: '3px 8px', fontSize: 12, color: 'var(--t1)', outline: 'none', fontFamily: 'ui-monospace, monospace' }}
      />
      <span style={{ fontSize: 11.5, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{status}</span>
    </div>
  );
}

function downloadDataUrl(url: string, name: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ───────── styles ───────── */
const fileBar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: 44,
  flex: '0 0 auto',
  padding: '0 12px',
  borderBottom: '1px solid var(--border)',
  background: 'var(--panel)',
};
const fileBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t2)',
  fontSize: 12,
  cursor: 'pointer',
};
const panel: React.CSSProperties = {
  position: 'absolute',
  zIndex: 15,
  background: 'color-mix(in srgb, var(--panel) 82%, transparent)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 8,
  boxShadow: '0 8px 30px rgba(0,0,0,.18)',
};
const panelHead: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--t2)',
  padding: '2px 6px 8px',
};
const miniBtn: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 22,
  height: 22,
  borderRadius: 6,
  border: 'none',
  background: 'transparent',
  color: 'var(--t3)',
  cursor: 'pointer',
};
