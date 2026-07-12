'use client';

/**
 * components/present-editor/GenerateFlow.tsx — Flow MỞ ĐẦU của gợi ý bố cục (góp ý #1 & #12).
 *
 * Mạch 1 chiều, human-in-loop:
 *   1) IDLE   — nút Import ảnh nội dung (lượng lớn) → cuộn xuống paste text → đính kèm
 *               ≤5 ảnh reference HOẶC template .pptx từ thư viện → nút Generate.
 *   2) SCANNING — hiệu ứng "quét tài liệu" + mô tả ngắn máy HỌC được gì (rút từ ảnh ref
 *               bằng heuristic local analyzeReferences) & đang áp dụng.
 *   3) Sau khi quét xong → gọi onComplete(result) để container HIỆN kệ 4 cột gợi ý.
 *
 * Rút quy tắc từ ảnh: heuristic pixel (palette·nền·tỉ lệ·mật độ) — đủ để "hiểu gu".
 * Phần cần mô hình thị giác thật (font/lưới) được ghi rõ trong notes (TODO VLM).
 */

import { useEffect, useRef, useState } from 'react';
import { analyzeReferences, type RefRuleSet } from '@/lib/present-editor/analyze-refs';
import type { RefImage } from './LibraryBrowser';
import {
  Upload,
  ImagePlus,
  Paperclip,
  Sparkles,
  FileText,
  X,
  Check,
  Wand2,
  Loader2,
} from 'lucide-react';

export interface GenerateResult {
  rules: RefRuleSet | null;
  contentImages: string[];
  bodyText: string;
  /** template .pptx đã chọn từ thư viện (nếu có) — hiện chỉ ghi nhận tên. */
  pptxTemplate: string | null;
  /** ảnh reference đã đính (≤5) — nếu có, container dàn theo LƯỚI ảnh (region-layout). */
  attachRefs: string[];
}

interface Props {
  /** ảnh reference sẵn có (server + local) để "đính kèm" chọn nhanh. */
  refImages: RefImage[];
  onComplete: (r: GenerateResult) => void;
}

type Phase = 'idle' | 'scanning';

