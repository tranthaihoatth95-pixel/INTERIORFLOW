'use client';

/**
 * components/cad/CadEditor.tsx — Khung trình CAD 2D (chặng 1 "Layout CAD").
 * Ghép: CadToolbar (nổi) + CadCanvas (nền) + panel Layer (phải) + panel Nội thất (trái, ẩn/hiện)
 * + command-line mini (đáy) + thanh file (import DXF · export PNG/DXF · scale · Đưa sang Render).
 *
 * "Đưa sang Render →": render extents ra PNG dataURL (nền trắng nét đen) → tạo node Import Image
 * trên canvas Render (useFlowStore) rồi router.push('/') — đúng pattern onDrop asset của FlowCanvas.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderOpen, Download, ArrowRight, Eye, EyeOff, Lock, Unlock, Plus, Trash2, X, Command, Sparkles, Wand2,
  ShieldCheck, AlertTriangle, Info, ShieldAlert, Crosshair, Tag, Check, Lightbulb, FileText, Save, Camera,
  LayoutTemplate, FileSignature, Wrench,
} from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import type { HatchPattern } from '@/lib/cad/model';
import { parseDxf, exportDxf } from '@/lib/cad/dxf';
import { openDwgFile } from '@/lib/cad/dwg';
import { renderDocToDataURL } from '@/lib/cad/render';
import { exportCadToPdf } from '@/lib/cad/pdf';
import { BLOCKS, BLOCK_MAP } from '@/lib/cad/furniture';
import ShapePalette, { ShapeInfoPanel } from '@/components/ShapePalette';
import { loadManifest, groupByCategory, type LibraryManifest } from '@/lib/cad/block-library';
import { buildDemoPlan } from '@/lib/cad/demo-plan';
import { buildOfficeTemplate, buildHotelTemplate } from '@/lib/cad/templates';
import { titleBlock, type TitleBlockInfo } from '@/lib/cad/commands';
import { describeToEntities } from '@/lib/cad/ai-assist';
import { docBox } from '@/lib/cad/model';
import { useFlowStore } from '@/lib/store';
import { stashCadHandoff } from '@/lib/cad/handoff';
import { checkStandards, findRoomLabels, classifyRoom, type Violation, type RoomKind } from '@/lib/cad/standards/checker';
import { getAllRules } from '@/lib/cad/standards/registry';
import { suggestFix } from '@/lib/cad/standards/fix-suggest';
import { classifyOperator, rulesForOperator, type OperatorType } from '@/lib/cad/operator-profile';
import { suggestRoomNames, type RoomNameSuggestion } from '@/lib/cad/room-autolabel';
import {
  suggestRoomLightingPlans, suggestSwitchPositions, suggestCircuitGroups, suggestOutletPlacements,
  checkAcUnitBedProximity,
  type RoomLightingPlan, type SwitchPositionSuggestion, type CircuitGroupHint, type OutletPlacementSuggestion,
  type AcUnitProximityCheck,
} from '@/lib/cad/mep-suggest';
import CadCanvas from './CadCanvas';
import CadToolbar from './CadToolbar';
import MaterialPalette from './MaterialPalette';

export default function CadEditor() {
  const router = useRouter();
  const [furnitureOpen, setFurnitureOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [standardsOpen, setStandardsOpen] = useState(false);
  const [autoLabelOpen, setAutoLabelOpen] = useState(false);
  const [mepOpen, setMepOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [titleBlockOpen, setTitleBlockOpen] = useState(false);
  const [handoffMsg, setHandoffMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const dwgRef = useRef<HTMLInputElement>(null);
  const idfRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

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
  // Sprint 7 — Việc 1: PDF vector (bản vẽ ĐANG MỞ — giống hành vi PNG/DXF ở trên, không phải
  // toàn bộ project nhiều sheet). Giới hạn OCG/layer ẩn-hiện: xem đầu file lib/cad/pdf.ts.
  const doExportPdf = async () => {
    const st = useCadStore.getState();
    if (!st.doc.entities.length) {
      st.setStatus('Bản vẽ trống — chưa có gì để xuất PDF.');
      return;
    }
    st.setStatus('Đang dựng PDF vector…');
    try {
      await exportCadToPdf(st.doc, 'layout.pdf', { title: 'InteriorFlow — Layout CAD', dimStyle: st.dimStyle });
      st.setStatus('Đã xuất layout.pdf (PDF vector — nét/text thật, không phải ảnh).');
    } catch (err) {
      st.setStatus(`Lỗi xuất PDF: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Sprint 7 — Việc 2: .idf gồm TẤT CẢ sheet (không chỉ bản đang mở) — CadEditor không giữ danh
  // sách sheet (nằm trong CadSheets.tsx, phía trên trong cây component). Bắc cầu qua CustomEvent
  // giống pattern 'cad:zoom-extents' đã dùng sẵn trong app, tránh prop-drilling xuyên nhiều tầng.
  const doExportIdf = () => {
    window.dispatchEvent(new CustomEvent('cad:idf-export-request'));
  };
  const onOpenIdfFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    // .idf THAY THẾ TOÀN BỘ project (mọi sheet) — luôn hỏi trước, không chỉ khi bản đang mở có
    // dữ liệu (sheet khác có thể đang có nội dung mà CadEditor không thấy được).
    const proceed = window.confirm(
      `Mở "${f.name}" sẽ THAY THẾ TOÀN BỘ project hiện tại (mọi bản vẽ/sheet đang mở). Tiếp tục?`,
    );
    if (!proceed) return;
    const reader = new FileReader();
    reader.onload = () => {
      window.dispatchEvent(new CustomEvent('cad:idf-import-request', { detail: { json: String(reader.result), fileName: f.name } }));
    };
    reader.onerror = () => useCadStore.getState().setStatus(`Không đọc được file "${f.name}".`);
    reader.readAsText(f);
  };

  // Sprint 7 — Việc 4: chọn ảnh từ máy → data URL (pattern readAsDataURL đã dùng ở
  // components/studio/UploadButton.tsx/CommentLayer.tsx — tái dùng nguyên xi, không viết lại).
  // Sau khi chọn, tool tự chuyển 'photo' (setPendingPhoto) — click tiếp trên canvas để đặt.
  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !f.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      useCadStore.getState().setPendingPhoto(String(reader.result));
    };
    reader.onerror = () => useCadStore.getState().setStatus(`Không đọc được ảnh "${f.name}".`);
    reader.readAsDataURL(f);
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

  // Mở DWG — parse chạy trong Web Worker cô lập (lib/cad/dwg-worker.ts, chứa dependency GPL
  // libredwg-web — xem docs/LICENSE-NOTES.md). Bất kể lỗi gì (sai định dạng/hỏng/phiên bản DWG
  // chưa hỗ trợ) đều hiện thông báo, KHÔNG crash app — giống hành vi onImportFile (DXF) ở trên.
  const onImportDwgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    useCadStore.getState().setStatus(`Đang đọc ${f.name}…`);
    openDwgFile(f)
      .then(({ doc, skippedEntityCount, totalEntityCount }) => {
        useCadStore.getState().importDoc(doc, 'replace');
        const skipNote = skippedEntityCount > 0 ? ` (${skippedEntityCount}/${totalEntityCount} đối tượng chưa hỗ trợ đã bỏ qua — INSERT/DIMENSION/… xem docs/LICENSE-NOTES.md)` : '';
        useCadStore.getState().setStatus(`Đã mở ${f.name} — ${doc.entities.length} đối tượng.${skipNote} Dùng scale nếu đơn vị lạ.`);
        window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
      })
      .catch((err: Error) => {
        useCadStore.getState().setStatus(`Không đọc được "${f.name}": ${err.message}`);
      });
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
    // → stash (sessionStorage, hoặc fallback bộ nhớ nếu hỏng); page.tsx/ProjectSelect
    //   consume qua applyCadHandoff() SAU khi graph nạp xong. (B1: KHÔNG addNode ngay,
    //   tránh nhánh im lặng mất node.)
    stashCadHandoff(dataUrl);
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
        <button type="button" onClick={() => dwgRef.current?.click()} style={fileBtn} title="Mở file .dwg — parse chạy trong Web Worker riêng (thư viện GPL cô lập, xem docs/LICENSE-NOTES.md); chưa hỗ trợ block INSERT/DIMENSION">
          <FolderOpen size={14} /> Mở DWG
        </button>
        <input ref={dwgRef} type="file" accept=".dwg" hidden onChange={onImportDwgFile} />
        <button type="button" onClick={openDemo} style={fileBtn} title="Nạp 1 mặt bằng căn hộ mẫu đầy đủ (tường/phòng/cửa/kích thước/nội thất)">
          <Sparkles size={14} /> Mở bản demo
        </button>
        <button type="button" onClick={() => setTemplateOpen((o) => !o)} style={{ ...fileBtn, background: templateOpen ? 'var(--accent)' : undefined, color: templateOpen ? '#fff' : undefined }} title="Chọn mẫu khởi đầu (Căn hộ / Văn phòng / Khách sạn) — tường bao + 1-2 phòng cơ bản để bạn vẽ tiếp, KHÔNG phải bản vẽ hoàn chỉnh">
          <LayoutTemplate size={14} /> Mẫu dự án
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
        <button type="button" onClick={doExportPdf} style={fileBtn} title="Xuất PDF vector (nét/text thật — không phải ảnh; layer KHÔNG ẩn/hiện được trong PDF do giới hạn thư viện, xem báo cáo)">
          <FileText size={14} /> PDF
        </button>
        <button type="button" onClick={doExportIdf} style={fileBtn} title="Xuất .idf — file project JSON (TẤT CẢ sheet + metadata), dùng để tải xuống/chia sẻ/backup, khác autosave nội bộ">
          <Save size={14} /> .idf
        </button>
        <button type="button" onClick={() => idfRef.current?.click()} style={fileBtn} title="Mở .idf — THAY THẾ toàn bộ project hiện tại (mọi sheet), sẽ hỏi xác nhận trước">
          <FolderOpen size={14} /> Mở .idf
        </button>
        <input ref={idfRef} type="file" accept=".idf,.json,application/json" hidden onChange={onOpenIdfFile} />
        <button type="button" onClick={() => photoRef.current?.click()} style={fileBtn} title="Ảnh hiện trường — chọn ảnh rồi click vào vị trí trên bản vẽ để gắn">
          <Camera size={14} /> Ảnh hiện trường
        </button>
        <input ref={photoRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
        <button type="button" onClick={() => setTitleBlockOpen((o) => !o)} style={{ ...fileBtn, background: titleBlockOpen ? 'var(--accent)' : undefined, color: titleBlockOpen ? '#fff' : undefined }} title="Chèn khung tên (cajetín) — nhập dự án/bản vẽ/tỉ lệ/người vẽ/ngày rồi chèn vào góc dưới-phải bản vẽ">
          <FileSignature size={14} /> Khung tên
        </button>
        <button type="button" onClick={() => setStandardsOpen((o) => !o)} style={{ ...fileBtn, background: standardsOpen ? 'var(--accent)' : undefined, color: standardsOpen ? '#fff' : undefined }} title="Kiểm chuẩn — đối chiếu bản vẽ với TCVN/QCVN/ISO (chỉ đọc & đề xuất, không tự sửa)">
          <ShieldCheck size={14} /> Kiểm chuẩn
        </button>
        <button type="button" onClick={() => setAutoLabelOpen((o) => !o)} style={{ ...fileBtn, background: autoLabelOpen ? 'var(--accent)' : undefined, color: autoLabelOpen ? '#fff' : undefined }} title="Đề xuất tên phòng — dò phòng CHƯA có nhãn TEXT, đoán tên theo đồ nội thất/diện tích (chỉ đề xuất, KHÔNG tự chèn — bạn phải bấm Áp dụng)">
          <Tag size={14} /> Gợi ý tên phòng
        </button>
        <button type="button" onClick={() => setMepOpen((o) => !o)} style={{ ...fileBtn, background: mepOpen ? 'var(--accent)' : undefined, color: mepOpen ? '#fff' : undefined }} title="MEP sơ cấp — gợi ý chiếu sáng/công tắc/ổ cắm/vị trí máy lạnh (chỉ đề xuất, KHÔNG tự chèn — bạn phải bấm nút Đặt)">
          <Lightbulb size={14} /> MEP
        </button>
        <button type="button" onClick={toRender} style={{ ...fileBtn, background: 'var(--accent)', color: '#fff', border: 'none' }} title="Kết xuất layout thành node Import Image ở chặng Render">
          Đưa sang Render <ArrowRight size={14} />
        </button>
      </div>

      {/* vùng canvas + panel */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <CadCanvas />
        <CadToolbar
          onToggleFurniture={() => setFurnitureOpen((o) => !o)}
          onToggleMaterial={() => setMaterialOpen((o) => !o)}
        />
        {furnitureOpen && <FurniturePanel onClose={() => setFurnitureOpen(false)} />}
        {materialOpen && <MaterialPalette onClose={() => setMaterialOpen(false)} />}
        {standardsOpen && <StandardsPanel onClose={() => setStandardsOpen(false)} />}
        {autoLabelOpen && <AutoLabelPanel onClose={() => setAutoLabelOpen(false)} />}
        {mepOpen && <MepPanel onClose={() => setMepOpen(false)} />}
        {templateOpen && <TemplatePanel onClose={() => setTemplateOpen(false)} />}
        {titleBlockOpen && <TitleBlockPanel onClose={() => setTitleBlockOpen(false)} />}
        <LayerPanel />
        <SelectionInfoPanel />
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
        {/* B2.1 kéo-thả + B2.8 tìm kiếm — ShapePalette (components/ShapePalette.tsx). Click vẫn
           giữ hành vi cũ (setPendingBlock → click canvas để đặt, R xoay 90°). */}
        {tab === 'basic' && <ShapePalette blocks={BLOCKS} pendingId={pending} onPick={setPendingBlock} />}
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

