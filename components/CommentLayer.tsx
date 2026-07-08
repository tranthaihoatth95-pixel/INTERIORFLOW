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

interface Comment {
  id: string;
  text: string;
  x: number;
  y: number;
  route: string;
  stage?: string;
  elementHint?: string;
  ts: number;
}

const ACCENT = '#e0603a'; // coral — nổi trên mọi nền

export function CommentLayer() {
  const [mounted, setMounted] = useState(false);
  const [on, setOn] = useState(false); // chế độ góp ý
  const [comments, setComments] = useState<Comment[]>([]);
  const [route, setRoute] = useState('/');
  const [draft, setDraft] = useState<{ x: number; y: number; hint: string; text: string } | null>(null);
  const [listOpen, setListOpen] = useState(false);

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

  // Bấm lên overlay khi đang ở chế độ góp ý → mở soạn thảo tại điểm bấm.
  function onOverlayClick(e: React.MouseEvent) {
    if (!on || draft) return;
    const xPct = (e.clientX / window.innerWidth) * 100;
    const yPct = (e.clientY / window.innerHeight) * 100;
    // phần tử thật dưới điểm bấm (tạm ẩn overlay để lấy)
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const hint = el
      ? `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''} · "${(el.textContent || '').trim().slice(0, 40)}"`
      : '';
    setDraft({ x: xPct, y: yPct, hint, text: '' });
  }

  async function save() {
    if (!draft || !draft.text.trim()) return;
    const payload = {
      text: draft.text.trim(),
      x: draft.x,
      y: draft.y,
      route,
      stage: currentStage(),
      elementHint: draft.hint,
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

  if (!mounted) return null;

  const here = comments.filter((c) => c.route === route);

  return (
    <>
      {/* Overlay bắt click — chỉ "ăn" chuột khi bật chế độ góp ý */}
      <div
        onClick={onOverlayClick}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99990,
          cursor: on ? 'crosshair' : 'default',
          pointerEvents: on && !draft ? 'auto' : 'none',
          background: on ? 'rgba(224,96,58,0.04)' : 'transparent',
        }}
      />

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
            pointerEvents: 'auto',
          }}
        >
          <div style={pinStyle}><span style={{ transform: 'rotate(45deg)' }}>{i + 1}</span></div>
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
              if (e.key === 'Escape') setDraft(null);
            }}
            placeholder="Anh góp ý gì ở đây… (⌘/Ctrl+Enter để lưu)"
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
            <b style={{ fontSize: 13 }}>Góp ý ({comments.length})</b>
            <button onClick={() => setListOpen(false)} style={btnGhost}>Đóng</button>
          </div>
          {comments.length === 0 && <p style={{ fontSize: 12, color: '#999' }}>Chưa có góp ý.</p>}
          {comments.map((c, i) => (
            <div key={c.id} style={{ borderTop: '1px solid #f0f0f0', padding: '8px 0', fontSize: 12.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: ACCENT, fontWeight: 700 }}>
                  #{comments.filter((x) => x.route === c.route).indexOf(c) + 1} · {c.stage}
                </span>
                <button onClick={() => del(c.id)} style={{ ...btnGhost, color: '#c00', fontSize: 11 }}>Xoá</button>
              </div>
              <div style={{ margin: '2px 0' }}>{c.text}</div>
              <div style={{ fontSize: 10, color: '#aaa' }}>{c.route} · {c.elementHint}</div>
            </div>
          ))}
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
          {on ? '● Đang góp ý — bấm vào chỗ cần' : '✎ Góp ý'}
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
