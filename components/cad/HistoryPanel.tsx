'use client';

/**
 * components/cad/HistoryPanel.tsx — T4 (Sprint ĐỔ NỀN 2): panel hiển thị lịch sử Undo/Redo của
 * CHẶNG CAD (lib/cad/store.ts — past/future, MAX_HISTORY=50). Cơ chế undo/redo BẢN THÂN đã đúng
 * sẵn từ trước — panel này CHỈ THÊM lớp hiển thị + click 1 dòng để nhảy tới đúng bước đó (gọi
 * lại undo()/redo() nhiều lần, KHÔNG có action "jump" riêng trong store — store không cần đổi).
 *
 * ⚠️ Lưu ý phạm vi: có 1 mục "Lịch sử / Phiên bản" khác đang `soon: true` trong
 * components/LeftRail.tsx — mục ĐÓ thuộc rail của chặng Rendering/Flow (mount trong
 * components/home/HomeScreen.tsx, dùng useFlowStore ở lib/store.ts, có HistoryEntry riêng cho
 * nodes/edges của flow). Đó là lịch sử của MỘT CHẶNG KHÁC, không liên quan doc CAD — cố tình
 * KHÔNG đụng vào, tránh nối nhầm nút ở màn Rendering vào state CAD hoàn toàn khác store.
 *
 * Doc snapshot không lưu kèm TÊN thao tác (snapshot() trong store.ts chỉ push clone(doc)) nên
 * mỗi dòng chỉ hiện "Bước n" + số đối tượng tại bước đó — đủ để định vị, không thêm field mới
 * vào store (giữ tối thiểu, tránh phá cấu trúc Doc đang có).
 */

import { History, X } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';

export default function HistoryPanel({ onClose }: { onClose: () => void }) {
  const past = useCadStore((s) => s.past);
  const future = useCadStore((s) => s.future);
  const doc = useCadStore((s) => s.doc);

  const jumpBack = (steps: number) => {
    for (let i = 0; i < steps; i++) useCadStore.getState().undo();
  };
  const jumpForward = (steps: number) => {
    for (let i = 0; i < steps; i++) useCadStore.getState().redo();
  };

  const currentIndex = past.length; // vị trí "hiện tại" trong dãy oldest→newest
  const total = past.length + 1 + future.length;

  type Row = { key: string; step: number; count: number; current: boolean; onJump?: () => void };
  const rows: Row[] = [];
  past.forEach((d, i) => {
    const stepsBack = past.length - i;
    rows.push({ key: `p${i}`, step: i + 1, count: d.entities.length, current: false, onJump: () => jumpBack(stepsBack) });
  });
  rows.push({ key: 'now', step: currentIndex + 1, count: doc.entities.length, current: true });
  future.forEach((d, i) => {
    rows.push({ key: `f${i}`, step: currentIndex + 2 + i, count: d.entities.length, current: false, onJump: () => jumpForward(i + 1) });
  });

  return (
    <div style={{ ...panel, left: 12, top: 70, width: 260, maxHeight: 'calc(100% - 130px)', display: 'flex', flexDirection: 'column' }}>
      <div style={panelHead}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <History size={14} /> Lịch sử · History
        </span>
        <button type="button" onClick={onClose} style={miniBtn} title="Đóng">
          <X size={14} />
        </button>
      </div>

      <div style={{ fontSize: 10.5, color: 'var(--t4)', padding: '0 6px 8px' }}>
        {total} bước · click 1 dòng để nhảy tới đó (Undo/Redo lặp lại).
      </div>

      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {rows.map((r) => (
          <div
            key={r.key}
            onClick={r.onJump}
            title={r.current ? 'Bước hiện tại' : 'Click để Undo/Redo tới bước này'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              margin: '0 2px 2px',
              borderRadius: 6,
              cursor: r.current ? 'default' : 'pointer',
              background: r.current ? 'var(--accent-soft, rgba(139,124,247,.14))' : 'transparent',
              border: r.current ? '1px solid var(--accent-ring, rgba(139,124,247,.5))' : '1px solid transparent',
            }}
          >
            <span style={{ fontSize: 11.5, color: r.current ? 'var(--accent)' : 'var(--t2)', fontWeight: r.current ? 650 : 500 }}>
              Bước {r.step}{r.current ? ' — hiện tại' : ''}
            </span>
            <span style={{ fontSize: 10, color: 'var(--t4)' }}>{r.count} đối tượng</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* styles — cùng ngôn ngữ panel của CadEditor (const nội bộ file đó, không export — chép tối thiểu) */
const panel: React.CSSProperties = {
  position: 'absolute',
  zIndex: 15,
  background: 'color-mix(in srgb, var(--panel) 82%, transparent)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border)',
  borderRadius: 14,
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
