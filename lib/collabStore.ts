'use client';

import { create } from 'zustand';

/**
 * lib/collabStore.ts — Store RIÊNG cho collab thời-gian-thực (Canva-style).
 * KHÔNG dính lib/store.ts. KHÔNG có AI — chỉ presence + live cursor.
 *
 * Cơ chế: poll nhẹ (LAN/SQLite-friendly). Mỗi tick:
 *   - POST cursor cục bộ (đã throttle) lên /api/cursors
 *   - GET các cursor khác → setState others
 * In-memory endpoint reset khi server restart → chấp nhận được với presence.
 */

/** Danh tính người dùng hiện tại (đọc từ lib/store hoặc guest). */
export interface CollabIdentity {
  userId: string;
  name: string;
}

/** 1 cursor người khác nhận từ server. */
export interface CursorInfo {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  flowId: string;
  ts: number;
}

/** Palette 8 màu dễ chịu, tương phản tốt trên nền sáng/tối. */
const PALETTE = [
  '#8b7cf7', // tím accent
  '#f472b6', // hồng
  '#22c55e', // xanh lá
  '#f59e0b', // hổ phách
  '#38bdf8', // xanh trời
  '#fb7185', // coral
  '#a78bfa', // lavender
  '#2dd4bf', // teal
];

/** Màu ổn định theo hash userId → luôn cùng màu cho cùng người. */
export function colorForUser(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (h * 31 + userId.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(h) % PALETTE.length];
}

const POLL_MS = 900; // nhịp poll cursor (nhanh hơn chat ~3s)

interface CollabState {
  others: CursorInfo[];
  /** danh tính local (kèm màu) — để PresenceBar hiện cả mình */
  meColor: string;
  meName: string;
  meId: string;
  flowId: string | null;
  /** toạ độ cursor cục bộ trong FLOW SPACE, cập nhật qua onPointerMove */
  localX: number;
  localY: number;

  start: (flowId: string, me: CollabIdentity) => void;
  stop: () => void;
  setLocalCursor: (x: number, y: number) => void;
}

// Trạng thái ngoài store (không cần re-render): timer + throttle guard.
let pollTimer: ReturnType<typeof setInterval> | null = null;
let inFlight = false;

export const useCollabStore = create<CollabState>((set, get) => ({
  others: [],
  meColor: '#8b7cf7',
  meName: '',
  meId: '',
  flowId: null,
  localX: 0,
  localY: 0,

  setLocalCursor: (x, y) => set({ localX: x, localY: y }),

  start: (flowId, me) => {
    // SSR guard — chỉ chạy trong trình duyệt.
    if (typeof window === 'undefined') return;
    // dọn loop cũ nếu có (đổi flow / re-mount)
    get().stop();

    set({
      flowId,
      meId: me.userId,
      meName: me.name,
      meColor: colorForUser(me.userId),
      others: [],
    });

    const tick = async () => {
      const s = get();
      if (!s.flowId || inFlight) return;
      inFlight = true;
      try {
        // POST cursor cục bộ
        await fetch('/api/cursors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: s.meId,
            name: s.meName,
            color: s.meColor,
            x: s.localX,
            y: s.localY,
            flowId: s.flowId,
          }),
        }).catch(() => {});

        // GET người khác (loại mình)
        const res = await fetch(
          `/api/cursors?flowId=${encodeURIComponent(s.flowId)}&me=${encodeURIComponent(s.meId)}`,
        );
        if (res.ok) {
          const data = (await res.json()) as { cursors?: CursorInfo[] };
          set({ others: Array.isArray(data.cursors) ? data.cursors : [] });
        }
      } catch {
        // im lặng — mất 1 tick không sao
      } finally {
        inFlight = false;
      }
    };

    // chạy ngay 1 nhịp rồi vào loop
    void tick();
    pollTimer = setInterval(tick, POLL_MS);
  },

  stop: () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    inFlight = false;
    set({ others: [], flowId: null });
  },
}));
