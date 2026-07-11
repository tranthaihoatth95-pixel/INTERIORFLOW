'use client';

import { useFlowStore } from '@/lib/store';

/**
 * Handoff CAD → Render: node tạo trực tiếp trên /cad-editor sẽ bị wipe khi về '/'
 * (hydrate() đọc localStorage rồi bootstrapWorkspace()/openFlow() loadGraph đè nodes).
 * → Stash ảnh vào sessionStorage, CONSUME sau khi graph đã nạp xong.
 */
const KEY = 'interiorflow.cadHandoff';

export function stashCadHandoff(dataUrl: string): boolean {
  try {
    sessionStorage.setItem(KEY, dataUrl);
    return true;
  } catch {
    // quota/chặn — báo fail để caller fallback addNode trực tiếp
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
    return;
  }
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
