/**
 * lib/project-presence-ui.ts — B4 (mã `4.1.d`, bổ sung ④): cầu nối UI cho `watchProjectPresence()`
 * (`lib/disk-sync.ts`, BroadcastChannel THUẦN, không phải React). CAD/Present ghi vào đây khi phát
 * hiện tab khác đang mở CÙNG dự án — StatusBar đọc để hiện banner cảnh báo. CHỈ cảnh báo, không
 * khoá/gộp gì (đúng phạm vi B4 đã chốt).
 */

import { create } from 'zustand';

interface ProjectPresenceUiState {
  otherTabOpen: boolean;
  setOtherTabOpen: (v: boolean) => void;
}

export const useProjectPresence = create<ProjectPresenceUiState>((set) => ({
  otherTabOpen: false,
  setOtherTabOpen: (otherTabOpen) => set({ otherTabOpen }),
}));
