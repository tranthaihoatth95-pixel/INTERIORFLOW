'use client';

/**
 * ⛔ BẢN CŨ — ĐÃ MỒ CÔI, KHÔNG CÒN ROUTE NÀO MOUNT (đóng dấu 20/08, phiếu COHERENCE-SHELL).
 *
 * Đo tại nguồn: nơi mount DUY NHẤT của `VitalsGesturePanel` là `components/studio/StageSwitcher.tsx:446`;
 * StageSwitcher bị gỡ khỏi header 17/08 (xem `AppChrome.tsx`, khối chú thích "StageSwitcher đã gỡ")
 * và `grep -rn "StageSwitcher" components app` cho thấy **0 nơi mount** nó nữa.
 * ⇒ Hai hệ quả đang sống, ghi ra để phiên sau không mất công tìm lại:
 *   ① Toàn bộ tệp này (675 dòng: ThinkDial · gợi ý theo chặng · `buildVitalsDocPayload`) hiện
 *      KHÔNG chạy trên màn nào.
 *   ② Chip "Vitals" ở `StatusBar.tsx` gọi `openVitals()` để mở panel này ⇒ **bấm vào không ra gì**.
 *      Đây là bug thật, không phải thiết kế; nó nằm ngoài vùng ghi của phiếu 20/08.
 *
 * BẢN ĐANG SỐNG là `components/studio/VitalsAperture.tsx` (khẩu độ mép trên, 3 mức
 * Ambient/Peek/Engage), dùng lại `VitalsIcon` + `VitalsStateBadge` + bề mặt chat
 * `VitalsChatSurface`. **Đừng hồi sinh tệp này bằng cách mount lại** — sẽ thành hai Vitals trên
 * một màn, phá đúng ràng buộc "mỗi màn ĐÚNG MỘT Vitals" (chốt 16/08).
 * Thứ trong đây CÒN ĐÁNG CỨU và chưa có ở khẩu độ: **ThinkDial 4 nấc** và **`buildVitalsDocPayload`**
 * (gửi tóm tắt bản vẽ + kiểm quy chuẩn theo nấc). Cứu = dời hai thứ đó sang bề mặt chat đang
 * sống, KHÔNG phải mount lại cả panel.
 *
 * ── nguyên văn mô tả cũ, giữ làm dấu vết ──────────────────────────────────────────────
 * components/studio/VitalsGesture.tsx — panel chat NHỎ của Vitals AI mở ra khi
 * người dùng KÉO XUỐNG từ handle line ở đáy StageSwitcher.
 *
 * 23/07 refactor (từ VitalsStageDrop cũ): BỎ toàn bộ visual giọt kính teardrop
 * (SVG, drip motion, breathing) — user chốt "bỏ hiệu ứng giọt kính nhưng phải
 * chừa lại cho người ra cử chỉ kéo xuống hiện ô chat được tối ưu trả lời cho
 * từng chặng". Chỉ giữ:
 *   - Panel chat 380px, tách khỏi thanh chặng (pre-mount fix motion khưng
 *     8d3b6a4 vẫn còn: parent mount với open=false trong lúc drag → threshold
 *     hit set open=true, không cold-mount).
 *   - Payload gửi kèm `stage` (concept/render/present/gallery) → route
 *     ai-assist-chat pick system prompt tuỳ chặng.
 *
 * KHÔNG mount ở Gallery — Gallery có VitalsChatBubble riêng (ProjectSelect.tsx).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Brain, ClipboardCheck, Loader2, Scale, Send, X, Zap } from 'lucide-react';
import type { ChatTurn } from '@/lib/ai/chat-assist';
import {
  applyFeedback,
  buildEvalRecord,
  isRecordStale,
  learnDelta,
  summaryForVitals,
  type EvalRecord,
  type EvalVerdict,
} from '@/lib/capabilities/vitals-eval-core';
import { loadEvalModel, saveEvalModel, saveEvalRecord } from '@/lib/capabilities/vitals-eval-persist';
import type { DesignDnaCard } from '@/lib/dna/types';
import { isDesignDnaCard } from '@/lib/dna/types';
import { getLastUserId } from '@/lib/resume';
import VitalsEvalPanel from './VitalsEvalPanel';
import { vitalsStateFor } from './vitals-eval-ui';
import { summarizeDoc, type DocContext } from '@/lib/ai/doc-context';
import { topViolations, type TopViolationsResult } from '@/lib/ai/violations-context';
import { useCadStore } from '@/lib/cad/store';
import type { VitalsStage } from './vitals-tin-hieu';
import { easeApple } from '@/lib/motion';
import { useFlowStore } from '@/lib/store';
import { brandContextForVitals } from '@/lib/present-editor/brand-kit';
import { useDismissable } from '@/lib/useDismissable';
import { VitalsBubble, VitalsTyping } from './VitalsChatBubble';
import { VitalsStateDot, type VitalsState } from './VitalsStateBadge';

// 27/07 chốt design tokens: --accent (tím) là accent CHÍNH THỨC toàn app.
const ACCENT = 'var(--accent)';

/** 05/08 VIỆC 1 (c) — gợi ý mở đầu theo chặng, PORT mock `Vitals v2.dc.html` màn "02" nhưng
 * SỬA layout: mock xếp 4 gợi ý thành cột dọc chiếm gần hết popover (lối bày điện thoại) — trên
 * desktop popover chỉ rộng 380px, đủ chỗ vẫn còn phải cuộn thread bên dưới. Viên nhỏ xếp NGANG
 * (không phải danh sách dọc), tự xuống hàng khi hết chỗ. Chỉ hiện khi chưa có hội thoại
 * (`!hasThread`) — bấm gửi thẳng câu hỏi, không phải điền vào ô rồi bấm lần nữa.
 *
 * 05/08 VIỆC 3 — nâng 2 → **3 gợi ý/chặng**, đóng đúng ô `IF-FEATURE-TREE 6.14` ("§5 mục 2 —
 * gợi ý theo chặng, 3 nút sẵn mỗi chặng"). Câu chữ đổi từ kiểu HỎI KIỂM ("Đạt TCVN chưa?") sang
 * kiểu RA VIỆC ("kiểm chuẩn tờ này") theo `SPEC-NGON-NGU-CHI-DAN` luật 1 (hành động trước).
 *
 * 08/08 (DOI-CHIEU-42-SPEC §1#2) — `docContext` NAY ĐÃ NỐI vào payload gửi server (xem
 * `buildVitalsDocPayload` bên dưới): Vitals đọc được tóm tắt bản vẽ + selection + kết quả kiểm
 * quy chuẩn. Riêng BA GỢI Ý này vẫn là bảng TĨNH theo chặng — nâng thành
 * `suggestionsFor(stage, docContext)` (ô 6.8, gợi ý theo đối tượng đang chọn) là việc RIÊNG,
 * chưa làm ở phiên nối payload này. */
