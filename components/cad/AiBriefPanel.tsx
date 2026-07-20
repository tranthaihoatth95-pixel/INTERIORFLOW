'use client';

/**
 * components/cad/AiBriefPanel.tsx — MỞ RỘNG "AI mô tả" (20/07, yêu cầu chủ dự án): thêm ô nhập
 * ĐỀ BÀI CHI TIẾT từ chủ đầu tư (text dài, nhiều đoạn — khác ô 1 dòng cũ) + đề xuất NHIỀU OPTION
 * layout, mỗi option chạy qua panel Kiểm chuẩn (checkStandards — TÁI DÙNG, không viết checker
 * mới) để gắn nhãn đạt/vi phạm. UI chọn option TÁI DÙNG pattern Nhận/Bỏ đã duyệt ở Presenting
 * (components/present-editor/LayoutShelf.tsx ~dòng 155, 600-655): PairwisePerceptron học từ
 * cặp (được-chọn ≻ bị-bỏ), xem lib/cad/ai-layout-feedback.ts.
 *
 * PHẠM VI ĐÃ THU HẸP (ghi trong báo cáo cuối task): 3 option KHÔNG sinh lại kiến trúc tường/phòng
 * khác nhau — CHỈ khác biến thể ĐẶT NỘI THẤT (WallVariant) trong CÙNG 1 hình bao phòng đã parse
 * từ đề bài. "Hiện trạng": nếu bản vẽ đang có nội dung (vẽ tay hoặc đã Mở DXF/DWG — cơ chế nhập
 * có sẵn ở IOMenu, KHÔNG làm lại), layout mới vẽ NỐI TIẾP bên phải bản vẽ hiện tại — coi bản vẽ
 * đang mở là hiện trạng tham chiếu, đúng cách runAiAssist cũ đã neo origin.
 *
 * "Tỉ lệ custom đơn giản": hệ số nhân ĐƠN GIẢN áp lên kích thước phòng đã parse từ đề bài (xem
 * generateLayoutOptions() trong ai-assist.ts) — KHÁC HẲN ScaleMenu (hệ số nhân toàn bộ doc, sửa
 * đơn vị file nhập — không đụng) và titleBlock() scale text (thuộc RESEARCH-TECHNICAL-DRAWING-
 * PIPELINE.md, chờ quyết riêng — không đụng).
 */

import { useEffect, useMemo, useState } from 'react';
import { ThumbsUp, ThumbsDown, X, Sparkles, Wand2 } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { docBox, type Doc } from '@/lib/cad/model';
import { renderDocToDataURL } from '@/lib/cad/render';
import { describeToEntities, generateLayoutOptions, type LayoutOption } from '@/lib/cad/ai-assist';
import { checkStandards, type Violation } from '@/lib/cad/standards/checker';
import { getAllRules } from '@/lib/cad/standards/registry';
import { rulesForOperator } from '@/lib/cad/operator-profile';
import { PairwisePerceptron } from '@/lib/gu/pairwise-perceptron';
import { CAD_LAYOUT_OPTION_MODEL_KEY, layoutOptionFeatures, explainLayoutOption, type LayoutOptionSignal } from '@/lib/cad/ai-layout-feedback';

interface Props {
  onClose: () => void;
}

interface ScoredOption {
  opt: LayoutOption;
  violations: Violation[];
  preview: string;
  placedRatio: number;
}

