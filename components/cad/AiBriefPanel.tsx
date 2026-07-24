'use client';

/**
 * components/cad/AiBriefPanel.tsx — panel "AI mô tả" NÂNG CẤP thành QUY TRÌNH 3 BƯỚC THỰC TẾ
 * (21/07, yêu cầu chủ dự án — KTS: "import layout hiện trạng rồi nhập mô tả bố trí vào đấy,
 * giống quy trình làm việc thực tế"):
 *
 *   BƯỚC 1 — HIỆN TRẠNG: import hồ sơ CAD (TÁI DÙNG input DXF/DWG có sẵn của CadEditor qua
 *     CustomEvent 'cad:import-request' — KHÔNG viết parser mới) hoặc dùng bản vẽ đang mở.
 *   BƯỚC 2 — CHECK HỒ SƠ: có hiện trạng → TỰ chạy lib/cad/dossier-check.ts (hàm thuần, tái dùng
 *     dò biên DCEL) → checklist ✓/⚠️/✗ (mặt bằng khép kín · nhãn phòng · DIM · cao độ · mặt cắt).
 *     Thiếu cao độ/mặt cắt chỉ CẢNH BÁO, không chặn luồng (file mặt bằng thường không có).
 *   BƯỚC 3 — ĐỀ BÀI → OPTION TRONG HIỆN TRẠNG: generateLayoutOptions nhận targetRooms (phòng
 *     thật từ dossier) → option đặt nội thất VÀO phòng thật (map tên gần đúng, xem
 *     matchBriefToRooms trong ai-assist.ts); không khớp → hành vi cũ (vẽ phòng mới cạnh bản vẽ).
 *   BƯỚC 4 — ML: layout nào được DÙNG (bấm Nhận) thì PairwisePerceptron ghi nhớ — cặp
 *     (được-chọn ≻ bị-bỏ); không đánh dấu Bỏ thì các option còn lại của lượt là cặp thua mặc
 *     nhiên ("layout được sử dụng thì bộ máy học ghi nhớ" — trước đây bấm Nhận suông không học gì).
 *
 * HÀNH VI CŨ GIỮ NGUYÊN: "Vẽ nhanh" 1 dòng (describeToEntities áp thẳng) + flow 3 phương án
 * KHÔNG-hiện-trạng (không bật bước 1 → generateLayoutOptions chạy đúng đường cũ, layout vẽ nối
 * tiếp bên phải bản vẽ). Lịch sử phạm-vi-thu-hẹp 20/07 (3 option = 3 WallVariant trong cùng hình
 * bao phòng): xem git log file này.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ThumbsUp, ThumbsDown, X, Sparkles, Wand2, FolderOpen, Check, AlertTriangle, MousePointerClick } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { docBox, type Doc } from '@/lib/cad/model';
import { renderDocToDataURL } from '@/lib/cad/render';
import { describeToEntities, generateLayoutOptions, type LayoutOption, type TargetRoom } from '@/lib/cad/ai-assist';
import { checkDossier, type DossierItem } from '@/lib/cad/dossier-check';
import { checkStandards, type Violation } from '@/lib/cad/standards/checker';
import { getAllRules } from '@/lib/cad/standards/registry';
import { rulesForOperator } from '@/lib/cad/operator-profile';
import { PairwisePerceptron } from '@/lib/gu/pairwise-perceptron';
import { CAD_LAYOUT_OPTION_MODEL_KEY, layoutOptionFeatures, explainLayoutOption, type LayoutOptionSignal } from '@/lib/cad/ai-layout-feedback';

interface Props {
  onClose: () => void;
}

/**
 * 21/07 (UX chủ dự án): panel đóng bằng click ngoài / Esc / nút X. Vì `aiBriefOpen` bên
 * CadEditor unmount toàn panel khi đóng, giữ draft (brief/quickDesc/scale) bằng module-level
 * cache dưới đây — mở lại thấy nguyên nội dung cũ, không cần đưa state lên store toàn cục hay
 * localStorage (draft thuần transient, chỉ sống trong phiên tab).
 */
const draftCache: { brief: string; quickDesc: string; scaleText: string; baselineOn: boolean } = {
  brief: '',
  quickDesc: '',
  scaleText: '1',
  baselineOn: false,
};

