'use client';

/**
 * components/cad/CadEditor.tsx — Khung trình CAD 2D (chặng 1 "Layout CAD").
 * Ghép: CadToolbar (nổi) + CadCanvas (nền) + panel Layer (phải) + panel Nội thất (trái, ẩn/hiện)
 * + command-line mini (đáy) + thanh file (import DXF · export PNG/DXF · scale · Đưa sang Render).
 *
 * "Đưa sang Render →": render extents ra PNG dataURL (nền trắng nét đen) → tạo node Import Image
 * trên canvas Render (useFlowStore) rồi router.push('/') — đúng pattern onDrop asset của FlowCanvas.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderOpen, Download, ArrowRight, Eye, EyeOff, Lock, Unlock, Plus, Trash2, X, Command, Sparkles, Wand2,
  ShieldCheck, AlertTriangle, Info, ShieldAlert, Crosshair,
} from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import type { HatchPattern } from '@/lib/cad/model';
import { parseDxf, exportDxf } from '@/lib/cad/dxf';
import { renderDocToDataURL } from '@/lib/cad/render';
import { BLOCKS } from '@/lib/cad/furniture';
import { loadManifest, groupByCategory, type LibraryManifest } from '@/lib/cad/block-library';
import { buildDemoPlan } from '@/lib/cad/demo-plan';
import { describeToEntities } from '@/lib/cad/ai-assist';
import { docBox } from '@/lib/cad/model';
import { useFlowStore } from '@/lib/store';
import { stashCadHandoff } from '@/lib/cad/handoff';
import { checkStandards, type Violation } from '@/lib/cad/standards/checker';
import { getAllRules } from '@/lib/cad/standards/registry';
import { classifyOperator, rulesForOperator, type OperatorType } from '@/lib/cad/operator-profile';
import CadCanvas from './CadCanvas';
import CadToolbar from './CadToolbar';

export default function CadEditor() {
  const router = useRouter();
  const [furnitureOpen, setFurnitureOpen] = useState(false);
  const [standardsOpen, setStandardsOpen] = useState(false);
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
    const furnLayer = st.doc.layers.find((l) => l.name === 'Nội thất')?.id ?? 'l-furniture';
    const { entities, note } = describeToEntities(desc, origin, wallLayer, textLayer, st.wallThickness, furnLayer);
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
        <button type="button" onClick={() => setStandardsOpen((o) => !o)} style={{ ...fileBtn, background: standardsOpen ? 'var(--accent)' : undefined, color: standardsOpen ? '#fff' : undefined }} title="Kiểm chuẩn — đối chiếu bản vẽ với TCVN/QCVN/ISO (chỉ đọc & đề xuất, không tự sửa)">
          <ShieldCheck size={14} /> Kiểm chuẩn
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
        {standardsOpen && <StandardsPanel onClose={() => setStandardsOpen(false)} />}
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
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {doc.layers.map((l) => {
          const on = l.id === current;
          return (
            <div key={l.id} style={{ padding: '5px 8px', borderRadius: 8, background: on ? 'var(--accent-soft)' : 'transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
              <div style={{ display: 'flex', gap: 4, marginTop: 3, paddingLeft: 24 }}>
                <select
                  value={l.lineweight ?? 0.25}
                  onChange={(e) => updateLayer(l.id, { lineweight: parseFloat(e.target.value) })}
                  title="Bề dày nét (mm, ISO 128)"
                  style={miniSelect}
                >
                  {[0.13, 0.18, 0.25, 0.35, 0.5, 0.7, 1.0].map((w) => (
                    <option key={w} value={w}>{w.toFixed(2)}mm</option>
                  ))}
                </select>
                <select
                  value={l.lineType ?? 'continuous'}
                  onChange={(e) => updateLayer(l.id, { lineType: e.target.value as typeof l.lineType })}
                  title="Nét vẽ (linetype)"
                  style={miniSelect}
                >
                  <option value="continuous">liền</option>
                  <option value="hidden">khuất</option>
                  <option value="center">trục</option>
                  <option value="dashed">đứt</option>
                  <option value="phantom">phantom</option>
                </select>
              </div>
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
  // Tab 2 "Thư viện 46": block DXF từ public/cad-library (docs/CAD-LIBRARY.md §6 cách A) —
  // pendingBlock = 'lib:<id>', CadCanvas tự tải + làm phẳng entity lúc đặt.
  const [tab, setTab] = useState<'basic' | 'lib'>('basic');
  const [manifest, setManifest] = useState<LibraryManifest | null>(null);
  const [libErr, setLibErr] = useState('');
  useEffect(() => {
    if (tab !== 'lib' || manifest) return;
    loadManifest()
      .then(setManifest)
      .catch((e) => setLibErr(e instanceof Error ? e.message : String(e)));
  }, [tab, manifest]);

  const itemBtn = (active: boolean): React.CSSProperties => ({
    display: 'block', width: '100%', textAlign: 'left', padding: '5px 8px', borderRadius: 7, border: 'none',
    fontSize: 12, background: active ? 'var(--accent)' : 'transparent', color: active ? '#fff' : 'var(--t2)', cursor: 'pointer',
  });

  return (
    <div style={{ ...panel, left: 12, top: 70, width: 210 }}>
      <div style={panelHead}>
        <span>Nội thất (block)</span>
        <button type="button" onClick={onClose} style={miniBtn} title="Đóng">
          <X size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '0 4px 6px' }}>
        {([['basic', `Cơ bản (${BLOCKS.length})`], ['lib', manifest ? `Thư viện (${manifest.count})` : 'Thư viện']] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{ flex: 1, padding: '4px 0', borderRadius: 7, border: '1px solid var(--border)', fontSize: 11, background: tab === id ? 'var(--accent)' : 'transparent', color: tab === id ? '#fff' : 'var(--t3)', cursor: 'pointer' }}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {tab === 'basic' &&
          groups.map((g) => (
            <div key={g} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--t4)', padding: '4px 6px' }}>{g}</div>
              {BLOCKS.filter((b) => b.group === g).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setPendingBlock(b.id)}
                  title={`${b.name} — ${b.w}×${b.h}mm. Click canvas để đặt, R xoay 90°.`}
                  style={itemBtn(pending === b.id)}
                >
                  {b.name}
                </button>
              ))}
            </div>
          ))}
        {tab === 'lib' && !manifest && (
          <p style={{ fontSize: 11.5, color: libErr ? 'var(--danger, #c0604a)' : 'var(--t4)', padding: '6px 8px' }}>
            {libErr ? `Không tải được thư viện: ${libErr}` : 'Đang tải thư viện…'}
          </p>
        )}
        {tab === 'lib' && manifest &&
          Array.from(groupByCategory(manifest)).map(([cat, blocks]) => (
            <div key={cat} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--t4)', padding: '4px 6px' }}>
                {blocks[0]?.categoryLabel ?? cat}
              </div>
              {blocks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setPendingBlock(`lib:${b.id}`)}
                  title={`${b.name} — ${b.w}×${b.h}mm. Click canvas để đặt, R xoay 90°.`}
                  style={{ ...itemBtn(pending === `lib:${b.id}`), display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.thumb} alt="" width={30} height={22} style={{ objectFit: 'contain', borderRadius: 3, background: '#f4f1ea', flexShrink: 0 }} loading="lazy" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                </button>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}

/* ───────── Panel Kiểm chuẩn (standards checker) — CHỈ ĐỌC + ĐỀ XUẤT, không tự sửa ───────── */
/** Nhãn operator hiển thị (proposal §1). '' = không lọc → dùng getAllRules() như cũ. */
const OPERATOR_LABELS: { value: OperatorType | ''; label: string }[] = [
  { value: '', label: 'Tất cả bộ quy chuẩn (mặc định)' },
  { value: 'residential', label: 'Nhà ở / lưu trú' },
  { value: 'office', label: 'Văn phòng' },
  { value: 'f&b', label: 'F&B (café/nhà hàng)' },
  { value: 'retail', label: 'Bán lẻ / showroom' },
  { value: 'hospitality', label: 'Khách sạn / lounge' },
  { value: 'clinic', label: 'Phòng khám / y tế' },
  { value: 'generic', label: 'Chung (generic)' },
];