/* ───────── Panel Mẫu dự án (Sprint 8, H1.4) — chọn điểm khởi đầu khi bắt đầu vẽ mới ─────────
 * 3 lựa chọn: Căn hộ (buildDemoPlan — nguyên trạng, KHÔNG sửa), Văn phòng, Khách sạn
 * (buildOfficeTemplate/buildHotelTemplate — lib/cad/templates.ts, MỚI). Cả 3 đều THAY THẾ bản vẽ
 * hiện tại (giống hệt hành vi openDemo() — hỏi xác nhận nếu doc không rỗng), khác nhau ở NỘI DUNG
 * nạp vào. Đây là ĐIỂM BẮT ĐẦU (tường bao + 1-2 phòng cơ bản), không phải bản vẽ hoàn chỉnh. */
function TemplatePanel({ onClose }: { onClose: () => void }) {
  const load = (build: () => ReturnType<typeof buildDemoPlan>, label: string) => {
    if (useCadStore.getState().doc.entities.length > 0) {
      const ok = window.confirm(`Nạp mẫu "${label}" sẽ THAY THẾ bản vẽ hiện tại. Tiếp tục?`);
      if (!ok) return;
    }
    useCadStore.getState().importDoc(build(), 'replace');
    useCadStore.getState().setStatus(`Đã nạp mẫu "${label}" — tường bao + phòng cơ bản, tự vẽ tiếp từ đây.`);
    window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
    onClose();
  };

  const items: { label: string; desc: string; build: () => ReturnType<typeof buildDemoPlan> }[] = [
    { label: 'Căn hộ', desc: 'Căn hộ 1PN đầy đủ công năng (giống "Mở bản demo") — Khách/Bếp/Ngủ/WC + hành lang.', build: buildDemoPlan },
    { label: 'Văn phòng', desc: 'Không gian mở (open office) + 2 phòng họp nhỏ.', build: buildOfficeTemplate },
    { label: 'Khách sạn', desc: '2 phòng ngủ mẫu kiểu khách sạn + hành lang.', build: buildHotelTemplate },
  ];

  return (
    <div style={{ ...panel, left: 12, top: 70, width: 280 }}>
      <div style={panelHead}>
        <span>Mẫu dự án — chọn điểm khởi đầu</span>
        <button type="button" onClick={onClose} style={miniBtn} title="Đóng">
          <X size={14} />
        </button>
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--t4)', padding: '0 6px 8px' }}>
        Mỗi mẫu chỉ có tường bao + 1-2 phòng cơ bản — điểm bắt đầu để bạn vẽ tiếp, KHÔNG phải bản vẽ hoàn chỉnh.
      </div>
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          onClick={() => load(it.build, it.label)}
          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', cursor: 'pointer', marginBottom: 6 }}
        >
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>{it.label}</div>
          <div style={{ fontSize: 10.5, color: 'var(--t4)', marginTop: 2, lineHeight: 1.4 }}>{it.desc}</div>
        </button>
      ))}
    </div>
  );
}

