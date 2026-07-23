'use client';

/**
 * lib/cad/present-handoff.ts — Handoff CAD → Present ("Đưa sang Present").
 *
 * SONG SONG với CAD→Render (lib/cad/handoff.ts) — KHÔNG thay thế, không đụng nút/luồng đó.
 * CÙNG PATTERN sessionStorage + fallback module-singleton như lib/cad/handoff.ts (CAD→Render) và
 * lib/present-editor/handoff.ts (Render→Present): '/cad-editor' và '/present-editor' là 2 route
 * khác nhau, router.push điều hướng SPA nhưng state cục bộ của route cũ không mang theo được →
 * phải stash rồi consume SAU khi route đích mount xong.
 *
 * IF2-nền (23/07) — payload nay là OBJECT có `version` + `snapshot` giống CAD→Render, để đóng
 * băng dữ liệu ở thời điểm bàn giao (xem IF1_IF2_BIGPICTURE.md §2). Payload cũ (chuỗi dataURL
 * trần) VẪN parse được — hàm consume tự nhận diện shape.
 *
 * CONSUME-ONCE: đọc xong dọn cả 2 nguồn ngay → không double-insert khi PresentEditor remount.
 * Không có handoff ⇒ consume trả null ⇒ /present-editor y hệt trước (không phá luồng cũ).
 */

import type { CadRole } from './store';

const KEY = 'interiorflow.cadPresentHandoff';

export interface CadPresentHandoffPayload {
  version: number;
  dataUrl: string;
  snapshot: string | null;
  timestamp: number;
  fromRole: CadRole | null;
  toRole: CadRole | null;
}

let versionCounter = 0;

/** Fallback bộ nhớ khi sessionStorage hỏng/chặn (pattern B1 của lib/cad/handoff.ts). */
let memHandoff: CadPresentHandoffPayload | null = null;

export interface PresentStashOptions {
  snapshot?: string | null;
  fromRole?: CadRole | null;
  toRole?: CadRole | null;
}

/** Stash 1 ảnh snapshot bản vẽ CAD (dataURL). Trả true nếu vào được sessionStorage (false = dùng mem). */
export function stashCadPresentHandoff(dataUrl: string, opts?: PresentStashOptions): boolean {
  versionCounter += 1;
  const payload: CadPresentHandoffPayload = {
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
    memHandoff = payload; // quota/chặn — giữ bộ nhớ, consume vẫn nhận được sau điều hướng SPA
    return false;
  }
}

/** Tự nhận diện shape: dataURL trần (legacy) → wrap version 0; JSON payload mới → parse thẳng. */
function normalizePayload(raw: string | null): CadPresentHandoffPayload | null {
  if (!raw) return null;
  if (raw.startsWith('data:')) {
    return { version: 0, dataUrl: raw, snapshot: null, timestamp: 0, fromRole: null, toRole: null };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<CadPresentHandoffPayload>;
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

/**
 * Consume-ONCE: trả ảnh đã stash (hoặc null) rồi dọn cả 2 nguồn. Không có gì → null.
 * TRẢ CHUỖI dataURL (KHÔNG phải object) để giữ backward-compat với caller cũ trong PresentEditor
 * — caller nào cần payload đầy đủ dùng `consumeCadPresentHandoffPayload()` bên dưới.
 */
export function consumeCadPresentHandoff(): string | null {
  const p = consumeCadPresentHandoffPayload();
  return p ? p.dataUrl : null;
}

/** Consume-ONCE — trả payload đầy đủ (version/snapshot/timestamp/roles). */
export function consumeCadPresentHandoffPayload(): CadPresentHandoffPayload | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(KEY);
    if (raw) sessionStorage.removeItem(KEY);
  } catch {
    raw = null;
  }
  let payload = normalizePayload(raw);
  if (!payload && memHandoff) payload = memHandoff;
  memHandoff = null; // dọn ngay — tránh double-consume
  return payload;
}

/** Test-only helper — reset version counter + mem fallback. */
export function __resetCadPresentHandoffForTest(): void {
  versionCounter = 0;
  memHandoff = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