export default function AiBriefPanel({ onClose }: Props) {
  const doc = useCadStore((s) => s.doc);
  const [quickDesc, setQuickDesc] = useState('');
  const [brief, setBrief] = useState('');
  const [scaleText, setScaleText] = useState('1');
  const [results, setResults] = useState<ScoredOption[] | null>(null);
  const [rejected, setRejected] = useState<string[]>([]);
  const [applied, setApplied] = useState(false);
  const [model, setModel] = useState<PairwisePerceptron | null>(null);

  useEffect(() => {
    setModel(PairwisePerceptron.loadFromLocalStorage(CAD_LAYOUT_OPTION_MODEL_KEY));
  }, []);

  const currentLayer = useCadStore((s) => s.currentLayer);
  const wallThickness = useCadStore((s) => s.wallThickness);
  const box = docBox(doc);
  const hasExisting = doc.entities.length > 0;
  const origin = box ? { x: box.maxX + 1000, y: box.minY } : { x: 0, y: 0 };
  const wallLayer = doc.layers.find((l) => l.name === 'Tường')?.id ?? currentLayer;
  const textLayer = doc.layers.find((l) => l.name === 'Ghi chú')?.id ?? currentLayer;
  const furnLayer = doc.layers.find((l) => l.name === 'Nội thất')?.id ?? 'l-furniture';

  const scaleFactor = useMemo(() => {
    const v = parseFloat(scaleText.replace(',', '.'));
    return Number.isFinite(v) && v > 0 ? v : 1;
  }, [scaleText]);

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

  /** Sinh 3 option từ đề bài chi tiết → chấm điểm bằng checkStandards (TÁI DÙNG panel Kiểm chuẩn). */
  const generate = () => {
    const text = brief.trim() || quickDesc.trim();
    if (!text) return;
    const options = generateLayoutOptions(text, origin, wallLayer, textLayer, wallThickness, furnLayer, { scaleFactor });
    const rules = options[0]?.operator && options[0].operator !== 'generic'
      ? rulesForOperator(options[0].operator).flatMap((g) => g.rules)
      : getAllRules();

    const scored: ScoredOption[] = options.map((opt) => {
      // Kiểm chuẩn trên bản vẽ hiện tại + option này (đúng ngữ cảnh sẽ chèn vào) — không đổi doc thật.
      const trialDoc: Doc = { layers: doc.layers, entities: [...doc.entities, ...opt.entities] };
      const violations = checkStandards(trialDoc, rules);
      // preview cô lập CHỈ option này (không lẫn bản vẽ hiện tại) — nhỏ, đủ nhận diện bố cục.
      const previewDoc: Doc = { layers: doc.layers, entities: opt.entities };
      const preview = opt.entities.length ? renderDocToDataURL(previewDoc, 260) : '';
      // note đã ghi rõ "CHƯA đủ chỗ" khi solver phải BỎ món do hết chỗ mọi tường (xem layoutToEntities)
      // — dùng làm tín hiệu placedRatio thô (0.5) cho feature vector, không cần đếm lại từ đầu.
      const placedRatio = opt.note.includes('CHƯA đủ chỗ') ? 0.5 : 1;
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

  /** Nhận = áp bố cục vào bản vẽ + (nếu có option khác đã Bỏ cùng lượt) dạy máy 1 cặp mỗi cái. */
  const accept = (s: ScoredOption, all: ScoredOption[]) => {
    const st = useCadStore.getState();
    st.addEntities(s.opt.entities);
    st.setStatus(s.opt.note);
    window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
    setApplied(true);

    if (model) {
      const rejIds = rejected.filter((id) => id !== s.opt.id);
      if (rejIds.length) {
        const acceptedF = layoutOptionFeatures(signalOf(s));
        for (const id of rejIds) {
          const rej = all.find((x) => x.opt.id === id);
          if (rej) model.update(acceptedF, layoutOptionFeatures(signalOf(rej)));
        }
        model.saveToLocalStorage(CAD_LAYOUT_OPTION_MODEL_KEY);
      }
    }
    onClose();
  };

  return (
    <div style={{ ...panel, top: 70, left: '50%', transform: 'translateX(-50%)', width: 560, maxHeight: '78vh', display: 'flex', flexDirection: 'column' }}>
      <div style={panelHead}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={14} /> AI mô tả — Đề bài chi tiết</span>
        <button type="button" onClick={onClose} style={miniBtn} title="Đóng"><X size={14} /></button>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '0 6px' }}>
        <div style={{ fontSize: 10.5, color: 'var(--t4)', lineHeight: 1.5, marginBottom: 8 }}>
          Bộ phân tích hiện tại là RULE-BASED (từ khoá), chưa phải LLM thật — ghi càng rõ từng phòng
          theo mẫu &quot;phòng X AxB có [nội thất]&quot; càng chính xác. {hasExisting
            ? `Hiện trạng: bản vẽ đang có ${doc.entities.length} đối tượng — layout mới sẽ vẽ NỐI TIẾP bên phải.`
            : 'Hiện trạng: bản vẽ đang trống — layout mới bắt đầu từ gốc toạ độ.'}
        </div>

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

        <label style={label}>Đề bài chi tiết từ chủ đầu tư (nhiều đoạn)</label>
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
            title="Nhân kích thước phòng đã đọc từ đề bài — 1 = giữ nguyên. KHÁC menu 'Tỉ lệ' (sửa đơn vị toàn bộ file) và khung tên (in ấn)."
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
          <Sparkles size={13} /> Tạo 3 phương án + kiểm chuẩn
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
                    <div style={{ fontSize: 10.5, color: s.violations.length ? '#d4a15a' : 'var(--accent)', marginTop: 2 }}>
                      {s.violations.length ? `${s.violations.length} vi phạm chuẩn` : 'Đạt Kiểm chuẩn (phạm vi đo được)'}
                    </div>
                    {reasons.length > 0 && (
                      <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 2 }}>{reasons.join(' · ')}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                    <button type="button" onClick={() => accept(s, results)} title="Nhận — áp bố cục + dạy máy" style={miniBtn}>
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