const STAGE_SUGGESTIONS: Record<VitalsStage, [string, string, string]> = {
  concept: ['kiểm chuẩn tờ này', 'phòng nào chưa có vật liệu', 'xuất PDF'],
  render: ['đặt đèn nắng chiều', 'vật liệu sàn phòng ngủ', 'render thử'],
  present: ['sinh bảng khối lượng', 'thêm trang bìa', 'xuất hồ sơ khách'],
  // 'gallery' = KHÔNG ở chặng nào (Trang chủ · Files · Thư viện · Bảng việc · Cài đặt).
  // Gợi ý phải ở mức bàn phương án, đúng `ChatStage.gallery` của `lib/ai/chat-assist.ts`.
  gallery: ['bắt đầu dự án thế nào', 'chọn chặng nào tiếp', 'gợi ý phong cách'],
};

/**
 * VIỆC A (08/08 — DOI-CHIEU-42-SPEC §1#2) — tóm tắt bản vẽ + kiểm quy chuẩn gửi kèm payload.
 * Server ĐÃ nhận sẵn 2 field này (`ai-assist-chat/route.ts:52-53` sanitize cả hai); đây là đầu
 * dây CLIENT còn thiếu. Đọc `useCadStore.getState()` NGAY LÚC GỬI (không subscribe — panel chat
 * không cần re-render theo từng nét vẽ), dùng nguyên API sẵn: `summarizeDoc` tự chặn bước đo
 * diện tích khi bản vẽ quá nặng (`MAX_ROOMS_FOR_AREA`, vì `findHatchBoundary` có thể treo —
 * TECH-DEBT.md); khi nó đã phải bỏ đo (`areasSkipped`) thì CŨNG BỎ `topViolations` — checker đi
 * qua đúng `findRoomLabels` đó, cùng rủi ro treo, cùng ngưỡng, không đẻ ngưỡng thứ hai.
 *
 * Selection CHỈ gửi khi đang ở chặng Thiết kế 2D (`concept`) — selection sống trong CAD store,
 * sang chặng 3D/Trình chiếu nó là trạng thái CŨ của canvas không còn trước mặt người dùng, gửi
 * lên là Vitals nói về thứ họ không nhìn thấy. Doc thì gửi ở cả 3 chặng (luật X1: một Doc chung,
 * chặng nào cũng đọc nó). Doc rỗng → trả {} — prompt y hệt trước, không hồi quy.
 */
