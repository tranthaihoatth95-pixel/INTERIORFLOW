/**
 * lib/present-editor/play-status.ts — cờ "đang Trình chiếu" DÙNG CHUNG (VIỆC A, 28/07).
 *
 * Trước đây `playing` là `useState` riêng trong `PresentEditor.tsx` — StatusBar (mount ở
 * `PresentStageScreen.tsx`, ngoài `PresentEditor`) không biết được để tự ẩn khi trình chiếu
 * toàn màn hình (`SlidePlayer`). Nâng lên store dùng chung, thay 1-1 cho `useState` cũ —
 * mọi lời gọi `setPlaying(...)` trong `PresentEditor.tsx` giữ nguyên cú pháp.
 */

import { create } from 'zustand';

interface PlayStatusState {
  playing: boolean;
  setPlaying: (v: boolean) => void;
}

export const usePlayStatus = create<PlayStatusState>((set) => ({
  playing: false,
  setPlaying: (playing) => set({ playing }),
}));
