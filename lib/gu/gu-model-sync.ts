/**
 * lib/gu/gu-model-sync.ts — cầu nối PairwisePerceptron (lib/gu/pairwise-perceptron.ts, THUẦN,
 * không đụng file này) ↔ Prisma (Đợt C, docs/QUYET-DINH-HA-TANG-2026-07-31.md §③ phương án C:
 * "Prisma là nguồn + có đường xuất/nhập tệp").
 *
 * BA MẢNG, giữ tách bạch:
 *   1) GU_KINDS/GuKind — whitelist điểm cắm, dùng chung với app/api/gu/[kind]/route.ts (KHÔNG
 *      định nghĩa 2 nơi).
 *   2) loadGuModelFromServer/saveGuModelToServer — fetch wrapper KHÔNG BAO GIỜ NÉM (mọi lỗi
 *      mạng/401/404 → giá trị "coi như chưa có", degrade êm về localStorage/RAM, giống triết lý
 *      PairwisePerceptron.loadFromLocalStorage). Server LÀ NGUỒN nhưng KHÔNG được chặn luồng học
 *      cục bộ nếu mạng chập chờn — model vẫn sống trong RAM/localStorage như trước Đợt C.
 *   3) buildGuModelExport/parseGuModelExport — THUẦN (test được bằng sucrase-node), xuất/nhập
 *      1 file .json cho 1 (kind) — mẫu hình giống hệt lib/present-editor/brand-kit.ts
 *      (buildBrandKitExport/parseBrandKitExport) nhưng KHÔNG gộp nhiều bản: 1 vector trọng số
 *      không có khái niệm "merge" có ý nghĩa (khác Brand Kit là 1 DANH SÁCH kit) — nhập file
 *      luôn THAY THẾ, UI phải hỏi xác nhận tường minh trước khi gọi import (không ghi đè im lặng).
 */

import type { PerceptronState } from './pairwise-perceptron';

export const GU_KINDS = ['cad-layout-option', 'present-template'] as const;
export type GuKind = (typeof GU_KINDS)[number];
export const isGuKind = (v: string): v is GuKind => (GU_KINDS as readonly string[]).includes(v);

/* ═══════════════════════ 1) SYNC SERVER (fetch, không bao giờ ném) ═══════════════════════ */

export interface GuModelServerRecord {
  weightsJson: string;
  pairCount: number;
}

/** GET — 401 (chưa đăng nhập) / 404 (chưa có model) / lỗi mạng đều trả null, không ném. */
export async function loadGuModelFromServer(kind: GuKind): Promise<GuModelServerRecord | null> {
  try {
    const res = await fetch(`/api/gu/${kind}`);
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as Partial<GuModelServerRecord> | null;
    if (!data || typeof data.weightsJson !== 'string') return null;
    return { weightsJson: data.weightsJson, pairCount: typeof data.pairCount === 'number' ? data.pairCount : 0 };
  } catch {
    return null;
  }
}

/** PUT (upsert) — fire-and-forget an toàn: lỗi mạng/401 → false, KHÔNG chặn luồng học cục bộ. */
export async function saveGuModelToServer(kind: GuKind, weightsJson: string, pairCount: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/gu/${kind}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightsJson, pairCount }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ═══════════════════════ 2) XUẤT/NHẬP TỆP (thuần) ═══════════════════════ */

/** Gói xuất 1 (kind) — versioned để đợt sau đổi schema không vỡ file cũ người dùng đã tải về. */
export interface GuModelExport {
  version: 1;
  kind: GuKind;
  exportedAt: number;
  state: PerceptronState;
}

/** Dựng gói xuất (THUẦN — không đụng localStorage/fetch). */
export function buildGuModelExport(kind: GuKind, state: PerceptronState): GuModelExport {
  return { version: 1, kind, exportedAt: Date.now(), state };
}

function isValidPerceptronState(v: unknown): v is PerceptronState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  return (
    s.version === 1 &&
    typeof s.weights === 'object' &&
    s.weights !== null &&
    Object.values(s.weights as Record<string, unknown>).every((w) => typeof w === 'number' && Number.isFinite(w)) &&
    typeof s.pairsSeen === 'number' &&
    typeof s.updatedAt === 'number'
  );
}

/** Đọc + kiểm gói .json nhập vào (THUẦN). Sai định dạng/hỏng/kind lạ → null (không ném). */
export function parseGuModelExport(json: string): GuModelExport | null {
  try {
    const raw = JSON.parse(json) as Partial<GuModelExport>;
    if (raw?.version !== 1) return null;
    if (typeof raw.kind !== 'string' || !isGuKind(raw.kind)) return null;
    if (!isValidPerceptronState(raw.state)) return null;
    return { version: 1, kind: raw.kind, exportedAt: typeof raw.exportedAt === 'number' ? raw.exportedAt : Date.now(), state: raw.state };
  } catch {
    return null;
  }
}
