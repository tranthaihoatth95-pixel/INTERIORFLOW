'use client';

/**
 * components/CommentLayer.tsx — Lớp GÓP Ý đè lên app.
 *
 * User bật nút "Góp ý" → bấm vào bất kỳ chỗ nào trên giao diện (app hoặc chặng Present)
 * → gõ comment → lưu. Mỗi góp ý ghim tại vị trí bấm (theo % viewport) + kèm ngữ cảnh
 * (route/chặng + phần tử dưới con trỏ). Lưu qua /api/comments (file JSON) để Claude đọc
 * lại rồi sửa. Ghim chỉ hiện cho route đang xem. Tắt nút thì lớp trong suốt (không cản app).
 */

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pressable, springNode, prefersReducedMotion } from '@/lib/motion';

interface Comment {
  id: string;
  text: string;
  x: number;
  y: number;
  route: string;
  stage?: string;
  elementHint?: string;
  image?: string;
  resolved?: boolean;
  ts: number;
}

const ACCENT = '#e0603a'; // coral — nổi trên mọi nền

export function CommentLayer() {
  const [mounted, setMounted] = useState(false);
  const [on, setOn] = useState(false); // chế độ góp ý
  const [comments, setComments] = useState<Comment[]>([]);
  const [route, setRoute] = useState('/');
  const [draft, setDraft] = useState<{ x: number; y: number; hint: string; text: string; image?: string } | null>(null);
  const [listOpen, setListOpen] = useState(false);

  /** File ảnh → data URL để đính kèm góp ý. */
  function fileToDataUrl(f: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(r.error);
      r.readAsDataURL(f);
    });
  }
  async function attachFrom(files: FileList | File[] | null | undefined) {
    const f = files && files[0];
    if (!f || !f.type.startsWith('image/') || !draft) return;
    setDraft({ ...draft, image: await fileToDataUrl(f) });
  }

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/comments');
      const d = await r.json();
      setComments(d.comments ?? []);
    } catch {
      /* bỏ qua */
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setRoute(window.location.pathname);
    load();
  }, [load]);

  function currentStage(): string {
    if (route.includes('present-editor')) return 'present';
    if (route.includes('photo-editor')) return 'photo';
    try {
      return localStorage.getItem('interiorflow.workspace') || 'app';
    } catch {
      return 'app';
    }
  }

  // Mở soạn thảo góp ý tại 1 điểm màn hình (lấy phần tử THẬT của app dưới điểm đó).
  const startDraftAt = useCallback((clientX: number, clientY: number) => {
    const xPct = (clientX / window.innerWidth) * 100;
    const yPct = (clientY / window.innerHeight) * 100;
    const el = document.elementFromPoint(clientX, clientY);
    const hint = el
      ? `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''} · "${(el.textContent || '').trim().slice(0, 40)}"`
      : '';
    setDraft({ x: xPct, y: yPct, hint, text: '' });
  }, []);

  // Chế độ góp ý: giữ ⌥ Option (Alt) + bấm → góp ý. Click THƯỜNG vẫn tới app → anh mở
  // được menu/panel/dropdown đang che chỗ cần góp ý, rồi ⌥+bấm vào đúng chỗ đó.
  useEffect(() => {
    if (!on) return;
    const h = (e: MouseEvent) => {
      if (!e.altKey || draft) return;
      e.preventDefault();
      e.stopPropagation();
      startDraftAt(e.clientX, e.clientY);
    };
    window.addEventListener('click', h, true); // capture: app không nhận ⌥+click
    return () => window.removeEventListener('click', h, true);
  }, [on, draft, startDraftAt]);

  async function save() {
    if (!draft || !draft.text.trim()) return;
    const payload = {
      text: draft.text.trim(),
      x: draft.x,
      y: draft.y,
      route,
      stage: currentStage(),
      elementHint: draft.hint,
      image: draft.image,
    };
    setDraft(null);
    try {
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await load();
    } catch {
      /* bỏ qua */
    }
  }

  async function del(id: string) {
    setComments((c) => c.filter((x) => x.id !== id));
    try {
      await fetch(`/api/comments?id=${id}`, { method: 'DELETE' });
    } catch {
      /* bỏ qua */
    }
  }

  // Bật/tắt trạng thái "đã xử lý" của 1 góp ý (optimistic + lưu qua PATCH).
  async function resolve(id: string, next: boolean) {
    setComments((c) => c.map((x) => (x.id === id ? { ...x, resolved: next } : x)));
    try {
      await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, resolved: next }),
      });
    } catch {
      /* bỏ qua */
    }
  }

  if (!mounted) return null;

  const reduce = prefersReducedMotion();
  const here = comments.filter((c) => c.route === route);
  const openCount = comments.filter((c) => !c.resolved).length;
  const doneCount = comments.length - openCount;
  // Chưa xử lý lên trên, đã xử lý xuống cuối (sort ổn định → giữ thứ tự trong từng nhóm).
  const sorted = [...comments].sort((a, b) => Number(!!a.resolved) - Number(!!b.resolved));

  return (
    <>
      {/* Viền nhắc đang ở chế độ góp ý — KHÔNG chặn chuột (app vẫn dùng bình thường) */}
      {on && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99990,
            pointerEvents: 'none',
            boxShadow: `inset 0 0 0 2px ${ACCENT}`,
          }}
        />
      )}

      {/* Nhắc thao tác khi bật chế độ góp ý */}
      {on && !draft && (
        <div
          style={{
            position: 'fixed',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99996,
            background: ACCENT,
            color: '#fff',
            fontSize: 12.5,
            fontWeight: 600,
            padding: '7px 14px',
            borderRadius: 999,
            boxShadow: '0 4px 14px rgba(0,0,0,.25)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Giữ ⌥ Option + bấm vào chỗ cần góp ý · app vẫn dùng bình thường
        </div>
      )}

      {/* Ghim các góp ý ở route hiện tại */}
      {here.map((c, i) => (
        <div
          key={c.id}
          title={c.text}
          style={{
            position: 'fixed',
            left: `${c.x}%`,
            top: `${c.y}%`,
            transform: 'translate(-50%, -100%)',
            zIndex: 99992,
            pointerEvents: 'none',
          }}
        >
          <div style={c.resolved ? pinStyleResolved : pinStyle}><span style={{ transform: 'rotate(45deg)' }}>{c.resolved ? '✓' : i + 1}</span></div>
        </div>
      ))}

      {/* Hộp soạn góp ý */}
      {draft && (
        <div
          style={{
            position: 'fixed',
            left: `${Math.min(draft.x, 80)}%`,
            top: `${Math.min(draft.y, 82)}%`,
            zIndex: 99995,
            width: 280,
            background: '#fff',
            color: '#1a1a1a',
            borderRadius: 12,
            boxShadow: '0 10px 40px rgba(0,0,0,.28)',
            border: `1.5px solid ${ACCENT}`,
            padding: 12,
            pointerEvents: 'auto',
          }}
        >
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
            Góp ý tại: {draft.hint || 'vị trí này'}
          </div>
          <textarea
            autoFocus
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            onPaste={(e) => {
              const it = [...e.clipboardData.items].find((x) => x.type.startsWith('image/'));
              if (it) { e.preventDefault(); attachFrom([it.getAsFile()!]); }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
              if (e.key === 'Escape') setDraft(null);
            }}
            placeholder="Anh góp ý gì ở đây… (dán ảnh ⌘V để đính kèm · ⌘/Ctrl+Enter lưu)"
            rows={3}
            style={{
              width: '100%',
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 8,
              fontSize: 13,
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />

          {/* Ảnh minh hoạ đính kèm */}
          {draft.image ? (
            <div style={{ position: 'relative', marginTop: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={draft.image} alt="minh hoạ" style={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 8, border: '1px solid #eee', background: '#fafafa' }} />
              <button
                onClick={() => setDraft({ ...draft, image: undefined })}
                style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, border: 'none', background: 'rgba(0,0,0,.6)', color: '#fff', cursor: 'pointer', fontSize: 13 }}
              >×</button>
            </div>
          ) : (
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); attachFrom(e.dataTransfer.files); }}
              style={{ display: 'block', marginTop: 8, padding: '10px', border: '1.5px dashed #ddd', borderRadius: 8, textAlign: 'center', fontSize: 11.5, color: '#999', cursor: 'pointer' }}
            >
              📎 Dán · kéo-thả · hoặc bấm chọn ảnh minh hoạ
              <input type="file" accept="image/*" hidden onChange={(e) => attachFrom(e.target.files)} />
            </label>
          )}

          <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setDraft(null)} style={btnGhost}>Huỷ</button>
            <button onClick={save} style={{ ...btnSolid, background: ACCENT }}>Lưu góp ý</button>
          </div>
        </div>
      )}

      {/* Bảng liệt kê góp ý */}
      {listOpen && (
        <div
          style={{
            position: 'fixed',
            right: 16,
            bottom: 64,
            zIndex: 99994,
            width: 320,
            maxHeight: '60vh',
            overflowY: 'auto',
            background: '#fff',
            color: '#1a1a1a',
            borderRadius: 14,
            boxShadow: '0 10px 40px rgba(0,0,0,.28)',
            border: '1px solid #eee',
            padding: 12,
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <b style={{ fontSize: 13 }}>
              Góp ý ({openCount} chưa xử lý{doneCount > 0 ? ` · ${doneCount} đã xử lý` : ''})
            </b>
            <button onClick={() => setListOpen(false)} style={btnGhost}>Đóng</button>
          </div>
          {comments.length === 0 && <p style={{ fontSize: 12, color: '#999' }}>Chưa có góp ý.</p>}
          <AnimatePresence initial={false}>
            {sorted.map((c) => (
              <motion.div
                key={c.id}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: c.resolved ? 0.5 : 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                transition={reduce ? { duration: 0 } : springNode}
                style={{ borderTop: '1px solid #f0f0f0', padding: '8px 0', fontSize: 12.5, overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: c.resolved ? '#8a8f98' : ACCENT, fontWeight: 700 }}>
                    #{comments.filter((x) => x.route === c.route).indexOf(c) + 1} · {c.stage}
                    {c.resolved && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: '#22a06b' }}>✓ Đã xử lý</span>}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <motion.button
                      {...pressable}
                      onClick={() => resolve(c.id, !c.resolved)}
                      style={{ ...btnGhost, fontSize: 11, color: c.resolved ? '#888' : '#22a06b', borderColor: c.resolved ? '#ddd' : '#bfe6d2' }}
                    >
                      {c.resolved ? '↩︎ Mở lại' : '✓ Đã xử lý'}
                    </motion.button>
                    <motion.button {...pressable} onClick={() => del(c.id)} style={{ ...btnGhost, color: '#c00', fontSize: 11 }}>Xoá</motion.button>
                  </div>
                </div>
                <div style={{ margin: '2px 0', textDecoration: c.resolved ? 'line-through' : 'none' }}>{c.text}</div>
                {c.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="minh hoạ" style={{ width: '100%', maxHeight: 120, objectFit: 'contain', borderRadius: 6, border: '1px solid #eee', margin: '4px 0', background: '#fafafa' }} />
                )}
                <div style={{ fontSize: 10, color: '#aaa' }}>{c.route} · {c.elementHint}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Nút bật/tắt + xem danh sách */}
      <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 99996, display: 'flex', gap: 8, pointerEvents: 'auto' }}>
        {comments.length > 0 && (
          <button onClick={() => setListOpen((v) => !v)} style={{ ...pillBtn, background: '#333' }}>
            💬 {comments.length}
          </button>
        )}
        <button
          onClick={() => { setOn((v) => !v); setDraft(null); }}
          style={{ ...pillBtn, background: on ? ACCENT : '#333' }}
          title="Bật/tắt chế độ góp ý — bấm vào chỗ muốn góp ý"
        >
          {on ? '● Đang góp ý (⌥+bấm)' : '✎ Góp ý'}
        </button>
      </div>
    </>
  );
}

const pinStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: '50% 50% 50% 0',
  transform: 'rotate(-45deg)',
  background: ACCENT,
  color: '#fff',
  display: 'grid',
  placeItems: 'center',
  fontSize: 12,
  fontWeight: 700,
  boxShadow: '0 2px 8px rgba(0,0,0,.3)',
  border: '2px solid #fff',
};
// Ghim của góp ý đã xử lý: xám mờ để phân biệt với ghim chưa xử lý (coral).
const pinStyleResolved: React.CSSProperties = {
  ...pinStyle,
  background: '#9aa0a6',
  opacity: 0.6,
};
const pillBtn: React.CSSProperties = {
  border: 'none',
  color: '#fff',
  borderRadius: 999,
  padding: '9px 14px',
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(0,0,0,.25)',
};

const btnGhost: React.CSSProperties = {
  border: '1px solid #ddd',
  background: '#fff',
  color: '#555',
  borderRadius: 8,
  padding: '5px 10px',
  fontSize: 12,
  cursor: 'pointer',
};

const btnSolid: React.CSSProperties = {
  border: 'none',
  color: '#fff',
  borderRadius: 8,
  padding: '5px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};
