'use client';
/**
 * components/studio/VitalsChatSurface.tsx — BỀ MẶT ENGAGE của Vitals (hội thoại + cửa giọng nói).
 *
 * 📦 TÁCH KHỎI `components/home/widgets/VitalsPill.tsx` ngày 22/08 theo LUẬT SỞ HỮU:
 *   · Lane A (UI) sở hữu VỎ TRÌNH BÀY — bố cục · khoảng thở · chữ · vật liệu của Trang chủ.
 *   · Lane B (chức năng) sở hữu HÀNH VI — hội thoại · hợp đồng `CuaNhan` · ghi ghi chú · lệnh.
 * 🔴 Vì sao phải tách: một widget của Trang chủ đang GIỮ business logic của Vitals ⇒ Home không
 * thể redesign mà không đụng Voice/Vitals, và ngược lại. Tách một lần, hai bên tự do.
 *
 * ⚠️ Đặt ở `components/studio/` vì ĐÓ LÀ NHÀ CANONICAL của Vitals (VitalsAperture · VitalsIcon ·
 * VitalsQuyDao · VitalsStateBadge · vitals-tin-hieu đều ở đây) — KHÔNG đẻ thư mục `vitals/` mới.
 * Chính `VitalsAperture.tsx:14` đã khai tên này từ trước; nay tệp về đúng chỗ nó được khai.
 *
 * ⛔ Tệp này KHÔNG chứa: bố cục Trang chủ · pill · kiểu dáng vỏ. Nơi gọi định vị, nó lo hành vi.
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { Loader2, Send, X } from 'lucide-react';
import VitalsIcon from '@/components/studio/VitalsIcon';
import { useT } from '@/lib/i18n';
import { brandContextForVitals } from '@/lib/present-editor/brand-kit';
import CuaGiongNoi from '@/components/voice/CuaGiongNoi';
import type { CuaNhan } from '@/lib/voice/thi-hanh';
import type { NguCanhHienTai } from '@/lib/voice/types';

type ChatTurn = { role: 'user' | 'assistant'; content: string };

/**
 * Tấm chat Vitals — BỀ MẶT DUY NHẤT của mức Engage, dùng chung cho `VitalsPill` (Trang chủ bản
 * cũ) và `VitalsAperture` (khẩu độ mép trên, mọi màn). Tự lo hội thoại + Esc + focus; nơi gọi
 * chỉ định vị và cấp `onClose`.
 */
export function VitalsChatSurface({ onClose }: { onClose: () => void }) {
  const tr = useT();
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tấm chỉ mount khi đã mở ⇒ focus ngay lúc mount (trước là `if (open)` trong cùng component).
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  // Esc đóng — cùng quy ước bàn phím của thanh Vitals gốc.
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc); // esc-only: chỉ xử Escape đóng lớp — đúng chuẩn dialog, không cần né ô nhập
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    const next: ChatTurn[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-assist-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, stage: 'gallery', brand: brandContextForVitals() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j?.error === 'string' ? j.error : tr('Có lỗi xảy ra — thử lại.', 'Something went wrong — try again.'));
        return;
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: String(j?.reply ?? '').trim() }]);
    } catch {
      setError(tr('Mất kết nối — thử lại.', 'Connection failed — try again.'));
    } finally {
      setSending(false);
    }
  }, [input, messages, sending, tr]);

  return (
    <div
      className="w-[300px] rounded-[var(--r-3)] p-3"
      data-vitals-chat=""
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 24px 60px -20px rgba(0,0,0,0.5)' }}
    >
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[length:var(--fs-xs)] uppercase tracking-wide text-[var(--t4)]">
              <VitalsIcon size={14} style={{ color: 'var(--accent)' }} />
              Vitals
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label={tr('Đóng', 'Close')}
              className="grid h-5 w-5 place-items-center rounded-full text-[var(--t4)] hover:text-[var(--t1)]"
            >
              <X size={14} />
            </button>
          </div>

          {(messages.length > 0 || sending || error) && (
            <div ref={scrollRef} className="mb-2 max-h-40 space-y-1.5 overflow-y-auto text-[length:var(--fs-xs)]">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className="rounded-[var(--r-2)] px-2.5 py-1.5 leading-relaxed text-[var(--t1)]"
                  style={{ background: m.role === 'user' ? 'var(--accent-soft)' : 'var(--field)' }}
                >
                  {m.content}
                </div>
              ))}
              {sending && <div className="px-1 text-[var(--t4)]">{tr('Đang trả lời…', 'Replying…')}</div>}
              {error && (
                <div className="rounded-[var(--r-2)] px-2.5 py-1.5" style={{ background: 'rgba(200,64,40,0.12)', color: 'var(--t1)' }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ═══ GIỌNG NÓI — CẮM VÀO ĐÂY, KHÔNG DỰNG APP RIÊNG (22/08) ═══════════════════
              Neo ở khẩu độ Vitals theo chốt 16/08: KHÔNG nút micro thứ hai rải khắp app.
              ⭐ Điểm của cả lane: nó đứng NGAY CẠNH ô gõ chữ ở trên, và cả hai đổ về CÙNG một
              đường ý định (`giaiBanChu` → `DauVaoNguNghia` → `thiHanh`). Không nhánh
              `if (nguon === 'giong-noi')` ở bất cứ đâu — test của lane V khoá điều đó bằng
              `deepStrictEqual` giữa câu GÕ và câu NÓI.
              ⛔ Không kho thoại riêng: `ghiChu` đổ vào ĐÚNG `/api/home/notes` mà QuickNotes đang
              ghi (`QuickNotes.tsx:86`) — một nguồn sự thật, không đẻ nguồn thứ hai.
              Cửa nào host CHƯA có thì KHÔNG khai — `thiHanh()` trả `chua-co-cua` và mặt tiền nói
              thẳng, thay vì im lặng nuốt câu. */}
          <CuaGiongNoi
            nguCanh={nguCanhGiongNoi()}
            cuaNhan={CUA_NHAN_VITALS}
          />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-center gap-1.5"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={tr('Hỏi Vitals…', 'Ask Vitals…')}
              className="min-w-0 flex-1 rounded-full px-3 py-1.5 text-[length:var(--fs-xs)] text-[var(--t1)] outline-none"
              style={{ background: 'var(--field)' }}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label={tr('Gửi', 'Send')}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
    </div>
  );
}


