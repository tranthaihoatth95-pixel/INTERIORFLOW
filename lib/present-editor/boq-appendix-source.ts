'use client';

/**
 * lib/present-editor/boq-appendix-source.ts — ĐỌC NGUỒN cho phụ lục BOQ (02/09). Đi ĐÚNG đường
 * màn BOQ + cửa nhập .xlsx đang đi (không dựng đường đọc thứ hai): `getProjectDoc` (Doc SỐNG,
 * T1) → `POST /api/boq/[projectId]` (engine + Kho giá, server tra) → `loadBoqOverrides` (sửa tay
 * đã lưu IDB) → `applyBoqOverrides` → `groupBoqRows`. Phần THUẦN dựng trang nằm ở
 * `boq-appendix.ts`; file này chỉ gom dữ liệu (fetch/IDB nên KHÔNG test bằng sucrase-node —
 * cùng khuôn `boq-overrides-persist.ts`).
 *
 * Trả về kết quả CÓ LÝ DO khi không dựng được (chưa mở dự án · chưa có bản vẽ sống · API lỗi) —
 * UI in nguyên câu, không nuốt (luật G-M20-02).
 */
import type { Doc } from '../cad/model';
import type { BoqError, BoqRow } from '../boq/model';
import { boqFingerprint } from '../boq/cache';
import { getProjectDoc, type ProjectDocSource } from './project-doc';
import { applyBoqOverrides, type BoqDisplayRow } from './boq-overrides';
import { loadBoqOverrides } from './boq-overrides-persist';
import { groupBoqRows, type BoqGroup, type BoqGroupMode } from './boq-group';

export type BoqAppendixSourceFail = 'no-project' | 'no-doc' | 'api' | 'network';

export interface BoqAppendixSourceOk {
  ok: true;
  rows: BoqDisplayRow[];
  errors: BoqError[];
  groups: BoqGroup<BoqDisplayRow>[];
  groupMode: BoqGroupMode;
  /** vân tay ĐẦY ĐỦ của Doc sống (`boqFingerprint`) — builder tự rút gọn. */
  fingerprint: string;
  docSource: ProjectDocSource;
  doc: Doc;
}
export interface BoqAppendixSourceErr {
  ok: false;
  reason: BoqAppendixSourceFail;
  /** [vi, en] — câu cho người dùng, UI chọn theo ngôn ngữ. */
  message: [string, string];
}
export type BoqAppendixSource = BoqAppendixSourceOk | BoqAppendixSourceErr;

const GROUP_MODE_KEY = 'if-boq-group-mode'; // cùng khoá BoqScreen.tsx — bảng in theo đúng cách người dùng đang nhóm

function readGroupMode(): BoqGroupMode {
  try {
    const v = localStorage.getItem(GROUP_MODE_KEY);
    if (v === 'room' || v === 'storey') return v;
  } catch { /* private mode */ }
  return 'storey';
}

/** Chỉ đọc vân tay Doc sống (cho Inspector báo cũ) — rẻ, không gọi API. `null` = không có Doc sống. */
export async function liveBoqFingerprint(userId: string, projectId: string): Promise<string | null> {
  if (!projectId) return null;
  const { doc, source } = await getProjectDoc(userId, projectId);
  if (source === 'none') return null;
  return boqFingerprint(doc);
}

export async function loadBoqAppendixSource(userId: string, projectId: string): Promise<BoqAppendixSource> {
  if (!projectId || !userId) {
    return {
      ok: false, reason: 'no-project',
      message: [
        'Chưa xác định được dự án đang mở — mở chặng Trình chiếu từ một dự án cụ thể rồi thử lại.',
        'No project is open — enter the Presenting stage from a specific project, then try again.',
      ],
    };
  }
  const { doc, source } = await getProjectDoc(userId, projectId);
  if (source === 'none' || doc.entities.length === 0) {
    return {
      ok: false, reason: 'no-doc',
      message: [
        'Chưa có bản vẽ 2D sống của dự án này trong phiên — mở chặng Thiết kế 2D một lần (để nạp bản vẽ) rồi quay lại chèn phụ lục.',
        'No live 2D drawing for this project in this session — open the 2D Design stage once (to load the drawing), then insert the appendix again.',
      ],
    };
  }
  let data: { rows?: unknown; errors?: unknown } | null = null;
  try {
    const res = await fetch(`/api/boq/${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      const why = (j && typeof j.error === 'string') ? j.error : `HTTP ${res.status}`;
      return { ok: false, reason: 'api', message: [`Không tính được bảng khối lượng: ${why}`, `Could not compute the bill of quantities: ${why}`] };
    }
    data = await res.json();
  } catch (e) {
    const why = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: 'network', message: [`Không gọi được máy chủ tính BOQ (${why}).`, `Could not reach the BOQ service (${why}).`] };
  }
  const rawRows: BoqRow[] = Array.isArray(data?.rows) ? (data!.rows as BoqRow[]) : [];
  const errors: BoqError[] = Array.isArray(data?.errors) ? (data!.errors as BoqError[]) : [];
  const overrides = await loadBoqOverrides(userId, projectId);
  const rows = applyBoqOverrides(rawRows, overrides);
  const groupMode = readGroupMode();
  const groups = groupBoqRows(rows, doc, groupMode);
  return { ok: true, rows, errors, groups, groupMode, fingerprint: boqFingerprint(doc), docSource: source, doc };
}