function StandardsPanel({ onClose }: { onClose: () => void }) {
  const doc = useCadStore((s) => s.doc);
  const [violations, setViolations] = useState<Violation[] | null>(null);
  // HOOK ML pha 1: operator để LỌC bộ rule. '' (mặc định) ⇒ getAllRules() — hành vi CŨ nguyên vẹn.
  const [operator, setOperator] = useState<OperatorType | ''>('');
  const [detectMsg, setDetectMsg] = useState('');

  // Rule dùng để kiểm: CÓ operator ⇒ lọc theo rulesForOperator; KHÔNG ⇒ getAllRules() như cũ.
  const rulesToUse = () =>
    operator ? rulesForOperator(operator).flatMap((g) => g.rules) : getAllRules();

  const run = () => setViolations(checkStandards(doc, rulesToUse()));

  // Gợi ý operator từ bản vẽ hiện tại (đọc-only, TẤT ĐỊNH). Không tự áp — chỉ chọn sẵn để user duyệt.
  const detect = () => {
    const prof = classifyOperator({ doc });
    setOperator(prof.operator);
    const pct = Math.round(prof.confidence * 100);
    setDetectMsg(
      prof.confidence > 0
        ? `Nhận diện: ${prof.operator} (${pct}%) — ${prof.evidence.slice(0, 2).map((e) => e.detail).join('; ') || 'theo tín hiệu bản vẽ'}`
        : 'Chưa đủ tín hiệu (thiếu block/nhãn phòng) → generic. Giữ "Tất cả" nếu chưa chắc.',
    );
  };

  const zoomTo = (v: Violation) => {
    if (!v.at) return;
    window.dispatchEvent(new CustomEvent('cad:zoom-to', { detail: v.at }));
  };

  const sevIcon = (s: Violation['severity']) => {
    if (s === 'error') return <ShieldAlert size={14} color="#d4645a" />;
    if (s === 'warning') return <AlertTriangle size={14} color="#d4a15a" />;
    return <Info size={14} color="var(--t3)" />;
  };

  return (
    <div style={{ ...panel, right: 12, top: 400, width: 340, maxHeight: '50vh', display: 'flex', flexDirection: 'column' }}>
      <div style={panelHead}>
        <span>Kiểm chuẩn (TCVN/QCVN/ISO)</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" onClick={run} title="Chạy kiểm tra" style={miniBtn}>
            <ShieldCheck size={14} />
          </button>
          <button type="button" onClick={onClose} title="Đóng" style={miniBtn}>
            <X size={14} />
          </button>
        </div>
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--t4)', padding: '0 6px 6px' }}>
        Chỉ đọc bản vẽ và đề xuất — KHÔNG tự sửa. Bấm biểu tượng khiên để chạy/chạy lại sau khi sửa bản vẽ.
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {violations === null && (
          <div style={{ padding: '10px 8px', fontSize: 12, color: 'var(--t3)' }}>Chưa chạy — bấm biểu tượng khiên phía trên.</div>
        )}
        {violations !== null && violations.length === 0 && (
          <div style={{ padding: '10px 8px', fontSize: 12, color: 'var(--t3)' }}>Không phát hiện vi phạm nào (trong phạm vi đo được tự động).</div>
        )}
        {violations?.map((v, i) => (
          <div key={`${v.ruleId}-${i}`} style={{ padding: '7px 8px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <span style={{ marginTop: 2 }}>{sevIcon(v.severity)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--t1)', lineHeight: 1.4 }}>{v.message}</div>
              <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 2 }}>
                {v.source} {v.verified ? '' : '· CHƯA KIỂM CHỨNG (đối chiếu bản gốc trước khi dùng chính thức)'}
              </div>
            </div>
            {v.at && (
              <button type="button" onClick={() => zoomTo(v)} title="Zoom tới vị trí" style={miniBtn}>
                <Crosshair size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Danh mục lệnh (cho autocomplete Việc 2) — bám sát bảng alias trong run() ───────── */
const CAD_COMMANDS: { cmd: string; label: string }[] = [
  { cmd: 'L', label: 'Đường thẳng' },
  { cmd: 'LINE', label: 'Đường thẳng' },
  { cmd: 'PL', label: 'Polyline' },
  { cmd: 'PLINE', label: 'Polyline' },
  { cmd: 'REC', label: 'Chữ nhật' },
  { cmd: 'RECT', label: 'Chữ nhật' },
  { cmd: 'C', label: 'Đường tròn' },
  { cmd: 'CIRCLE', label: 'Đường tròn' },
  { cmd: 'A', label: 'Cung tròn' },
  { cmd: 'ARC', label: 'Cung tròn' },
  { cmd: 'M', label: 'Di chuyển' },
  { cmd: 'MOVE', label: 'Di chuyển' },
  { cmd: 'CO', label: 'Sao chép' },
  { cmd: 'COPY', label: 'Sao chép' },
  { cmd: 'RO', label: 'Xoay' },
  { cmd: 'ROTATE', label: 'Xoay' },
  { cmd: 'MI', label: 'Đối xứng' },
  { cmd: 'MIRROR', label: 'Đối xứng' },
  { cmd: 'O', label: 'Offset (O 150)' },
  { cmd: 'OFFSET', label: 'Offset' },
  { cmd: 'DIM', label: 'Ghi kích thước' },
  { cmd: 'DAL', label: 'Kích thước thẳng' },
  { cmd: 'DI', label: 'Đo khoảng cách' },
  { cmd: 'DRA', label: 'Kích thước bán kính' },
  { cmd: 'DDI', label: 'Kích thước đường kính' },
  { cmd: 'DAN', label: 'Kích thước góc' },
  { cmd: 'DCO', label: 'Kích thước nối tiếp' },
  { cmd: 'DBA', label: 'Kích thước baseline' },
  { cmd: 'T', label: 'Chữ' },
  { cmd: 'TEXT', label: 'Chữ' },
  { cmd: 'W', label: 'Tường (W 200)' },
  { cmd: 'WALL', label: 'Tường' },
  { cmd: 'ROOM', label: 'Phòng' },
  { cmd: 'D', label: 'Cửa đi' },
  { cmd: 'DOOR', label: 'Cửa đi' },
  { cmd: 'WIN', label: 'Cửa sổ' },
  { cmd: 'WINDOW', label: 'Cửa sổ' },
  { cmd: 'TR', label: 'Cắt (trim)' },
  { cmd: 'TRIM', label: 'Cắt (trim)' },
  { cmd: 'EX', label: 'Kéo dài (extend)' },
  { cmd: 'EXTEND', label: 'Kéo dài (extend)' },
  { cmd: 'F', label: 'Bo góc (F 50)' },
  { cmd: 'FILLET', label: 'Bo góc' },
  { cmd: 'CHA', label: 'Vát góc (CHA 30 30)' },
  { cmd: 'CHAMFER', label: 'Vát góc' },
  { cmd: 'AR', label: 'Mảng chữ nhật' },
  { cmd: 'ARRAY', label: 'Mảng chữ nhật' },
  { cmd: 'ARP', label: 'Mảng tròn' },
  { cmd: 'ARRAYPOLAR', label: 'Mảng tròn' },
  { cmd: 'SC', label: 'Tỉ lệ (scale)' },
  { cmd: 'SCALE', label: 'Tỉ lệ (scale)' },
  { cmd: 'S', label: 'Kéo giãn (stretch)' },
  { cmd: 'STRETCH', label: 'Kéo giãn (stretch)' },
  { cmd: 'BR', label: 'Ngắt (break)' },
  { cmd: 'BREAK', label: 'Ngắt (break)' },
  { cmd: 'J', label: 'Nối (join)' },
  { cmd: 'JOIN', label: 'Nối (join)' },
  { cmd: 'X', label: 'Phá khối (explode)' },
  { cmd: 'EXPLODE', label: 'Phá khối (explode)' },
  { cmd: 'LEN', label: 'Đổi chiều dài (LEN 100)' },
  { cmd: 'LENGTHEN', label: 'Đổi chiều dài' },
  { cmd: 'DIMTXT', label: 'Cỡ chữ kích thước' },
  { cmd: 'DIMASZ', label: 'Cỡ mũi tên' },
  { cmd: 'DIMSCALE', label: 'Tỉ lệ dim' },
  { cmd: 'H', label: 'Mặt cắt (H ANSI31 20)' },
  { cmd: 'HATCH', label: 'Mặt cắt (hatch)' },
  { cmd: 'HANGLE', label: 'Góc hatch' },
  { cmd: 'POLAR', label: 'Polar tracking' },
  { cmd: 'E', label: 'Xoá' },
  { cmd: 'DEL', label: 'Xoá' },
  { cmd: 'ERASE', label: 'Xoá' },
  { cmd: 'U', label: 'Hoàn tác' },
  { cmd: 'UNDO', label: 'Hoàn tác' },
  { cmd: 'RE', label: 'Làm lại' },
  { cmd: 'REDO', label: 'Làm lại' },
  { cmd: 'EXT', label: 'Zoom Extents' },
  { cmd: 'Z', label: 'Zoom Extents' },
  { cmd: 'SEL', label: 'Chọn' },
];

/** Lọc gợi ý theo prefix (Việc 2). Sắp: khớp CHÍNH XÁC trước, rồi token ngắn hơn, rồi A→Z. */
function matchCommands(input: string): { cmd: string; label: string }[] {
  const q = input.trim().toUpperCase();
  if (!q) return [];
  return CAD_COMMANDS.filter((c) => c.cmd.startsWith(q))
    .sort((a, b) => {
      if (a.cmd === q) return -1;
      if (b.cmd === q) return 1;
      if (a.cmd.length !== b.cmd.length) return a.cmd.length - b.cmd.length;
      return a.cmd.localeCompare(b.cmd);
    })
    .slice(0, 8);
}

/* ───────── Command line mini ───────── */
function CommandLine({ status }: { status: string }) {
  const [val, setVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [acOpen, setAcOpen] = useState(false);
  const [acIndex, setAcIndex] = useState(0);
  const suggestions = acOpen ? matchCommands(val) : [];
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
  const setDimStyle = useCadStore((s) => s.setDimStyle);
  const polarTracking = useCadStore((s) => s.polarTracking);
  const setPolarTracking = useCadStore((s) => s.setPolarTracking);
  const setPolarStep = useCadStore((s) => s.setPolarStep);
  const setHatchPattern = useCadStore((s) => s.setHatchPattern);
  const setHatchScale = useCadStore((s) => s.setHatchScale);
  const setHatchAngle = useCadStore((s) => s.setHatchAngle);

  // Việc 1 — Type-anywhere: canvas phát 'cad:cmd-key' khi gõ chữ lúc rảnh → focus ô lệnh + seed ký tự.
  useEffect(() => {
    const onCmdKey = (ev: Event) => {
      const ch = (ev as CustomEvent<string>).detail;
      if (typeof ch !== 'string') return;
      setVal(ch.toUpperCase());
      setAcOpen(true);
      setAcIndex(0);
      inputRef.current?.focus();
    };
    window.addEventListener('cad:cmd-key', onCmdKey);
    return () => window.removeEventListener('cad:cmd-key', onCmdKey);
  }, []);

  const run = (override?: string) => {
    const raw = (override ?? val).trim();
    setAcOpen(false);
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
      DAL: () => setTool('dimension'),
      DI: () => setTool('measure'),
      DRA: () => setTool('dimradius'),
      DDI: () => setTool('dimdiameter'),
      DAN: () => setTool('dimangular'),
      DCO: () => setTool('dimcontinue'),
      DBA: () => setTool('dimbaseline'),
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
      DIMTXT: () => {
        if (arg && Number.isFinite(parseFloat(arg))) setDimStyle({ textHeight: parseFloat(arg) });
      },
      DIMASZ: () => {
        if (arg && Number.isFinite(parseFloat(arg))) setDimStyle({ arrowSize: parseFloat(arg) });
      },
      DIMSCALE: () => {
        if (arg && Number.isFinite(parseFloat(arg))) setDimStyle({ dimScale: parseFloat(arg) });
      },
      H: () => {
        const patterns: HatchPattern[] = ['SOLID', 'ANSI31', 'ANSI32', 'ANSI37', 'DOTS'];
        const found = patterns.find((p) => p === arg?.toUpperCase());
        if (found) setHatchPattern(found);
        if (arg2 && Number.isFinite(parseFloat(arg2))) setHatchScale(parseFloat(arg2));
        setTool('hatch');
      },
      HATCH: () => setTool('hatch'),
      HANGLE: () => {
        if (arg && Number.isFinite(parseFloat(arg))) setHatchAngle(parseFloat(arg));
      },
      POLAR: () => {
        if (arg && Number.isFinite(parseFloat(arg))) {
          setPolarStep(parseFloat(arg));
          setPolarTracking(true);
        } else {
          setPolarTracking(!polarTracking);
        }
      },
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

  // chấp nhận gợi ý (fill token vào ô); optionally chạy ngay
  const acceptSuggestion = (i: number, runNow: boolean) => {
    const s = suggestions[i];
    if (!s) return;
    if (runNow) {
      run(s.cmd);
    } else {
      setVal(s.cmd);
      setAcOpen(false);
      inputRef.current?.focus();
    }
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const list = matchCommands(val);
    if (acOpen && list.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAcIndex((i) => (i + 1) % list.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAcIndex((i) => (i - 1 + list.length) % list.length);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        acceptSuggestion(Math.min(acIndex, list.length - 1), false);
        return;
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      // Việc 2: nếu đang mở gợi ý và có mục đang chọn → chạy đúng mục đó; nếu không, chạy raw.
      if (acOpen && list.length) acceptSuggestion(Math.min(acIndex, list.length - 1), true);
      else run();
      return;
    }
    if (e.key === 'Escape') {
      // Việc 1 + 2: Esc đóng gợi ý nếu đang mở; nếu đã đóng → rời focus + xoá.
      if (acOpen) {
        setAcOpen(false);
      } else {
        setVal('');
        inputRef.current?.blur();
      }
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 34, flex: '0 0 auto', padding: '0 12px', borderTop: '1px solid var(--border)', background: 'var(--panel)' }}>
      <Command size={14} style={{ color: 'var(--t4)' }} />
      <div style={{ position: 'relative', width: 340 }}>
        {acOpen && suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute', bottom: 'calc(100% + 5px)', left: 0, width: '100%',
              background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.28)', overflow: 'hidden', zIndex: 50,
            }}
          >
            {suggestions.map((s, i) => (
              <div
                key={s.cmd}
                onMouseDown={(e) => { e.preventDefault(); acceptSuggestion(i, true); }}
                onMouseEnter={() => setAcIndex(i)}
                style={{
                  display: 'flex', alignItems: 'baseline', gap: 8, padding: '4px 9px', cursor: 'pointer',
                  background: i === acIndex ? 'var(--field)' : 'transparent',
                }}
              >
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--t1)', minWidth: 54 }}>{s.cmd}</span>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          value={val}
          onChange={(e) => { setVal(e.target.value); setAcOpen(true); setAcIndex(0); }}
          onKeyDown={onInputKeyDown}
          onBlur={() => setAcOpen(false)}
          placeholder="Gõ lệnh: L · PL · REC · C · W 200 · ROOM · D · WIN · M · CO · RO · MI · O 150 · DIM · T · E · U…"
          style={{ width: '100%', background: 'var(--field)', border: '1px solid var(--border)', borderRadius: 7, padding: '3px 8px', fontSize: 12, color: 'var(--t1)', outline: 'none', fontFamily: 'ui-monospace, monospace' }}
        />
      </div>
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
const miniSelect: React.CSSProperties = {
  flex: 1,
  fontSize: 10.5,
  color: 'var(--t3)',
  background: 'var(--field)',
  border: '1px solid var(--border)',
  borderRadius: 5,
  padding: '1px 3px',
  cursor: 'pointer',
};