/* B1 (24/07) — audit AI Brief: draft trước đây CHỈ sống trong module cache (reload tab = mất đề
 * bài dài user vừa soạn). Nay persist localStorage (đề bài là text nhỏ, vô hại) + ghi LỊCH SỬ
 * lượt "Nhận" (brief → variant đã chọn + note) để brief VÀ kết quả đều lưu lại được — đúng yêu
 * cầu "layout được sử dụng thì ghi nhớ" ở tầng dữ liệu, song song với Perceptron ở tầng học. */
const DRAFT_KEY = 'interiorflow.cad.aibrief.draft.v1';
const HISTORY_KEY = 'interiorflow.cad.aibrief.history.v1';
const HISTORY_MAX = 20;

let draftLoaded = false;
function loadDraftOnce() {
  if (draftLoaded || typeof window === 'undefined') return;
  draftLoaded = true;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const d = JSON.parse(raw) as Partial<typeof draftCache>;
    if (typeof d.brief === 'string') draftCache.brief = d.brief;
    if (typeof d.quickDesc === 'string') draftCache.quickDesc = d.quickDesc;
    if (typeof d.scaleText === 'string') draftCache.scaleText = d.scaleText;
    if (typeof d.baselineOn === 'boolean') draftCache.baselineOn = d.baselineOn;
  } catch { /* hỏng → dùng mặc định, không crash */ }
}
function saveDraft() {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draftCache)); } catch { /* quota → bỏ qua */ }
}

interface BriefHistoryEntry {
  ts: number;
  brief: string;
  variant: number;
  label: string;
  note: string;
  placedInto?: string[];
}
function appendHistory(entry: BriefHistoryEntry) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr: BriefHistoryEntry[] = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(-HISTORY_MAX)));
  } catch { /* bỏ qua an toàn */ }
}

interface ScoredOption {
  opt: LayoutOption;
  violations: Violation[];
  preview: string;
  placedRatio: number;
}