export default function GenerateFlow({ refImages, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [contentImages, setContentImages] = useState<string[]>([]);
  const [bodyText, setBodyText] = useState('');
  const [attachRefs, setAttachRefs] = useState<string[]>([]); // data/url ≤5
  const [pptxTemplate, setPptxTemplate] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [rules, setRules] = useState<RefRuleSet | null>(null);
  const [scanNote, setScanNote] = useState<string>('Đang đọc reference…');
  const imgInput = useRef<HTMLInputElement>(null);

  function onPickContent(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    Promise.all(
      files.map(
        (f) =>
          new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res(String(r.result));
            r.readAsDataURL(f);
          }),
      ),
    ).then((urls) => setContentImages((prev) => [...prev, ...urls]));
    e.target.value = '';
  }

  function toggleAttachRef(url: string) {
    setAttachRefs((prev) => {
      if (prev.includes(url)) return prev.filter((u) => u !== url);
      if (prev.length >= 5) return prev; // trần 5 ảnh reference
      setPptxTemplate(null); // chọn ảnh → bỏ chọn pptx
      return [...prev, url];
    });
  }

  async function onGenerate() {
    setPhase('scanning');
    setScanNote(
      attachRefs.length
        ? `Đang đọc ${attachRefs.length} ảnh reference để rút quy tắc bố cục…`
        : 'Đang chuẩn bị bố cục theo nội dung…',
    );
    let r: RefRuleSet | null = null;
    if (attachRefs.length) {
      try {
        r = await analyzeReferences(attachRefs);
      } catch {
        r = null;
      }
      setRules(r);
    }
    // để hiệu ứng quét chạy đủ 1 nhịp cho "cảm giác học", rồi bàn giao.
    const delay = attachRefs.length ? 2100 : 1200;
    setTimeout(() => {
      onComplete({ rules: r, contentImages, bodyText, pptxTemplate, attachRefs });
    }, delay);
  }

  // đổi dòng mô tả trong lúc quét cho sinh động (rút từ notes máy học được).
  useEffect(() => {
    if (phase !== 'scanning' || !rules?.notes.length) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % rules.notes.length;
      setScanNote(rules.notes[i]);
    }, 900);
    return () => clearInterval(id);
  }, [phase, rules]);

  if (phase === 'scanning') {
    return <ScanningCard note={scanNote} rules={rules} />;
  }

  const canGenerate = contentImages.length > 0 || bodyText.trim().length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 1) Import ảnh nội dung */}
      <StepCard n={1} title="Ảnh nội dung để dàn vào slide">
        <button type="button" onClick={() => imgInput.current?.click()} style={importBtn}>
          <Upload size={15} /> Import ảnh (chọn nhiều)
        </button>
        <input ref={imgInput} type="file" accept="image/*" multiple hidden onChange={onPickContent} />
        {contentImages.length > 0 && (
          <div style={thumbGrid}>
            {contentImages.map((u, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={u} alt="" style={thumb} />
                <button
                  type="button"
                  onClick={() => setContentImages((p) => p.filter((_, j) => j !== i))}
                  title="Bỏ ảnh"
                  style={thumbX}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        <p style={hintP}>
          <ImagePlus size={11} /> {contentImages.length} ảnh — máy sẽ dàn vào slide theo bố cục gợi ý.
        </p>
      </StepCard>

      {/* 2) Paste nội dung text */}
      <StepCard n={2} title="Nội dung text (paste vào)">
        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={4}
          placeholder="Dán nội dung deck: tiêu đề, ý chính, mô tả concept…"
          style={textArea}
        />
      </StepCard>

      {/* 3) Đính kèm reference (≤5 ảnh) hoặc template pptx */}
      <StepCard n={3} title="Reference để học gu (≤5 ảnh) hoặc template .pptx">
        <button type="button" onClick={() => setPickerOpen((v) => !v)} style={attachBtn}>
          <Paperclip size={14} /> Đính kèm từ thư viện Reference
        </button>

        {(attachRefs.length > 0 || pptxTemplate) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {pptxTemplate && (
              <span style={chip}>
                <FileText size={11} /> {pptxTemplate}
                <button type="button" onClick={() => setPptxTemplate(null)} style={chipX}>
                  <X size={10} />
                </button>
              </span>
            )}
            {attachRefs.map((u, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={u} alt="" style={{ ...thumb, width: 42, height: 42 }} />
                <button type="button" onClick={() => toggleAttachRef(u)} style={thumbX}>
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {pickerOpen && (
          <div style={pickerBox}>
            {refImages.length === 0 && (
              <p style={{ ...hintP, gridColumn: '1 / -1' }}>Thư viện Reference trống. Tải ảnh ở tab Reference.</p>
            )}
            {refImages.slice(0, 24).map((img) => {
              const on = attachRefs.includes(img.url);
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => toggleAttachRef(img.url)}
                  title={img.name}
                  style={{
                    position: 'relative',
                    padding: 0,
                    border: on ? '2px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: 6,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    aspectRatio: '1',
                    background: 'var(--field)',
                  }}
                >
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {on && (
                    <span style={pickCheck}>
                      <Check size={10} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        <p style={hintP}>
          <Wand2 size={11} /> Máy đọc ảnh reference → rút quy tắc bố cục · màu · nền · số ảnh (heuristic local).
        </p>
      </StepCard>

      {/* Generate */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={!canGenerate}
        style={{ ...genBtn, opacity: canGenerate ? 1 : 0.5, cursor: canGenerate ? 'pointer' : 'default' }}
      >
        <Sparkles size={15} /> Generate slide deck
      </button>
      {!canGenerate && (
        <p style={{ ...hintP, justifyContent: 'center' }}>Cần ít nhất 1 ảnh nội dung hoặc nội dung text.</p>
      )}
    </div>
  );
}

/* ------------------------- Scanning card ------------------------- */
function ScanningCard({ note, rules }: { note: string; rules: RefRuleSet | null }) {
  return (
    <div style={scanWrap} className="pe-fade-up">
      <div style={scanDocFrame}>
        <div style={scanDoc}>
          {/* dòng chữ giả lập tài liệu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 14 }}>
            <span style={{ ...scanLineFake, width: '40%', height: 7, background: 'var(--accent-soft)' }} />
            {[70, 90, 82, 60, 88, 46].map((w, i) => (
              <span key={i} style={{ ...scanLineFake, width: `${w}%` }} />
            ))}
          </div>
        </div>
        <div className="pe-scan-line" />
      </div>
      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Loader2 size={14} className="pe-spin" style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Đang đọc tài liệu & học gu</span>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 8, lineHeight: 1.5, minHeight: 34 }}>{note}</p>
        {rules && (
          <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 8 }}>
            {rules.palette.map((c) => (
              <span key={c} style={{ width: 16, height: 16, borderRadius: 4, background: c, border: '1px solid var(--border)' }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------- UI bits ------------------------- */
function StepCard({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--card)', padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
        <span style={stepNum}>{n}</span>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t2)' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

const stepNum: React.CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  background: 'var(--accent-soft)',
  color: 'var(--accent)',
  fontSize: 10.5,
  fontWeight: 700,
  flexShrink: 0,
};

const importBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '10px',
  borderRadius: 8,
  border: '1px dashed var(--border-strong)',
  background: 'var(--field)',
  color: 'var(--t2)',
  fontSize: 12.5,
  cursor: 'pointer',
};

const attachBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t2)',
  fontSize: 12,
  cursor: 'pointer',
};

const genBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '11px',
  borderRadius: 10,
  border: '1px solid var(--accent)',
  background: 'var(--accent)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
};

const textArea: React.CSSProperties = {
  width: '100%',
  padding: '9px 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t1)',
  fontSize: 12.5,
  fontFamily: 'inherit',
  resize: 'vertical',
};

const thumbGrid: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 6 };
const thumb: React.CSSProperties = {
  width: 48,
  height: 48,
  objectFit: 'cover',
  borderRadius: 6,
  border: '1px solid var(--border)',
};
const thumbX: React.CSSProperties = {
  position: 'absolute',
  top: -6,
  right: -6,
  width: 16,
  height: 16,
  borderRadius: '50%',
  border: 'none',
  background: 'var(--panel)',
  color: 'var(--t2)',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  boxShadow: '0 1px 4px rgba(0,0,0,.35)',
};

const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '4px 8px',
  borderRadius: 999,
  background: 'var(--accent-soft)',
  color: 'var(--accent)',
  fontSize: 11,
};
const chipX: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
  padding: 0,
};

const pickerBox: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 6,
  padding: 8,
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  maxHeight: 200,
  overflowY: 'auto',
};
const pickCheck: React.CSSProperties = {
  position: 'absolute',
  top: 3,
  right: 3,
  width: 16,
  height: 16,
  borderRadius: '50%',
  background: 'var(--accent)',
  color: '#fff',
  display: 'grid',
  placeItems: 'center',
};

const hintP: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 10.5,
  color: 'var(--t4)',
  lineHeight: 1.4,
  margin: 0,
};

const scanWrap: React.CSSProperties = { padding: '18px 8px' };
const scanDocFrame: React.CSSProperties = {
  position: 'relative',
  width: 180,
  height: 170,
  margin: '0 auto',
  borderRadius: 14,
  background: 'var(--card)',
  border: '1px solid var(--border)',
  boxShadow: '0 12px 40px rgba(0,0,0,.3)',
  overflow: 'hidden',
  display: 'grid',
  placeItems: 'center',
};
const scanDoc: React.CSSProperties = {
  width: 128,
  height: 150,
  borderRadius: 6,
  background: 'var(--field)',
  border: '1px solid var(--border)',
};
const scanLineFake: React.CSSProperties = {
  height: 5,
  borderRadius: 3,
  background: 'var(--border-strong)',
  display: 'block',
};
