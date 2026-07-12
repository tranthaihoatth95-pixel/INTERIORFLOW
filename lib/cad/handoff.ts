'use client';

import { useFlowStore } from '@/lib/store';

/**
 * Handoff CAD → Render: node tạo trực tiếp trên /cad-editor sẽ bị wipe khi về '/'
 * (hydrate() đọc localStorage rồi bootstrapWorkspace()/openFlow() loadGraph đè nodes).
 * → Stash ảnh vào sessionStorage, CONSUME sau khi graph đã nạp xong.
 */
const KEY = 'interiorflow.cadHandoff';

/**
 * B1: fallback bộ nhớ khi sessionStorage hỏng (quota/chặn). Biến module-level là singleton
 * sống qua điều hướng client (SPA), nên applyCadHandoff() vẫn consume được SAU bootstrap —
 * thay vì addNode ngay trên /cad-editor (bị loadGraph đè khi '/' hydrate → mất node).
 */
let memHandoff: string | null = null;

export function stashCadHandoff(dataUrl: string): boolean {
  try {
    sessionStorage.setItem(KEY, dataUrl);
    memHandoff = null; // ưu tiên sessionStorage; dọn fallback cũ nếu có
    return true;
  } catch {
    // quota/chặn — giữ ở bộ nhớ để applyCadHandoff consume SAU bootstrap (KHÔNG addNode ngay)
    memHandoff = dataUrl;
    return false;
  }
}

/** Gọi SAU bootstrapWorkspace()/openFlow() — tạo node Import Image từ bản vẽ đã stash. */
export function applyCadHandoff(): void {
  let dataUrl: string | null = null;
  try {
    dataUrl = sessionStorage.getItem(KEY);
    if (dataUrl) sessionStorage.removeItem(KEY);
  } catch {
    // sessionStorage hỏng lúc đọc — vẫn thử fallback bộ nhớ bên dưới.
    dataUrl = null;
  }
  // Fallback bộ nhớ (B1): consume một lần, dọn ngay để tránh double-consume.
  if (!dataUrl && memHandoff) dataUrl = memHandoff;
  memHandoff = null;
  if (!dataUrl) return;
  const store = useFlowStore.getState();
  try {
    store.setWorkspace('render');
  } catch {
    /* ignore */
  }
  store.addNode('input.image', { x: 220, y: 180 });
  const node = useFlowStore.getState().nodes.at(-1);
  if (node) store.updateParam(node.id, 'file', dataUrl);
}