function buildVitalsDocPayload(
  stage: VitalsStage,
  level: ThinkLevel = 'deep',
): {
  docContext?: DocContext;
  violations?: TopViolationsResult;
} {
  // ThinkDial (12/08): 'fast' = không gửi ngữ cảnh nào (câu hỏi trần, rẻ + nhanh) ·
  // 'balanced' = chỉ docContext · 'deep' = docContext + violations (đường đầy đủ cũ).
  // 'research' KHÔNG đi qua hàm này — nó gọi route Notebook RAG riêng (xem send()).
  if (level === 'fast') return {};
  const st = useCadStore.getState();
  const doc = st.doc;
  if (!doc || !Array.isArray(doc.entities) || doc.entities.length === 0) return {};

  const docContext = summarizeDoc(
    doc,
    stage === 'concept' && st.selection.length ? { selectedIds: st.selection } : {},
  );
  if (level === 'balanced') return { docContext };
  if (docContext.areasSkipped) return { docContext }; // bản vẽ nặng — bỏ kiểm, tránh treo (xem trên)

  const violations = topViolations(doc);
  return violations.total > 0 ? { docContext, violations } : { docContext };
}

/* ====================================================================================
 * ThinkDial — [marker: ThinkDial] cần gạt mức suy nghĩ của Vitals (12/08).
 * 4 nấc, người dùng CHỌN gửi bao nhiêu ngữ cảnh (mặc định Cân bằng, nhớ localStorage):
 *   fast     Trả nhanh   — không gửi docContext/violations
 *   balanced Cân bằng    — gửi docContext (tóm tắt bản vẽ)
 *   deep     Nghĩ sâu    — docContext + kiểm quy chuẩn (đường đầy đủ trước 12/08)
 *   research Nghiên cứu  — tra sổ tri thức dự án qua route Notebook RAG THẬT
 *                          (`POST /api/notebook/{id}/query` — có sẵn, trả answer + sources).
 * ==================================================================================== */

export type ThinkLevel = 'fast' | 'balanced' | 'deep' | 'research';

const THINK_LEVEL_KEY = 'interiorflow.vitals.thinkLevel';

const THINK_LEVELS: {
  id: ThinkLevel;
  label: string;
  hint: string;
  Icon: typeof Zap;
}[] = [
  { id: 'fast', label: 'Trả nhanh', hint: 'Không gửi ngữ cảnh bản vẽ', Icon: Zap },
  { id: 'balanced', label: 'Cân bằng', hint: 'Gửi tóm tắt bản vẽ', Icon: Scale },
  { id: 'deep', label: 'Nghĩ sâu', hint: 'Tóm tắt bản vẽ + kiểm quy chuẩn', Icon: Brain },
  { id: 'research', label: 'Nghiên cứu', hint: 'Tra sổ tri thức Notebook, trả lời kèm nguồn', Icon: BookOpen },
];

function readThinkLevel(): ThinkLevel {
  if (typeof window === 'undefined') return 'balanced';
  try {
    const v = window.localStorage.getItem(THINK_LEVEL_KEY);
    if (v === 'fast' || v === 'balanced' || v === 'deep' || v === 'research') return v;
  } catch {
    /* private mode — dùng mặc định */
  }
  return 'balanced';
}

