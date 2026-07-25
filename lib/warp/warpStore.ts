'use client';

import { create } from 'zustand';

/** Store riêng cho modal kéo 4 góc phối cảnh (`util.warp`) — cùng seam với sketchStore. */
interface WarpState {
  openNodeId: string | null;
  open: (nodeId: string) => void;
  close: () => void;
}

export const useWarpStore = create<WarpState>((set) => ({
  openNodeId: null,
  open: (nodeId) => set({ openNodeId: nodeId }),
  close: () => set({ openNodeId: null }),
}));