/** Ngữ cảnh lúc nói — suy từ ĐƯỜNG ĐANG ĐỨNG, không để bộ giải tự đoán "chỗ này" là chỗ nào. */
function nguCanhGiongNoi(): NguCanhHienTai {
  const p = typeof window === 'undefined' ? '' : window.location.pathname;
  const projectId = /^\/projects\/([^/]+)/.exec(p)?.[1];
  // Khoá kỹ thuật của sổ lệnh là 'cad' | 'render' | 'present' (AppCommandPalette:154) — KHÔNG
  // phải 'concept'/'2D'. Đọc thẳng từ đường để không đẻ hệ tên chặng thứ hai.
  const stage = /\/cad(\/|$)/.test(p) ? 'cad' : /\/present/.test(p) ? 'present' : 'render';
  return { stage, ...(projectId ? { projectId } : {}) };
}

/**
 * CỬA NHẬN của host Vitals — khai ĐÚNG những cửa host này thật sự có.
 * Hiện chỉ có `ghiChu` (kho ghi chú thật, chung với QuickNotes). `soatDuyet`/`timKiem`/
 * `yDinhThietKe` CỐ Ý không khai: host này chưa có chỗ nhận, khai bừa là hứa suông rồi nuốt câu.
 * Lệnh (`cad.*`…) KHÔNG đi qua bảng này — `thiHanh()` tự tra sổ lệnh chung.
 */
/** Kênh báo hỏng của cửa nhận → dòng lỗi sẵn có trong `CuaGiongNoi` (nó nghe sự kiện này). */
export const VOICE_LOI_EVENT = 'if:voice-loi';
function bao(msg: string) {
  window.dispatchEvent(new CustomEvent(VOICE_LOI_EVENT, { detail: msg }));
}

const CUA_NHAN_VITALS: CuaNhan = {
  ghiChu: (d) => {
    const projectId = /^\/projects\/([^/]+)/.exec(window.location.pathname)?.[1];
    // 🔴 SỬA 22/08 — BẢN ĐẦU CỦA TÔI `void fetch(...)` RỒI QUÊN LUÔN. Đo trên bản đóng gói:
    // POST trả **401** mà màn KHÔNG nói gì ⇒ câu người dùng vừa nói/gõ **mất im lặng**. Đúng thứ
    // docstring của chính `CuaGiongNoi` cấm ("không nuốt câu") — nuốt còn tệ hơn báo lỗi vì người
    // dùng tưởng đã ghi xong và đi tiếp.
    void fetch('/api/home/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Ghi NGUYÊN VĂN (`banChu.van`) — luật của lane V: không sửa lỗi hộ, không viết hoa hộ.
      body: JSON.stringify({ text: d.banChu.van, ...(projectId ? { projectId } : {}) }),
    })
      .then((r) => {
        if (r.ok) return;
        // Nói ĐÚNG nguyên nhân, kèm NGUYÊN VĂN câu vừa mất để người dùng còn chép lại được.
        bao(
          r.status === 401
            ? `Chưa ghi được — phiên đăng nhập đã hết. Câu vừa nhập: “${d.banChu.van}”`
            : `Chưa ghi được ghi chú (máy chủ trả ${r.status}). Câu vừa nhập: “${d.banChu.van}”`,
        );
      })
      .catch(() => bao(`Chưa ghi được — mất kết nối. Câu vừa nhập: “${d.banChu.van}”`));
  },
};