/* ───────── Panel Khung tên (Sprint 8, H1.5) — CHÈN THẬT khi user bấm nút, không phải đề xuất ─────────
 * Khác panel Kiểm chuẩn/Gợi ý tên phòng/MEP (chỉ đề xuất): đây là 1 form nhập liệu — TÁI DÙNG
 * titleBlock() có sẵn (lib/cad/commands.ts), vị trí góc dưới-phải bản vẽ theo đúng cách
 * addPresentationKit() trong commands.ts đặt (tbAt = box.maxX+2600, box.minY-400). Doc rỗng
 * (box=null) → neo tại gốc toạ độ (0,-400) làm fallback hợp lý. */
function TitleBlockPanel({ onClose }: { onClose: () => void }) {
  const doc = useCadStore((s) => s.doc);
  const addEntities = useCadStore((s) => s.addEntities);
  const today = new Date().toISOString().slice(0, 10);
  const [project, setProject] = useState('');
  const [drawing, setDrawing] = useState('MẶT BẰNG BỐ TRÍ NỘI THẤT — SƠ PHÁC DD');
  const [scale, setScale] = useState('1:100');
  const [author, setAuthor] = useState('');
  const [date, setDate] = useState(today);
  const [msg, setMsg] = useState('');

  const insert = () => {
    const box = docBox(doc);
    const tbAt = box ? { x: box.maxX + 2600, y: box.minY - 400 } : { x: 0, y: -400 };
    const wallLayer = doc.layers.find((l) => l.id === 'l-wall')?.id ?? doc.layers[0]?.id ?? 'l-wall';
    const textLayer = doc.layers.find((l) => l.id === 'l-text')?.id ?? doc.layers[0]?.id ?? 'l-text';
    const info: TitleBlockInfo = {
      project: project.trim() || 'DỰ ÁN',
      drawing: drawing.trim() || 'MẶT BẰNG BỐ TRÍ — SƠ PHÁC DD',
      scale: scale.trim() || '1:100',
      author: author.trim() || undefined,
      date: date || undefined,
    };
    addEntities(titleBlock(tbAt, info, wallLayer, textLayer));
    setMsg('Đã chèn khung tên vào bản vẽ.');
    setTimeout(() => setMsg(''), 2500);
    window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
  };

  const field: React.CSSProperties = { width: '100%', fontSize: 12, padding: '5px 7px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', marginBottom: 8, boxSizing: 'border-box' };
  const fieldLabel: React.CSSProperties = { fontSize: 10.5, color: 'var(--t3)', marginBottom: 3, display: 'block' };

  return (
    <div style={{ ...panel, left: 12, top: 70, width: 280 }}>
      <div style={panelHead}>
        <span>Khung tên (cajetín)</span>
        <button type="button" onClick={onClose} style={miniBtn} title="Đóng">
          <X size={14} />
        </button>
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--t4)', padding: '0 6px 8px' }}>
        Chèn khung tên góc dưới-phải bản vẽ (tham chiếu ISO 7200) — điền thông tin rồi bấm Chèn.
      </div>
      <div style={{ padding: '0 2px' }}>
        <label style={fieldLabel}>Tên dự án</label>
        <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="VD: Căn hộ Sunrise A1203" style={field} />
        <label style={fieldLabel}>Tên bản vẽ</label>
        <input value={drawing} onChange={(e) => setDrawing(e.target.value)} style={field} />
        <label style={fieldLabel}>Tỉ lệ</label>
        <input value={scale} onChange={(e) => setScale(e.target.value)} placeholder="1:100" style={field} />
        <label style={fieldLabel}>Người vẽ</label>
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="VD: Nguyễn Văn A" style={field} />
        <label style={fieldLabel}>Ngày</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={field} />
        <button type="button" onClick={insert} style={{ ...fileBtn, width: '100%', justifyContent: 'center', background: 'var(--accent)', color: '#fff', border: 'none' }}>
          <FileSignature size={14} /> Chèn khung tên
        </button>
        {msg && <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6 }}>{msg}</div>}
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
    setViolations(null); // bộ rule đổi → kết quả cũ hết hiệu lực, yêu cầu chạy lại (không hiển thị lệch)
  };

  // Đổi operator bằng tay: dọn kết quả cũ (tránh hiển thị vi phạm của bộ rule khác).
  const pickOperator = (v: OperatorType | '') => {
    setOperator(v);
    setDetectMsg('');
    setViolations(null);
  };

  // Explainable: operator đang chọn áp những NHÓM rule nào (đọc registry, không sửa).
  const groupNote = operator
    ? `Áp nhóm: ${rulesForOperator(operator).map((g) => g.name).join(' · ')}`
    : '';

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
      {/* HOOK ML pha 1 — chọn LOẠI VẬN HÀNH để lọc bộ rule (mặc định = Tất cả, hành vi cũ nguyên vẹn). */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '0 6px 4px' }}>
        <select
          value={operator}
          onChange={(e) => pickOperator(e.target.value as OperatorType | '')}
          title="Lọc bộ quy chuẩn theo loại vận hành không gian (operator)"
          style={{ flex: 1, minWidth: 0, fontSize: 11, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--t1)' }}
        >
          {OPERATOR_LABELS.map((o) => (
            <option key={o.value || 'all'} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button type="button" onClick={detect} title="Nhận diện loại vận hành từ bản vẽ (block/nhãn phòng/text) — tất định, chỉ gợi ý, bạn duyệt" style={miniBtn}>
          <Wand2 size={13} />
        </button>
      </div>
      {(detectMsg || groupNote) && (
        <div style={{ fontSize: 10, color: 'var(--t3)', padding: '0 6px 6px', lineHeight: 1.45 }}>
          {detectMsg && <div>{detectMsg}</div>}
          {groupNote && <div style={{ color: 'var(--t4)' }}>{groupNote}</div>}
        </div>
      )}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {violations === null && (
          <div style={{ padding: '10px 8px', fontSize: 12, color: 'var(--t3)' }}>Chưa chạy — bấm biểu tượng khiên phía trên.</div>
        )}
        {violations !== null && violations.length === 0 && (
          <div style={{ padding: '10px 8px', fontSize: 12, color: 'var(--t3)' }}>Không phát hiện vi phạm nào (trong phạm vi đo được tự động).</div>
        )}
        {violations?.map((v, i) => {
          // Sprint 8, D2.3: gợi ý sửa CỤ THỂ (text + mm) — CHỈ hiển thị, KHÔNG tự sửa gì (xem
          // "hiến pháp" ở đầu lib/cad/standards/fix-suggest.ts). null ⇒ loại vi phạm này chưa có
          // cách tính gợi ý cụ thể, không hiển thị gì thêm (không ép viết gợi ý mơ hồ).
          const fix = suggestFix(v, doc);
          return (
            <div key={`${v.ruleId}-${i}`} style={{ padding: '7px 8px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <span style={{ marginTop: 2 }}>{sevIcon(v.severity)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--t1)', lineHeight: 1.4 }}>{v.message}</div>
                <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 2 }}>
                  {v.source} {v.verified ? '' : '· CHƯA KIỂM CHỨNG (đối chiếu bản gốc trước khi dùng chính thức)'}
                </div>
                {fix && (
                  <div style={{ fontSize: 10.5, color: 'var(--accent)', marginTop: 4, display: 'flex', gap: 4, alignItems: 'flex-start', lineHeight: 1.4 }}>
                    <Wrench size={11} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{fix}</span>
                  </div>
                )}
              </div>
              {v.at && (
                <button type="button" onClick={() => zoomTo(v)} title="Zoom tới vị trí" style={miniBtn}>
                  <Crosshair size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── Panel Gợi ý tên phòng (Sprint 4, C1.1) — CHỈ ĐỌC + ĐỀ XUẤT, không tự chèn ─────────
 * Dò các phòng CÓ BIÊN KÍN nhưng CHƯA có nhãn TEXT (room-autolabel.ts), đoán tên theo đồ nội
 * thất bên trong (hoặc diện tích/tỉ lệ nếu không có đồ nội thất đặc trưng). User PHẢI bấm "Áp
 * dụng" từng đề xuất thì mới thật sự addEntity() 1 TextEntity mới — không có nút "áp dụng tất
 * cả" để tránh chèn hàng loạt TEXT mà user chưa kịp xem qua từng cái. */
function AutoLabelPanel({ onClose }: { onClose: () => void }) {
  const doc = useCadStore((s) => s.doc);
  const addEntity = useCadStore((s) => s.addEntity);
  const [suggestions, setSuggestions] = useState<RoomNameSuggestion[] | null>(null);
  const [appliedMsg, setAppliedMsg] = useState('');

  const run = () => setSuggestions(suggestRoomNames(doc));

  const zoomTo = (s: RoomNameSuggestion) => {
    window.dispatchEvent(new CustomEvent('cad:zoom-to', { detail: s.at }));
  };

  const apply = (s: RoomNameSuggestion) => {
    const textLayer = doc.layers.find((l) => l.id === 'l-text')?.id ?? doc.layers[0]?.id ?? 'l-text';
    // Cỡ chữ theo diện tích phòng — cùng công thức clamp 160..280mm dùng cho roomRect (commands.ts).
    const h = Math.min(280, Math.max(160, Math.sqrt(Math.max(1, s.areaM2)) * 60));
    const name = s.suggestedName;
    addEntity({
      id: `e-autolabel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'text',
      layer: textLayer,
      at: { x: s.at.x - name.length * h * 0.3, y: s.at.y + h * 0.5 },
      text: name,
      h,
    });
    setSuggestions((prev) => (prev ? prev.filter((x) => x !== s) : prev));
    setAppliedMsg(`Đã chèn nhãn "${name}".`);
    setTimeout(() => setAppliedMsg(''), 2000);
  };

  return (
    <div style={{ ...panel, left: 12, top: 400, width: 340, maxHeight: '50vh', display: 'flex', flexDirection: 'column' }}>
      <div style={panelHead}>
        <span>Gợi ý tên phòng</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" onClick={run} title="Dò lại" style={miniBtn}>
            <Tag size={14} />
          </button>
          <button type="button" onClick={onClose} title="Đóng" style={miniBtn}>
            <X size={14} />
          </button>
        </div>
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--t4)', padding: '0 6px 6px' }}>
        Chỉ đề xuất — bấm dấu ✓ để CHÈN nhãn TEXT thật vào bản vẽ (bạn tự quyết định từng phòng). Chỉ dò được phòng có ĐỒ NỘI THẤT (không tính cửa/cửa sổ) bên trong làm điểm mốc.
      </div>
      {appliedMsg && <div style={{ fontSize: 11, color: 'var(--accent)', padding: '0 6px 6px' }}>{appliedMsg}</div>}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {suggestions === null && (
          <div style={{ padding: '10px 8px', fontSize: 12, color: 'var(--t3)' }}>Chưa dò — bấm biểu tượng thẻ tên phía trên.</div>
        )}
        {suggestions !== null && suggestions.length === 0 && (
          <div style={{ padding: '10px 8px', fontSize: 12, color: 'var(--t3)' }}>Mọi phòng dò được đều đã có nhãn (hoặc không có phòng nào có đồ nội thất/cửa để dò).</div>
        )}
        {suggestions?.map((s, i) => (
          <div key={`${s.at.x}-${s.at.y}-${i}`} style={{ padding: '7px 8px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <span style={{ marginTop: 2 }}><Tag size={14} color={s.basis === 'furniture' ? 'var(--accent)' : 'var(--t3)'} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--t1)', lineHeight: 1.4 }}>{s.suggestedName}</div>
              <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 2 }}>
                {s.areaM2.toFixed(1)} m² · {s.note}
              </div>
            </div>
            <button type="button" onClick={() => zoomTo(s)} title="Zoom tới vị trí" style={miniBtn}>
              <Crosshair size={13} />
            </button>
            <button type="button" onClick={() => apply(s)} title="Chèn nhãn này vào bản vẽ" style={miniBtn}>
              <Check size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Panel MEP sơ cấp (Sprint 6, lib/cad/mep-suggest.ts) — CHỈ ĐỌC + ĐỀ XUẤT ─────────
 * D1.1/D1.2 (lux+vị trí đèn), D1.4 (công tắc — chỉ hiển thị, KHÔNG có BlockDef công tắc riêng để
 * chèn), D1.5 (gợi ý nhóm mạch — text), D2.1 (ổ cắm — có BlockDef 'outlet' để chèn thật), D2.6
 * (khoảng cách máy lạnh↔đầu giường — chỉ cảnh báo). Mọi nút "Đặt" chỉ addEntity() sau khi user
 * bấm — không có hành vi tự chèn hàng loạt khi mở panel/chạy gợi ý. */
function MepPanel({ onClose }: { onClose: () => void }) {
  const doc = useCadStore((s) => s.doc);
  const addEntity = useCadStore((s) => s.addEntity);
  const [lightingPlans, setLightingPlans] = useState<RoomLightingPlan[] | null>(null);
  const [switches, setSwitches] = useState<SwitchPositionSuggestion[] | null>(null);
  const [circuitHint, setCircuitHint] = useState<CircuitGroupHint | null>(null);
  const [outlets, setOutlets] = useState<OutletPlacementSuggestion[] | null>(null);
  const [acChecks, setAcChecks] = useState<AcUnitProximityCheck[] | null>(null);
  const [msg, setMsg] = useState('');

  const run = () => {
    setLightingPlans(suggestRoomLightingPlans(doc));
    setSwitches(suggestSwitchPositions(doc));
    setCircuitHint(suggestCircuitGroups(doc));
    setOutlets(suggestOutletPlacements(doc));
    setAcChecks(checkAcUnitBedProximity(doc));
  };

  const zoomTo = (at: { x: number; y: number }) => window.dispatchEvent(new CustomEvent('cad:zoom-to', { detail: at }));
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };
  const furnLayer = doc.layers.find((l) => l.id === 'l-furniture')?.id ?? doc.layers[0]?.id ?? 'l-furniture';
  const newEntId = (tag: string) => `e-mep-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const placeLightsForRoom = (plan: RoomLightingPlan) => {
    for (const pt of plan.positions) {
      addEntity({ id: newEntId('light'), type: 'block', layer: furnLayer, block: 'lightDownlight', at: pt, rot: 0, sx: 1, sy: 1 });
    }
    setLightingPlans((prev) => (prev ? prev.filter((p) => p !== plan) : prev));
    flash(`Đã đặt ${plan.positions.length} đèn downlight cho "${plan.roomName}".`);
  };

  const placeOutlet = (s: OutletPlacementSuggestion) => {
    addEntity({ id: newEntId('outlet'), type: 'block', layer: furnLayer, block: 'outlet', at: s.at, rot: 0, sx: 1, sy: 1 });
    setOutlets((prev) => (prev ? prev.filter((x) => x !== s) : prev));
    flash('Đã đặt 1 ổ cắm.');
  };

  const rowStyle: React.CSSProperties = { padding: '7px 8px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, alignItems: 'flex-start' };
  const sectionTitle: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--t3)', padding: '8px 8px 3px' };
  const emptyStyle: React.CSSProperties = { padding: '4px 8px 8px', fontSize: 11.5, color: 'var(--t4)' };

  const notRun = lightingPlans === null;

  return (
    <div style={{ ...panel, left: 12, top: 400, width: 380, maxHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
      <div style={panelHead}>
        <span>MEP sơ cấp — Chiếu sáng &amp; Điện</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" onClick={run} title="Chạy gợi ý (Sprint 6: D1.1/D1.2/D1.4/D1.5/D2.1/D2.6 — KHÔNG có gen kỹ thuật D2.3-D2.5, xem lib/cad/mep.ts)" style={miniBtn}>
            <Lightbulb size={14} />
          </button>
          <button type="button" onClick={onClose} title="Đóng" style={miniBtn}>
            <X size={14} />
          </button>
        </div>
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--t4)', padding: '0 6px 6px' }}>
        Chỉ đề xuất — bấm nút để CHÈN thật vào bản vẽ. Lux tham khảo (KHÔNG phải TCVN 7114 chính thức) · 900lm/đèn là giả định thực hành phổ biến · công tắc/ổ cắm/máy lạnh là ước lệ, KHÔNG trích chuẩn cụ thể.
      </div>
      {msg && <div style={{ fontSize: 11, color: 'var(--accent)', padding: '0 6px 6px' }}>{msg}</div>}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notRun && <div style={{ padding: '10px 8px', fontSize: 12, color: 'var(--t3)' }}>Chưa chạy — bấm biểu tượng bóng đèn phía trên.</div>}

        {lightingPlans !== null && (
          <>
            <div style={sectionTitle}>D1.1/D1.2 — Chiếu sáng theo phòng ({lightingPlans.length})</div>
            {lightingPlans.length === 0 && <div style={emptyStyle}>Không dò được phòng khách/ngủ/bếp nào có nhãn + biên kín.</div>}
            {lightingPlans.map((p, i) => (
              <div key={`light-${i}`} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--t1)' }}>{p.roomName} — {p.areaM2.toFixed(1)}m²</div>
                  <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 2, lineHeight: 1.4 }}>
                    {p.lighting.minLux}–{p.lighting.maxLux} lux tham khảo → ~{Math.round(p.lighting.totalLumensTarget)} lumen → {p.lighting.recommendedDownlightCount} đèn downlight (900lm/đèn, giả định) · dò được {p.positions.length} vị trí đặt
                  </div>
                </div>
                <button type="button" onClick={() => zoomTo(p.roomAt)} title="Zoom tới" style={miniBtn}><Crosshair size={13} /></button>
                <button type="button" onClick={() => placeLightsForRoom(p)} disabled={p.positions.length === 0} title="Đặt đèn downlight vào bản vẽ" style={{ ...miniBtn, opacity: p.positions.length === 0 ? 0.4 : 1 }}><Check size={13} /></button>
              </div>
            ))}
          </>
        )}

        {switches !== null && (
          <>
            <div style={sectionTitle}>D1.4 — Vị trí công tắc gợi ý ({switches.length})</div>
            {switches.length === 0 && <div style={emptyStyle}>Không có cửa nào trong bản vẽ.</div>}
            {switches.map((s, i) => (
              <div key={`sw-${i}`} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 10.5, color: 'var(--t3)', lineHeight: 1.4 }}>{s.note}</div>
                <button type="button" onClick={() => zoomTo(s.at)} title="Zoom tới vị trí gợi ý" style={miniBtn}><Crosshair size={13} /></button>
              </div>
            ))}
          </>
        )}

        {circuitHint && (
          <>
            <div style={sectionTitle}>D1.5 — Gợi ý nhóm mạch</div>
            <div style={{ ...emptyStyle, color: 'var(--t3)' }}>{circuitHint.note}</div>
          </>
        )}

        {outlets !== null && (
          <>
            <div style={sectionTitle}>D2.1 — Vị trí ổ cắm gợi ý ({outlets.length})</div>
            {outlets.length === 0 && <div style={emptyStyle}>Không có tủ đầu giường/bàn làm việc/bếp nào trong bản vẽ.</div>}
            {outlets.map((o, i) => (
              <div key={`ot-${i}`} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 10.5, color: 'var(--t3)', lineHeight: 1.4 }}>{o.note}</div>
                <button type="button" onClick={() => zoomTo(o.at)} title="Zoom tới" style={miniBtn}><Crosshair size={13} /></button>
                <button type="button" onClick={() => placeOutlet(o)} title="Đặt ổ cắm vào bản vẽ" style={miniBtn}><Check size={13} /></button>
              </div>
            ))}
          </>
        )}

        {acChecks !== null && (
          <>
            <div style={sectionTitle}>D2.6 — Máy lạnh ↔ đầu giường ({acChecks.length})</div>
            {acChecks.length === 0 && <div style={emptyStyle}>Không có cặp máy lạnh/giường nào để kiểm tra.</div>}
            {acChecks.map((c, i) => (
              <div key={`ac-${i}`} style={rowStyle}>
                <span style={{ marginTop: 2 }}>{c.tooClose ? <AlertTriangle size={14} color="#d4a15a" /> : <Info size={14} color="var(--t3)" />}</span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 10.5, color: 'var(--t3)', lineHeight: 1.4 }}>{c.note}</div>
              </div>
            ))}
          </>
        )}
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
  { cmd: 'C3P', label: 'Đường tròn 3-điểm' },
  { cmd: 'CIRCLE3P', label: 'Đường tròn 3-điểm' },
  { cmd: 'A', label: 'Cung tròn (3 điểm)' },
  { cmd: 'ARC', label: 'Cung tròn (3 điểm)' },
  { cmd: 'ARCC', label: 'Cung tròn tâm+góc' },
  { cmd: 'ARCCENTER', label: 'Cung tròn tâm+góc' },
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
      C3P: () => setTool('circle3p'),
      CIRCLE3P: () => setTool('circle3p'),
      A: () => setTool('arc'),
      ARC: () => setTool('arc'),
      ARCC: () => setTool('arccenter'),
      ARCCENTER: () => setTool('arccenter'),
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
      <span style={{ fontSize: 11.5, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{status}</span>
      <RoomStatsBadge />
    </div>
  );
}

/** Sprint 4 — C1.4 Total GFA + C1.5 Room count: đọc lại CHÍNH `findRoomLabels`/`classifyRoom`
 * của checker.ts (KHÔNG nhân bản logic phân loại) — chỉ tổng hợp từ các phòng ĐÃ CÓ NHÃN TEXT
 * (không gộp các đề xuất auto-label chưa được user áp dụng). Đặt cạnh chỗ hiện toạ độ X/Y sống
 * (vẽ trực tiếp trên canvas, góc dưới-trái) — đây là ô cạnh bên trong CÙNG thanh trạng thái đáy. */
const ROOM_KIND_LABEL: Record<RoomKind, string> = {
  bedroom: 'phòng ngủ', wc: 'WC', kitchen: 'bếp', living: 'phòng khách',
  office: 'văn phòng', assembly: 'phòng họp', corridor: 'hành lang', other: 'khác',
};
const ROOM_KIND_ORDER: RoomKind[] = ['bedroom', 'wc', 'kitchen', 'living', 'office', 'assembly', 'corridor', 'other'];

function RoomStatsBadge() {
  const doc = useCadStore((s) => s.doc);

  const stats = useMemo(() => {
    const rooms = findRoomLabels(doc);
    let totalM2 = 0;
    const counts: Partial<Record<RoomKind, number>> = {};
    for (const r of rooms) {
      if (r.areaM2 !== null) totalM2 += r.areaM2;
      const kind = classifyRoom(r.name);
      counts[kind] = (counts[kind] ?? 0) + 1;
    }
    return { totalM2, counts, roomCount: rooms.length };
  }, [doc]);

  if (stats.roomCount === 0) return null;

  const breakdown = ROOM_KIND_ORDER
    .filter((k) => stats.counts[k])
    .map((k) => `${stats.counts[k]} ${ROOM_KIND_LABEL[k]}`)
    .join(' · ');

  return (
    <span
      title="Tổng diện tích sàn (GFA) + số phòng — cộng từ các phòng ĐÃ có nhãn TEXT dò được (không tính đề xuất auto-label chưa áp dụng)"
      style={{ fontSize: 11.5, color: 'var(--t2)', whiteSpace: 'nowrap', flex: '0 0 auto', paddingLeft: 10, borderLeft: '1px solid var(--border)' }}
    >
      GFA {stats.totalM2.toFixed(1)}m² · {stats.roomCount} phòng{breakdown ? ` (${breakdown})` : ''}
    </span>
  );
}

/* ───────── B2.4 info panel + B2.5 variant switch — hiện khi chọn ĐÚNG 1 BlockEntity ───────── */
function SelectionInfoPanel() {
  const doc = useCadStore((s) => s.doc);
  const selection = useCadStore((s) => s.selection);
  const updateEntities = useCadStore((s) => s.updateEntities);
  const clearSelection = useCadStore((s) => s.clearSelection);

  if (selection.length !== 1) return null;
  const entity = doc.entities.find((e) => e.id === selection[0]);
  if (!entity || entity.type !== 'block') return null;
  const def = BLOCK_MAP[entity.block];

  return (
    <div style={{ position: 'absolute', left: 12, bottom: 46, zIndex: 20 }}>
      <ShapeInfoPanel
        entity={entity}
        def={def}
        onVariantChange={(variantId) => updateEntities([{ ...entity, variant: variantId }])}
        onClose={clearSelection}
      />
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
  // Sprint 7 — thêm 4 nút (PDF/.idf x2/Ảnh hiện trường) khiến thanh dễ tràn ở màn hẹp — cuộn
  // ngang thay vì đẩy vỡ layout (không đổi hành vi cũ khi đủ chỗ, chỉ thêm khi cần).
  overflowX: 'auto',
  scrollbarWidth: 'thin',
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
  flexShrink: 0,
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