export default function AiBriefPanel({ onClose }: Props) {
  loadDraftOnce(); // nạp draft đã persist TRƯỚC khi useState đọc draftCache (client component)
  const doc = useCadStore((s) => s.doc);
  const [quickDesc, setQuickDesc] = useState(draftCache.quickDesc);
  const [brief, setBrief] = useState(draftCache.brief);
  const [scaleText, setScaleText] = useState(draftCache.scaleText);
  const [results, setResults] = useState<ScoredOption[] | null>(null);
  const [rejected, setRejected] = useState<string[]>([]);
  const [applied, setApplied] = useState(false);
  const [model, setModel] = useState<PairwisePerceptron | null>(null);
  // BƯỚC 1 — hiện trạng đã kích hoạt chưa (import hồ sơ / dùng bản vẽ hiện tại). Chưa bật ⇒ toàn
  // bộ flow cũ chạy nguyên vẹn (option vẽ cạnh bản vẽ). Persist qua draftCache để mở lại panel
  // vẫn nhớ trạng thái (không phải khoá lâu dài — chỉ sống trong tab).
  const [baselineOn, setBaselineOn] = useState(draftCache.baselineOn);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setModel(PairwisePerceptron.loadFromLocalStorage(CAD_LAYOUT_OPTION_MODEL_KEY));
  }, []);

  // Đồng bộ state → cache + localStorage mỗi khi user gõ (draft sống qua cả reload — B1 24/07).
  useEffect(() => { draftCache.brief = brief; saveDraft(); }, [brief]);
  useEffect(() => { draftCache.quickDesc = quickDesc; saveDraft(); }, [quickDesc]);
  useEffect(() => { draftCache.scaleText = scaleText; saveDraft(); }, [scaleText]);
  useEffect(() => { draftCache.baselineOn = baselineOn; saveDraft(); }, [baselineOn]);

  // Click ngoài panel = đóng · phím Esc = đóng. Không đè lên các dialog khác vì aiBriefOpen chỉ
  // mount 1 panel duy nhất; nút mở panel nằm trong menu "Bắt đầu" đã đóng lại khi bấm chọn AI mô
  // tả nên click ngoài không lỡ bấm trúng chính nút mở lại panel.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    // mousedown (không phải click) — khớp cách các panel dialog hay dùng, đóng ngay khi user bắt
    // đầu tương tác ngoài panel, tránh trường hợp mouseup rơi vào panel do drag.
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const currentLayer = useCadStore((s) => s.currentLayer);
  const wallThickness = useCadStore((s) => s.wallThickness);
  const box = docBox(doc);
  const hasExisting = doc.entities.length > 0;
  const origin = box ? { x: box.maxX + 1000, y: box.minY } : { x: 0, y: 0 };
  const wallLayer = doc.layers.find((l) => l.name === 'Tường')?.id ?? currentLayer;
  const textLayer = doc.layers.find((l) => l.name === 'Ghi chú')?.id ?? currentLayer;
  const furnLayer = doc.layers.find((l) => l.name === 'Nội thất')?.id ?? 'l-furniture';

  // BƯỚC 2 — check hồ sơ TỰ chạy khi có hiện trạng (và chạy lại mỗi khi doc đổi, VD import DXF/DWG
  // xong doc mới về store). useMemo theo [doc, baselineOn] — gõ text không kích hoạt lại DCEL.
  const dossier = useMemo(
    () => (baselineOn && doc.entities.length ? checkDossier(doc) : null),
    [baselineOn, doc],
  );

  const scaleFactor = useMemo(() => {
    const v = parseFloat(scaleText.replace(',', '.'));
    return Number.isFinite(v) && v > 0 ? v : 1;
  }, [scaleText]);

  /** BƯỚC 1a — import hồ sơ CAD: TÁI DÙNG input file + handler DXF/DWG có sẵn trong CadEditor
   * (parseDxf/openDwgFile + importDoc 'replace') — panel chỉ bấm hộ qua CustomEvent, xem listener
   * 'cad:import-request' trong CadEditor.tsx. */
  const requestImport = (kind: 'dxf' | 'dwg') => {
    setBaselineOn(true);
    setResults(null);
    window.dispatchEvent(new CustomEvent('cad:import-request', { detail: { kind } }));
  };

  /** BƯỚC 1b — dùng bản vẽ đang mở trên canvas làm hiện trạng. */
  const useCurrentAsBaseline = () => {
    setBaselineOn(true);
    setResults(null);
  };

  /** Chạy nhanh 1 phương án — giữ NGUYÊN hành vi ô 1 dòng cũ (describeToEntities, áp thẳng). */
  const runQuick = () => {
    if (!quickDesc.trim()) return;
    const st = useCadStore.getState();
    const { entities, note } = describeToEntities(quickDesc, origin, wallLayer, textLayer, wallThickness, furnLayer);
    st.addEntities(entities);
    st.setStatus(note);
    window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
    onClose();
  };

  /** BƯỚC 3 — sinh 3 option từ đề bài → chấm điểm checkStandards (TÁI DÙNG panel Kiểm chuẩn).
   * Có hiện trạng + phòng thật ⇒ feed targetRooms để option đặt nội thất VÀO phòng thật. */
  const generate = () => {
    const text = brief.trim() || quickDesc.trim();
    if (!text) return;
    // B1 fix (audit): TRUYỀN CẢ obstacles — dossier đã đo AABB đồ có sẵn trong từng phòng nhưng
    // map cũ làm rơi field này ⇒ solver đặt nội thất ĐÈ LÊN đồ hiện trạng. Nay solver né đúng.
    const targetRooms: TargetRoom[] | undefined = dossier?.canLayoutInSitu
      ? dossier.rooms.map((r) => ({ name: r.name, interior: r.interior, obstacles: r.obstacles }))
      : undefined;
    const options = generateLayoutOptions(text, origin, wallLayer, textLayer, wallThickness, furnLayer, { scaleFactor, targetRooms });
    const rules = options[0]?.operator && options[0].operator !== 'generic'
      ? rulesForOperator(options[0].operator).flatMap((g) => g.rules)
      : getAllRules();

    const scored: ScoredOption[] = options.map((opt) => {
      // Kiểm chuẩn trên bản vẽ hiện tại + option này (đúng ngữ cảnh sẽ chèn vào) — không đổi doc thật.
      const trialDoc: Doc = { layers: doc.layers, entities: [...doc.entities, ...opt.entities] };
      const violations = checkStandards(trialDoc, rules);
      // preview: option TRONG hiện trạng ⇒ vẽ CẢ bản vẽ nền (nội thất rời rạc không có tường thì
      // không nhận diện được bố cục); option kiểu cũ ⇒ cô lập CHỈ option (như trước).
      const previewDoc: Doc = opt.placedInto?.length
        ? trialDoc
        : { layers: doc.layers, entities: opt.entities };
      const preview = opt.entities.length ? renderDocToDataURL(previewDoc, 260) : '';
      // B1 fix (audit): placedRatio ĐO THẬT từ solver (placedCount/requestedCount — feed
      // Perceptron chính xác), fallback heuristic chuỗi cũ chỉ khi option không mang số liệu.
      const placedRatio =
        opt.requestedCount && opt.requestedCount > 0 && opt.placedCount !== undefined
          ? opt.placedCount / opt.requestedCount
          : opt.note.includes('CHƯA đủ chỗ') ? 0.5 : 1;
      return { opt, violations, preview, placedRatio };
    });
    setResults(scored);
    setRejected([]);
    setApplied(false);
  };

  const signalOf = (s: ScoredOption): LayoutOptionSignal => ({
    variant: s.opt.variant,
    violationCount: s.violations.length,
    placedRatio: s.placedRatio,
  });

  const toggleReject = (id: string) => {
    setRejected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-3)));
  };

  /** BƯỚC 4 — Nhận = áp bố cục vào bản vẽ + DẠY MÁY: "layout nào được SỬ DỤNG thì ghi nhớ".
   * Cặp học = (được-chọn ≻ từng option bị Bỏ); user không đánh dấu Bỏ ⇒ các option còn lại của
   * lượt là cặp thua MẶC NHIÊN (được thấy đủ 3 mà chỉ dùng 1). Trước 21/07 bấm Nhận suông không
   * ghi gì — sửa để mọi lượt "dùng" đều được ghi + persist localStorage. */
  const accept = (s: ScoredOption, all: ScoredOption[]) => {
    const st = useCadStore.getState();
    st.addEntities(s.opt.entities);
    st.setStatus(s.opt.note);
    window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
    setApplied(true);
    // B1 (24/07) — lưu LỊCH SỬ lượt dùng (brief + option đã chọn) vào localStorage: brief và kết
    // quả không còn bay hơi theo phiên tab; Perceptron học riêng ở dưới như cũ.
    appendHistory({
      ts: Date.now(),
      brief: (brief.trim() || quickDesc.trim()).slice(0, 2000),
      variant: s.opt.variant,
      label: s.opt.label,
      note: s.opt.note.slice(0, 500),
      placedInto: s.opt.placedInto,
    });

    if (model) {
      const others = all.filter((x) => x.opt.id !== s.opt.id);
      const explicit = others.filter((x) => rejected.includes(x.opt.id));
      const losers = explicit.length ? explicit : others;
      if (losers.length) {
        const acceptedF = layoutOptionFeatures(signalOf(s));
        for (const rej of losers) model.update(acceptedF, layoutOptionFeatures(signalOf(rej)));
        model.saveToLocalStorage(CAD_LAYOUT_OPTION_MODEL_KEY);
      }
    }
    onClose();
  };

  const statusGlyph = (st: DossierItem['status']) => {
    if (st === 'ok') return <Check size={12} color="var(--accent)" />;
    if (st === 'warn') return <AlertTriangle size={12} color="#d4a15a" />;
    return <X size={12} color="#d4645a" />;
  };

  return (
    <div ref={panelRef} style={{ ...panel, top: 70, left: '50%', transform: 'translateX(-50%)', width: 560, maxHeight: '78vh', display: 'flex', flexDirection: 'column' }}>
      <div style={panelHead}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={14} /> AI mô tả — Đề bài chi tiết</span>
        <button type="button" onClick={onClose} style={miniBtn} title="Đóng"><X size={14} /></button>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '0 6px' }}>
        <div style={{ fontSize: 10.5, color: 'var(--t4)', lineHeight: 1.5, marginBottom: 8 }}>
          Quy trình thực tế: <b>1</b> nạp hiện trạng → <b>2</b> check hồ sơ → <b>3</b> nhập đề bài, AI
          gợi ý option bố trí VÀO phòng thật → option được Nhận thì máy ghi nhớ. Bộ phân tích đề bài
          hiện là RULE-BASED (từ khoá), chưa phải LLM — ghi rõ từng phòng theo mẫu &quot;phòng X AxB có
          [nội thất]&quot; càng chính xác.
        </div>

        {/* ═════════ BƯỚC 1 — HIỆN TRẠNG ═════════ */}
        <label style={label}>1 · Hiện trạng (layout có sẵn để bố trí vào)</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => requestImport('dxf')} style={smallBtn} title="Mở hộp chọn file DXF của CadEditor — THAY THẾ bản vẽ hiện tại bằng hồ sơ import">
            <FolderOpen size={12} /> Import DXF
          </button>
          <button type="button" onClick={() => requestImport('dwg')} style={smallBtn} title="Mở hộp chọn file DWG của CadEditor (parse trong Web Worker) — THAY THẾ bản vẽ hiện tại">
            <FolderOpen size={12} /> Import DWG
          </button>
          <button
            type="button"
            onClick={useCurrentAsBaseline}
            disabled={!hasExisting}
            style={{ ...smallBtn, ...(baselineOn ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : null), opacity: hasExisting ? 1 : 0.5 }}
            title={hasExisting ? 'Coi bản vẽ đang mở trên canvas là hiện trạng' : 'Bản vẽ đang trống — import hoặc vẽ trước'}
          >
            <MousePointerClick size={12} /> Dùng bản vẽ hiện tại ({doc.entities.length} đối tượng)
          </button>
        </div>
        {!baselineOn && (
          <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 4, lineHeight: 1.45 }}>
            Chưa nạp hiện trạng — 3 phương án sẽ {hasExisting ? 'vẽ NỐI TIẾP bên phải bản vẽ (hành vi cũ)' : 'bắt đầu từ gốc toạ độ'}.
          </div>
        )}

        {/* ═════════ BƯỚC 2 — CHECK HỒ SƠ (tự chạy khi có hiện trạng) ═════════ */}
        {baselineOn && (
          <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px', background: 'var(--field)' }}>
            <div style={{ fontSize: 10.5, color: 'var(--t3)', marginBottom: 4 }}>2 · Check hồ sơ (tự chạy)</div>
            {!dossier && (
              <div style={{ fontSize: 10.5, color: 'var(--t4)' }}>Bản vẽ đang trống — chọn file DXF/DWG ở trên (hoặc vẽ) rồi checklist tự cập nhật.</div>
            )}
            {dossier?.items.map((it) => (
              <div key={it.id} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '2px 0' }} title={it.note}>
                <span style={{ marginTop: 1, flexShrink: 0 }}>{statusGlyph(it.status)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--t1)' }}>{it.item}</span>
                  <span style={{ fontSize: 10, color: 'var(--t4)' }}> — {it.note}</span>
                </div>
              </div>
            ))}
            {dossier && (
              <div style={{ fontSize: 10, color: dossier.canLayoutInSitu ? 'var(--accent)' : '#d4a15a', marginTop: 4, lineHeight: 1.45 }}>
                {dossier.canLayoutInSitu
                  ? `→ ${dossier.rooms.length} phòng thật dò được — option ở bước 3 sẽ đặt nội thất VÀO các phòng này.`
                  : '→ Chưa dò được phòng kín CÓ NHÃN — option sẽ vẽ phòng mới cạnh bản vẽ (hành vi cũ). Gắn nhãn phòng rồi mở lại panel.'}
              </div>
            )}
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0' }} />

        <label style={label}>Mô tả nhanh (1 dòng, áp thẳng — hành vi cũ)</label>
        <input
          value={quickDesc}
          onChange={(e) => setQuickDesc(e.target.value)}
          placeholder='VD: "phòng ngủ 4x3.5 có giường và tủ áo"'
          style={inputStyle}
        />
        <button type="button" onClick={runQuick} disabled={!quickDesc.trim()} style={{ ...smallBtn, marginTop: 6 }} title="Vẽ ngay 1 phương án (không qua Kiểm chuẩn)">
          <Wand2 size={12} /> Vẽ nhanh
        </button>

        <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0' }} />

        {/* ═════════ BƯỚC 3 — ĐỀ BÀI → OPTION ═════════ */}
        <label style={label}>3 · Đề bài chi tiết từ chủ đầu tư (nhiều đoạn)</label>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder={'VD:\nPhòng khách 4.2x3.6 có sofa và ghế bành\nPhòng ngủ 3.4x3.6 có giường đôi và tủ quần áo\nWC 2.2x1.8 có bồn cầu và lavabo'}
          rows={5}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
        />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <label style={{ ...label, marginBottom: 0 }}>Tỉ lệ tuỳ chỉnh (hệ số)</label>
          <input
            value={scaleText}
            onChange={(e) => setScaleText(e.target.value)}
            title="Nhân kích thước phòng đã đọc từ đề bài — 1 = giữ nguyên. KHÁC menu 'Tỉ lệ' (sửa đơn vị toàn bộ file) và khung tên (in ấn). Khi bố trí VÀO hiện trạng, kích thước phòng lấy theo PHÒNG THẬT nên hệ số này chỉ áp cho phòng KHÔNG khớp (vẽ mới)."
            style={{ ...inputStyle, width: 70 }}
          />
          <span style={{ fontSize: 10, color: 'var(--t4)' }}>1 = giữ nguyên kích thước mặc định/đã gõ trong đề bài</span>
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={!brief.trim() && !quickDesc.trim()}
          style={{ ...smallBtn, marginTop: 10, background: 'var(--accent)', color: '#fff', border: 'none' }}
        >
          <Sparkles size={13} /> {dossier?.canLayoutInSitu ? 'Tạo 3 phương án VÀO hiện trạng + kiểm chuẩn' : 'Tạo 3 phương án + kiểm chuẩn'}
        </button>

        {results && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {applied && <div style={{ fontSize: 11, color: 'var(--accent)' }}>Đã áp 1 phương án vào bản vẽ.</div>}
            {results.map((s) => {
              const dimmed = rejected.includes(s.opt.id);
              const reasons = explainLayoutOption(signalOf(s), model?.toState().weights);
              return (
                <div key={s.opt.id} style={{ display: 'flex', gap: 10, padding: 8, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--field)', opacity: dimmed ? 0.5 : 1 }}>
                  <div style={{ width: 96, height: 72, flexShrink: 0, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)', background: s.preview ? `center/cover no-repeat url("${s.preview}")` : 'var(--panel)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{s.opt.label}</div>
                    {s.opt.placedInto && s.opt.placedInto.length > 0 && (
                      <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2 }}>
                        Vào hiện trạng: {s.opt.placedInto.join(' · ')}
                      </div>
                    )}
                    <div style={{ fontSize: 10.5, color: s.violations.length ? '#d4a15a' : 'var(--accent)', marginTop: 2 }}>
                      {s.violations.length ? `${s.violations.length} vi phạm chuẩn` : 'Đạt Kiểm chuẩn (phạm vi đo được)'}
                    </div>
                    {reasons.length > 0 && (
                      <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 2 }}>{reasons.join(' · ')}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                    <button type="button" onClick={() => accept(s, results)} title="Nhận — áp bố cục + dạy máy (layout được dùng thì ghi nhớ)" style={miniBtn}>
                      <ThumbsUp size={13} />
                    </button>
                    <button type="button" onClick={() => toggleReject(s.opt.id)} title={dimmed ? 'Bỏ đánh dấu' : 'Bỏ phương án này'} style={{ ...miniBtn, ...(dimmed ? { color: 'var(--accent)' } : null) }}>
                      <ThumbsDown size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const panel: React.CSSProperties = {
  position: 'absolute',
  zIndex: 45,
  background: 'color-mix(in srgb, var(--panel) 92%, transparent)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 8,
  boxShadow: '0 8px 30px rgba(0,0,0,.22)',
};
const panelHead: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: 12.5,
  fontWeight: 600,
  color: 'var(--t2)',
  padding: '2px 6px 8px',
};
const miniBtn: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 24,
  height: 24,
  borderRadius: 6,
  border: 'none',
  background: 'transparent',
  color: 'var(--t3)',
  cursor: 'pointer',
};
const label: React.CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  color: 'var(--t3)',
  marginBottom: 4,
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  padding: '6px 8px',
  outline: 'none',
  fontSize: 12,
  color: 'var(--t1)',
  boxSizing: 'border-box',
};
const smallBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '5px 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t2)',
  fontSize: 11.5,
  cursor: 'pointer',
};