function ThinkDial({ level, onChange }: { level: ThinkLevel; onChange: (l: ThinkLevel) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);
  useDismissable({ open: menuOpen, onDismiss: () => setMenuOpen(false), refs: [dialRef] });
  const current = THINK_LEVELS.find((l) => l.id === level) ?? THINK_LEVELS[1];

  return (
    <div ref={dialRef} data-think-dial="" style={{ position: 'relative', flex: 'none' }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`Mức suy nghĩ: ${current.label}`}
        title={`${current.label} — ${current.hint}`}
        onClick={() => setMenuOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          height: 24,
          padding: '0 8px',
          borderRadius: 14,
          border: '1px solid rgba(127,127,127,0.2)',
          background: 'transparent',
          color: 'var(--t3)',
          fontSize: 10.5,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <current.Icon size={11} style={{ color: ACCENT }} />
        {current.label}
      </button>
      {menuOpen && (
        <div
          role="menu"
          aria-label="Chọn mức suy nghĩ"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            right: 0,
            width: 216,
            padding: 4,
            borderRadius: 14,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-pop)',
            zIndex: 5,
          }}
        >
          {THINK_LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="menuitemradio"
              aria-checked={l.id === level}
              onClick={() => {
                onChange(l.id);
                setMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                width: '100%',
                padding: '6px 8px',
                borderRadius: 10,
                border: 'none',
                background: l.id === level ? 'var(--accent-soft)' : 'transparent',
                color: l.id === level ? 'var(--accent)' : 'var(--t2)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <l.Icon size={12} style={{ flex: 'none', marginTop: 2 }} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 11.5, fontWeight: 600, lineHeight: 1.4 }}>{l.label}</span>
                <span style={{ display: 'block', fontSize: 10, color: 'var(--t4)', lineHeight: 1.45 }}>{l.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Lịch sử hội thoại sống ở mức MODULE — panel unmount không mất, reload mới mất. */
let vitalsSession: ChatTurn[] = [];
let vitalsUsed = false;

export function markVitalsUsed() {
  vitalsUsed = true;
}
export function wasVitalsUsed() {
  return vitalsUsed;
}

/** Nhãn hiển thị theo chặng — dùng ở header panel để user biết đang hỏi Vitals ở đâu.
 * 03/08 CHỐT TÊN vòng cuối (docs/CHOT-TEN-CHANG-MODE-2026-08-03.md).
 * 04/08 [P7 ĐỔI TÊN] — 2D Kỹ thuật→Thiết kế 2D · 3D Thiết kế→Thiết kế 3D · Trình bày→Trình chiếu. */
const STAGE_LABEL: Record<Exclude<VitalsStage, 'gallery'>, string> = {
  concept: 'Thiết kế 2D',
  render: 'Thiết kế 3D',
  present: 'Trình chiếu',
};

const STAGE_PLACEHOLDER: Record<VitalsStage, string> = {
  concept: 'Hỏi Vitals — TCVN, kích thước, dossier check…',
  render: 'Hỏi Vitals — materials, lighting, camera angle…',
  present: 'Hỏi Vitals — brand guideline, typography, layout…',
  gallery: 'Hỏi Vitals — dự án, phong cách, bắt đầu từ đâu…',
};

/**
 * Nhãn tấm chat. `'gallery'` KHÔNG có tên chặng — và đó là điểm của cả lát sửa này: ở màn không
 * thuộc chặng nào thì nói **"Vitals"**, đừng bịa ra một chặng. Nguồn DUY NHẤT của chuỗi này, để
 * tiêu đề nhìn thấy và `aria-label` không thể lệch nhau.
 */
export function nhanTamChat(stage: VitalsStage): string {
  return stage === 'gallery' ? 'Vitals' : `Vitals · ${STAGE_LABEL[stage]}`;
}

export default function VitalsGesturePanel({
  originPx,
  open,
  onClose,
  stage,
  direction = 'down',
  initialInput,
  autoSend,
  onConsumeInitial,
}: {
  originPx: number | null;
  open: boolean;
  onClose: () => void;
  /** Chặng hiện tại — gửi vào payload để backend pick system prompt phù hợp. */
  /**
   * Chặng hiện tại — gửi vào payload để backend pick system prompt phù hợp.
   * `'gallery'` (04/09) = **KHÔNG ở chặng nào** (Trang chủ · Files · Thư viện · Bảng việc · Cài
   * đặt). Thêm giá trị này vì `Phase` chỉ có 3 chặng nên nơi gọi buộc phải nói dối một trong ba;
   * đo được hậu quả: tấm chat ghi "VITALS · THIẾT KẾ 3D" khi đứng ở Trang chủ.
   * Mã `'gallery'` KHÔNG mới — `lib/ai/chat-assist.ts#ChatStage` đã có đúng nghĩa đó từ trước.
   */
  stage: VitalsStage;
  /**
   * 'down' (mặc định, hành vi CŨ) = panel xổ XUỐNG từ mép trên container (gesture kéo ở
   * StageSwitcher, trên cùng màn). 'up' (VIỆC A, 28/07) = xổ LÊN từ mép dưới container —
   * dùng khi mở từ StatusBar (đáy màn hình), giống Spotlight/Siri macOS xổ lên từ thanh dưới.
   */
  direction?: 'down' | 'up';
  /** Gõ sẵn trong ô gọn ở StatusBar rồi bấm/Enter → panel mở kèm câu hỏi này (lib/vitals-ui.ts). */
  initialInput?: string;
  /** true = gửi luôn `initialInput` ngay khi panel mở, không cần gõ lại. */
  autoSend?: boolean;
  /** Panel đã tiêu thụ initialInput/autoSend — caller xoá khỏi store dùng chung, tránh gửi lặp. */
  onConsumeInitial?: () => void;
}) {
  const reduce = useReducedMotion();
  const router = useRouter();
  // SCOPE FIX (Task #18): điều hướng Notebook bằng id ổn định (Project.id thật hoặc
  // Flow.id) thay cho slug tên flow — tránh 2 dự án khác nhau chung notebook.
  const currentProjectId = useFlowStore((s) => s.currentProjectId);
  const currentFlowId = useFlowStore((s) => s.currentFlowId);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatTurn[]>(() => vitalsSession);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  // ThinkDial (12/08) — mức suy nghĩ, nhớ giữa các phiên qua localStorage, mặc định Cân bằng.
  const [thinkLevel, setThinkLevel] = useState<ThinkLevel>(readThinkLevel);
  const changeThinkLevel = useCallback((l: ThinkLevel) => {
    setThinkLevel(l);
    try {
      window.localStorage.setItem(THINK_LEVEL_KEY, l);
    } catch {
      /* private mode — lựa chọn vẫn sống trong phiên này */
    }
  }, []);

  useEffect(() => {
    vitalsSession = messages;
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // 2.2.90 ĐỢT 3 — chuyển sang useDismissable dùng chung (bản gốc đã tự dùng đúng họ sự kiện
  // pointerdown pha bắt, chỉ khác Escape trước đây ở window pha nổi).
  useDismissable({ open, onDismiss: onClose, refs: [rootRef] });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;
    const next: ChatTurn[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setSending(true);
    setError(null);
    // ThinkDial nấc "Nghiên cứu" (12/08): KHÔNG đi /api/ai-assist-chat — hỏi thẳng sổ tri thức
    // dự án qua route Notebook RAG có sẵn (một-lượt: route nhận `question`, không nhận thread).
    // Trả lời kèm danh sách nguồn trích; notebook trống thì route vẫn trả lời và nói rõ là
    // hiểu biết chung (sources rỗng) — không bịa nguồn.
    if (thinkLevel === 'research') {
      try {
        const id = currentProjectId || currentFlowId || 'default';
        const res = await fetch(`/api/notebook/${id}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: text, stage }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError({
            message:
              res.status === 401
                ? 'Cần đăng nhập để tra sổ tri thức dự án.'
                : typeof j?.error === 'string' ? j.error : 'Có lỗi xảy ra — thử lại.',
          });
          return;
        }
        const sources: { sourceTitle?: string }[] = Array.isArray(j?.sources) ? j.sources : [];
        const titles = [...new Set(sources.map((s) => String(s.sourceTitle ?? '').trim()).filter(Boolean))];
        const reply =
          String(j?.answer ?? '').trim() +
          (titles.length ? `\n\nNguồn: ${titles.join(' · ')}` : '\n\n(Notebook chưa có tài liệu — trả lời từ hiểu biết chung.)');
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      } catch {
        setError({ message: 'Mất kết nối — thử lại.' });
      } finally {
        setSending(false);
      }
      return;
    }
    try {
      const res = await fetch('/api/ai-assist-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // `brand`: Brand Kit đang chọn (localStorage — backend không đọc được). Chưa có kit →
        // null, Vitals sẽ nói thẳng là dự án chưa có nhận diện thay vì bịa màu/font.
        // `docContext`/`violations` (VIỆC A 08/08): tóm tắt bản vẽ + kiểm quy chuẩn, tính tươi
        // ngay lúc gửi — xem docstring `buildVitalsDocPayload`. Doc rỗng → 2 field vắng mặt,
        // payload y hệt bản cũ.
        body: JSON.stringify({
          messages: next,
          stage,
          brand: brandContextForVitals(),
          ...buildVitalsDocPayload(stage, thinkLevel),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({
          message: typeof j?.error === 'string' ? j.error : 'Có lỗi xảy ra — thử lại.',
          code: typeof j?.code === 'string' ? j.code : undefined,
        });
        return;
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: String(j?.reply ?? '').trim() }]);
    } catch {
      setError({ message: 'Mất kết nối — thử lại.' });
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, stage, thinkLevel, currentProjectId, currentFlowId]);

  // VIỆC A (28/07) — mở từ StatusBar kèm sẵn câu hỏi (gõ ở ô gọn trước khi bấm/Enter).
  // Chỉ chạy khi `open` chuyển true (không phụ thuộc initialInput đổi liên tục — chỉ đọc 1 lần
  // lúc mở), tiêu thụ xong báo `onConsumeInitial` để store dùng chung xoá, tránh gửi lặp nếu
  // panel re-render hoặc mở lại mà không gõ gì mới.
  useEffect(() => {
    if (!open || !initialInput) return;
    setInput(initialInput);
    if (autoSend) void send(initialInput);
    onConsumeInitial?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ⛔ `openFullNotebook` + nút ⤢ ĐÃ GỠ 05/09 (A1-02). ĐỪNG DỰNG LẠI — đây là việc TRỪ ĐI, và
     bốn lý do đều là luật đã chốt, không phải chuyện gu:
       ① `ACTIVE-DESIGN-CONTEXT` §4 **D-DR1** — *"sau di trú phải còn ĐÚNG MỘT chỗ đứng vật lý"*.
          Nút này đẩy sang `/projects/<id>/notebook`, một route KHÔNG có khẩu độ Vitals (đo 05/09:
          `[data-vitals-state]` = 0 phần tử trên màn đó) ⇒ chỗ đứng thứ hai, và là ngõ cụt.
       ② §2 **Morph giữ định danh** — aperture→peek→engage phải là CÙNG MỘT VẬT nở ra; nhảy sang
          màn khác là teleport.
       ③ `00-CHOT` 04/09 — *"trong IF AI tương tác là Vitals, không có mặt AI thứ hai"*; nhãn cũ
          còn lộ tên sản phẩm ngoài ("NotebookLM").
       ④ `id = currentProjectId || currentFlowId || 'default'` **bịa ra một dự án không có trên
          tài khoản** — đo 05/09 với tài khoản 0 dự án: đầu trang in `DỰ ÁN · PROJECT #DEFAULT`.
     Mức Engage của khẩu độ ĐÃ LÀ mặt đầy đủ (EXS §7), nên không mất năng lực nào.
     Route `/projects/[id]/notebook` KHÔNG mồ côi — còn 3 lối vào thật, đo bằng grep 05/09:
       · `app/projects/[id]/overview/page.tsx:224` (Link trên trang Tổng quan dự án)
       · `app/library/knowledge/page.tsx:27` (nút "Thêm tài liệu (Sổ tay)")
       · `lib/library/knowledge.ts:147` (href của mỗi mục tri thức) */

  const hasThread = messages.length > 0 || sending || !!error;

  /* VIỆC B (08/08 — DOI-CHIEU-42-SPEC §1#13) — nguồn THẬT cho trạng thái "Có việc cần xem":
   * đếm lỗi + cảnh báo quy chuẩn của bản vẽ đang mở, tính MỘT LẦN mỗi lượt mở panel (không chạy
   * checker theo từng render — checker duyệt cả Doc). Không có doc / bản vẽ nặng bỏ kiểm / 0 vi
   * phạm → 0, chấm về 'idle' như cũ. */
  const [pendingIssues, setPendingIssues] = useState(0);
  useEffect(() => {
    if (!open) return;
    // Chấm "có việc cần xem" luôn kiểm ĐẦY ĐỦ ('deep') bất kể nấc ThinkDial — cảnh báo quy chuẩn
    // là thông tin thật của bản vẽ, người dùng chọn Trả nhanh không có nghĩa muốn giấu lỗi.
    const v = buildVitalsDocPayload(stage, 'deep').violations;
    setPendingIssues(v ? v.countsBySeverity.error + v.countsBySeverity.warning : 0);
  }, [open, stage]);

  /* 05/08 VIỆC 1 (b) — `sending` (đang chờ fetch, không streaming) → 'answering' (khớp nhãn
   * VitalsTyping cũ). 'listening'/'thinking' chưa có nguồn thật (không voice input, không
   * streaming 2 pha) nên không gán ở đây — xem comment đầu VitalsStateBadge.tsx.
   * 08/08 thêm 'alert' khi bản vẽ có lỗi/cảnh báo quy chuẩn chưa xử lý (nguồn thật ở trên). */
  /* ── Slice 12 (03/09) — ĐÁNH GIÁ BẢN VẼ: hành động thật, tất định, 0 credit, không sửa Doc.
   * Lõi `lib/capabilities/vitals-eval-core` đọc Doc + Thẻ DNA dự án (GET route sẵn có, thẻ mới
   * cập nhật nhất) + mô hình phản hồi on-device (localStorage) → bản ghi đánh giá; bản ghi lưu
   * IndexedDB qua sheets-persist (best-effort, hỏng đĩa không chặn). Nhận/Bỏ = nhãn huấn luyện
   * duy nhất — im lặng không phải nhãn. "Hỏi Vitals" = đường AI TUỲ CHỌN qua chat sẵn có. */
  const [evalRecord, setEvalRecord] = useState<EvalRecord | null>(null);
  const [evalBusy, setEvalBusy] = useState(false);
  const [evalSaved, setEvalSaved] = useState<boolean | null>(null);
  const [evalNote, setEvalNote] = useState<string | null>(null);
  const evalModelRef = useRef<ReturnType<typeof loadEvalModel> | null>(null);
  const sessionUser = useFlowStore((s) => s.user);
  const evalUserId = sessionUser?.id ?? (typeof window !== 'undefined' ? getLastUserId() : null);
  const evalProjectId = currentProjectId || currentFlowId || null;

  const runEval = useCallback(async () => {
    if (evalBusy) return;
    // Nút "Đánh giá bản vẽ" chỉ render khi `stage === 'concept'`; canh lại ở đây để kiểu THU HẸP
    // đúng chỗ, thay vì ép kiểu. `buildEvalRecord` chấm bản vẽ 2D — 'gallery' không có bản vẽ nào.
    if (stage !== 'concept') return;
    const doc = useCadStore.getState().doc;
    if (!doc || !Array.isArray(doc.entities) || doc.entities.length === 0) {
      setEvalNote('Bản vẽ đang trống — chưa có gì để đánh giá.');
      return;
    }
    setEvalBusy(true);
    setEvalNote(null);
    setEvalSaved(null);
    // Thẻ DNA: chỉ đọc; không có/không tải được ⇒ lớp gu tự khai bị chặn (lõi ghi lý do).
    let card: DesignDnaCard | null = null;
    if (evalProjectId) {
      try {
        const res = await fetch(`/api/projects/${evalProjectId}/dna`);
        const j = res.ok ? await res.json().catch(() => null) : null;
        const cards: unknown[] = Array.isArray(j?.cards) ? j.cards : [];
        const valid = cards.filter(isDesignDnaCard).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
        card = valid[0] ?? null;
      } catch (err) {
        console.warn('[vitals-eval] không tải được Thẻ DNA — lớp gu bị chặn', err);
      }
    }
    const model = evalModelRef.current ?? loadEvalModel();
    evalModelRef.current = model;
    const record = buildEvalRecord({ doc, stage, projectId: evalProjectId, card, model, now: new Date().toISOString() });
    setEvalRecord(record);
    setEvalBusy(false);
    if (evalUserId && evalProjectId) setEvalSaved(await saveEvalRecord(evalUserId, evalProjectId, record));
  }, [evalBusy, evalProjectId, evalUserId, stage]);

  const onEvalFeedback = useCallback(
    (findingId: string, verdict: EvalVerdict) => {
      setEvalRecord((prev) => {
        if (!prev) return prev;
        const next = applyFeedback(prev, findingId, verdict, new Date().toISOString());
        const model = evalModelRef.current ?? loadEvalModel();
        evalModelRef.current = model;
        if (learnDelta(model, next, findingId) > 0) saveEvalModel(model);
        if (evalUserId && evalProjectId) void saveEvalRecord(evalUserId, evalProjectId, next).then(setEvalSaved);
        return next;
      });
    },
    [evalProjectId, evalUserId],
  );

  // Chọn = trạng thái UI của CAD store, không đụng hình học — lùi được bằng cách bấm chỗ khác.
  const onEvalSelect = useCallback((ids: string[]) => {
    useCadStore.getState().select(ids);
  }, []);

  const onEvalAsk = useCallback(() => {
    if (!evalRecord) return;
    void send(summaryForVitals(evalRecord));
  }, [evalRecord, send]);

  const evalStale = !!evalRecord && isRecordStale(evalRecord, useCadStore.getState().doc);

  const vitalsState: VitalsState = sending
    ? 'answering'
    : pendingIssues > 0 || vitalsStateFor(evalRecord) === 'alert'
      ? 'alert'
      : 'idle';

  return (
    <motion.div
      ref={rootRef}
      role="dialog"
      aria-label={nhanTamChat(stage)}
      aria-hidden={!open}
      data-vitals-chat=""
      initial={reduce ? { opacity: 0 } : { opacity: 0, scaleY: 0.7, scaleX: 0.95, y: direction === 'up' ? 6 : -6 }}
      animate={
        reduce
          ? { opacity: open ? 1 : 0, transition: { duration: 0.15 } }
          : open
            ? { opacity: 1, scaleY: 1, scaleX: 1, y: 0, transition: { duration: 0.22, ease: easeApple } }
            : {
                opacity: 0,
                scaleY: 0.7,
                scaleX: 0.95,
                y: direction === 'up' ? 6 : -6,
                transition: { duration: 0.14, ease: easeApple },
              }
      }
      exit={
        reduce
          ? { opacity: 0, transition: { duration: 0.12 } }
          : { opacity: 0, scaleY: 0.94, y: direction === 'up' ? 6 : -6, transition: { duration: 0.16, ease: easeApple } }
      }
      style={{
        position: 'absolute',
        ...(direction === 'up' ? { bottom: 'calc(100% + 10px)' } : { top: 'calc(100% + 10px)' }),
        left: 0,
        width: 'min(380px, calc(100vw - 24px))',
        zIndex: 60,
        originX: originPx == null ? 0.5 : `${originPx}px`,
        originY: direction === 'up' ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* 05/08 — ĐỔI `.lq-card` → `.vitals-pop` (globals.css): `.lq-card` là kính RẤT TRONG cho
          card đăng nhập nổi trên ảnh; popover này nổi trên toolbar/thumbnail dày chữ nên chữ
          chồng chữ, không đọc được (Hoà báo ở chặng Trình bày). `.vitals-pop` = nền đặc 96% +
          blur + viền + bóng, chữ có nền của chính nó. Bỏ luôn `.lq-content` (chỉ để thêm
          text-shadow cho chữ nổi trên kính trong — thừa khi nền đã đặc). */}
      <div className="vitals-pop">
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px 7px',
              borderBottom: '1px solid rgba(127,127,127,0.2)',
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 9,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--t4)',
              }}
            >
              <VitalsStateDot state={vitalsState} size={7} />
              {nhanTamChat(stage)}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {stage === 'concept' && (
                <button
                  type="button"
                  aria-label="Đánh giá bản vẽ — máy đo, 0 credit"
                  title="Đánh giá bản vẽ: quy chuẩn · chuẩn đầu ra · tỷ lệ phòng · vật liệu · gu dự án (máy đo, không tốn credit)"
                  aria-pressed={!!evalRecord}
                  disabled={evalBusy}
                  onClick={() => void runEval()}
                  data-vitals-eval-run=""
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    height: 22,
                    padding: '0 8px',
                    borderRadius: 999,
                    border: `1px solid ${evalRecord ? ACCENT : 'rgba(127,127,127,0.2)'}`,
                    background: evalRecord ? 'var(--accent-soft)' : 'transparent',
                    color: evalRecord ? ACCENT : 'var(--t3)',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: evalBusy ? 'progress' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {evalBusy ? <Loader2 size={11} className="animate-spin" /> : <ClipboardCheck size={11} />}
                  Đánh giá
                </button>
              )}
              <button
                type="button"
                aria-label="Đóng Vitals"
                onClick={onClose}
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 22,
                height: 22,
                borderRadius: 999,
                border: 'none',
                background: 'transparent',
                color: 'var(--t4)',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
            </div>
          </div>

          {evalNote && (
            <div role="status" style={{ padding: '8px 12px 0', fontSize: 11, color: 'var(--t3)' }}>
              {evalNote}
            </div>
          )}

          {evalRecord && (
            <VitalsEvalPanel
              record={evalRecord}
              stale={evalStale}
              saved={evalSaved}
              onFeedback={onEvalFeedback}
              onSelect={onEvalSelect}
              onAsk={onEvalAsk}
              onClose={() => setEvalRecord(null)}
            />
          )}

          {!hasThread && !evalRecord && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 10px 4px' }}>
              {STAGE_SUGGESTIONS[stage].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 26,
                    padding: '0 10px',
                    maxWidth: '100%',
                    borderRadius: 999,
                    border: '1px solid rgba(127,127,127,0.2)',
                    background: 'transparent',
                    color: 'var(--t2)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: 2, background: ACCENT, flex: 'none' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q}</span>
                </button>
              ))}
            </div>
          )}

          {hasThread && (
            <div
              ref={scrollRef}
              style={{
                maxHeight: '36vh',
                overflowY: 'auto',
                padding: '10px 10px 4px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {messages.map((m, i) => (
                <VitalsBubble key={i} role={m.role} size="sm">
                  {m.content}
                </VitalsBubble>
              ))}
              {sending && <VitalsTyping label="Vitals đang trả lời…" />}
              {error && (
                <div
                  style={{
                    borderRadius: 10,
                    padding: '7px 10px',
                    fontSize: 11.5,
                    lineHeight: 1.5,
                    color: 'var(--t1)',
                    background: 'rgba(200,64,40,0.12)',
                    border: '1px solid rgba(200,64,40,0.3)',
                    textAlign: 'left',
                  }}
                >
                  {error.code === 'NO_TEXT_PROVIDER'
                    ? 'AI chưa được cấu hình — ' + error.message
                    : error.code === 'NVIDIA_FREE_EXHAUSTED'
                      ? 'AI tạm hết lượt miễn phí — ' + error.message
                      : error.message}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px 8px 12px' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void send();
                }
                if (e.key === 'Escape') onClose();
              }}
              disabled={sending}
              aria-label="Hỏi Vitals"
              placeholder={STAGE_PLACEHOLDER[stage]}
              /* ring TRONG: ô nằm trong vỏ pill của khẩu độ Vitals — ring ngoài đè viền vỏ */
              className="if-focus-inset"
              style={{
                flex: 1,
                minWidth: 0,
                background: 'transparent',
                border: 'none',
                fontSize: 12.5,
                color: 'var(--t1)',
              }}
            />
            <ThinkDial level={thinkLevel} onChange={changeThinkLevel} />
            <button
              type="button"
              aria-label="Gửi cho Vitals"
              onClick={() => void send()}
              disabled={sending || !input.trim()}
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 28,
                height: 28,
                borderRadius: 14,
                border: 'none',
                background: ACCENT,
                color: '#fff',
                cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: sending || !input.trim() ? 0.35 : 1,
                flex: '0 0 auto',
              }}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
