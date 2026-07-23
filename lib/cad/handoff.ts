'use client';

import { useFlowStore } from '@/lib/store';
import type { CadRole } from './store';

/**
 * Handoff CAD → Render: node tạo trực tiếp trên /cad-editor sẽ bị wipe khi về '/'
 * (hydrate() đọc localStorage rồi bootstrapWorkspace()/openFlow() loadGraph đè nodes).
 * → Stash ảnh vào sessionStorage, CONSUME sau khi graph đã nạp xong.
 *
 * IF2-nền (23/07) — payload nay là OBJECT có `version` + `snapshot` (đóng băng nội dung Doc ở
 * thời điểm bàn giao, chống mất dữ liệu khi hoạ viên/BIM sửa parallel — xem IF1_IF2_BIGPICTURE.md
 * §2). PAYLOAD CŨ (chuỗi dataURL trần) VẪN PARSE ĐƯỢC: hàm consume tự nhận diện shape và bọc
 * lại thành `{version:1, dataUrl, snapshot:null, ...}` — không breaking file/session cũ.
 */

const KEY = 'interiorflow.cadHandoff';

/**
 * Payload bàn giao — thêm `version` (auto-increment mỗi lần stash) + `snapshot` (Doc dạng JSON
 * đóng băng, optional để giữ nhẹ khi caller không cần). `dataUrl` là ảnh preview như cũ.
 * `fromRole`/`toRole` phục vụ audit log về sau (IF2-B/C). `timestamp` = Date.now() ms.
 */
export interface CadHandoffPayload {
  version: number;
  dataUrl: string;
  /** Doc snapshot ở dạng chuỗi JSON đã stringify (nhẹ hơn giữ object sống, an toàn qua storage). */
  snapshot: string | null;
  timestamp: number;
  fromRole: CadRole | null;
  toRole: CadRole | null;
}

/** Version counter — auto-increment mỗi lần stash mới, sống module-level qua điều hướng SPA. */
let versionCounter = 0;

/**
 * B1: fallback bộ nhớ khi sessionStorage hỏng (quota/chặn). Biến module-level là singleton
 * sống qua điều hướng client (SPA), nên applyCadHandoff() vẫn consume được SAU bootstrap —
 * thay vì addNode ngay trên /cad-editor (bị loadGraph đè khi '/' hydrate → mất node).
 */
let memHandoff: CadHandoffPayload | null = null;

export interface StashOptions {
  /** Doc snapshot đã stringify — pass qua để đóng băng dữ liệu chống mất khi sửa parallel. */
  snapshot?: string | null;
  fromRole?: CadRole | null;
  toRole?: CadRole | null;
}

/** Stash payload bàn giao. Nhận string (backward-compat: chỉ dataURL) hoặc options mở rộng. */
export function stashCadHandoff(dataUrl: string, opts?: StashOptions): boolean {
  versionCounter += 1;
  const payload: CadHandoffPayload = {
    version: versionCounter,
    dataUrl,
    snapshot: opts?.snapshot ?? null,
    timestamp: Date.now(),
    fromRole: opts?.fromRole ?? null,
    toRole: opts?.toRole ?? null,
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payload));
    memHandoff = null; // ưu tiên sessionStorage; dọn fallback cũ nếu có
    return true;
  } catch {
    // quota/chặn — giữ ở bộ nhớ để applyCadHandoff consume SAU bootstrap (KHÔNG addNode ngay)
    memHandoff = payload;
    return false;
  }
}

/**
 * Đọc raw string đã stash ra `CadHandoffPayload`. Tự nhận diện shape cũ (chuỗi dataURL trần,
 * KHÔNG phải JSON hoặc JSON nhưng thiếu field `version`) → bọc lại thành payload version 0
 * (giữ đúng dữ liệu, không lỗi). Trả null nếu raw rỗng/không hợp lệ.
 */
function normalizePayload(raw: string | null): CadHandoffPayload | null {
  if (!raw) return null;
  // Legacy: raw là dataURL trần (bắt đầu 'data:'). Bọc lại với version 0.
  if (raw.startsWith('data:')) {
    return { version: 0, dataUrl: raw, snapshot: null, timestamp: 0, fromRole: null, toRole: null };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<CadHandoffPayload>;
    if (typeof parsed.dataUrl !== 'string') return null;
    return {
      version: typeof parsed.version === 'number' ? parsed.version : 0,
      dataUrl: parsed.dataUrl,
      snapshot: typeof parsed.snapshot === 'string' ? parsed.snapshot : null,
      timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : 0,
      fromRole: (parsed.fromRole as CadRole | null) ?? null,
      toRole: (parsed.toRole as CadRole | null) ?? null,
    };
  } catch {
    return null;
  }
}

/** Gọi SAU bootstrapWorkspace()/openFlow() — tạo node Import Image từ bản vẽ đã stash. */
export function applyCadHandoff(): void {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(KEY);
    if (raw) sessionStorage.removeItem(KEY);
  } catch {
    raw = null;
  }
  let payload = normalizePayload(raw);
  // Fallback bộ nhớ (B1): consume một lần, dọn ngay để tránh double-consume.
  if (!payload && memHandoff) payload = memHandoff;
  memHandoff = null;
  if (!payload) return;
  const store = useFlowStore.getState();
  try {
    store.setWorkspace('render');
  } catch {
    /* ignore */
  }
  store.addNode('input.image', { x: 220, y: 180 });
  const node = useFlowStore.getState().nodes.at(-1);
  if (node) store.updateParam(node.id, 'file', payload.dataUrl);
}

/** Test/dev: đọc payload đã stash mà không consume (để test parse backward-compat). */
export function peekCadHandoffPayload(): CadHandoffPayload | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return normalizePayload(raw);
  } catch {
    /* ignore */
  }
  return memHandoff;
}

/** Test-only helper — reset version counter + mem fallback (KHÔNG dùng trong app code). */
export function __resetCadHandoffForTest(): void {
  versionCounter = 0;
  memHandoff = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
