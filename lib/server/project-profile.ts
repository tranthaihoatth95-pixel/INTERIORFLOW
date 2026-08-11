/**
 * lib/server/project-profile.ts — Hồ Sơ Dự Án 60s (ProjectProfile, mảnh PLAN của Bảng khởi
 * tạo dự án — `docs/SPEC-KHOI-TAO-DU-AN-2026-08-11.md`).
 *
 * Luật X2 áp thẳng vào kiểu dữ liệu: MỌI field nghiệp vụ nullable — profile trống/thiếu ô
 * là trạng thái HỢP LỆ, không default, không đoán. `loaiHinh` là khoá kỹ thuật (danh sách
 * ở lib/tasks/scaffolder.ts LOAI_HINH_OPTIONS) nhưng DB không ép — giá trị lạ vẫn lưu được
 * (người dùng gõ tay/hệ ngoài), Scaffolder gặp khoá lạ thì IM LẶNG (không gợi ý ma).
 *
 * ✅ Bảng đã migrate 12/08 (`20260811182705_them_project_profile`, backup
 * `prisma/dev.db.bak-profile`). Guard `profileTable()` giữ lại cho ca dev server chạy Prisma
 * client CŨ (generate xong nhưng chưa restart) — lỗi rõ ràng thay vì `undefined is not...`.
 */

import { prisma } from './db';

export interface ProjectProfileRow {
  projectId: string;
  loaiHinh: string | null;
  dienTichM2: number | null;
  nganSach: string | null;
  /** ISO string — DTO qua API luôn là chuỗi, Date chỉ sống trong tầng DB. */
  mocBanGiao: string | null;
  hienTrang: string | null;
  ghiChu: string | null;
  updatedAt: string;
}

/** Patch ghi từ client — field vắng mặt = giữ nguyên; null = xoá giá trị (về trống). */
export interface ProjectProfileInput {
  loaiHinh?: string | null;
  dienTichM2?: number | null;
  nganSach?: string | null;
  mocBanGiao?: string | null; // ISO date string
  hienTrang?: string | null;
  ghiChu?: string | null;
}

interface ProfileRecord {
  projectId: string;
  loaiHinh: string | null;
  dienTichM2: number | null;
  nganSach: string | null;
  mocBanGiao: Date | null;
  hienTrang: string | null;
  ghiChu: string | null;
  updatedAt: Date;
}
interface ProfileDelegate {
  findUnique(args: unknown): Promise<ProfileRecord | null>;
  upsert(args: unknown): Promise<ProfileRecord>;
}

function profileTable(what: string): ProfileDelegate {
  const p = prisma as unknown as { projectProfile?: ProfileDelegate };
  if (!p.projectProfile) {
    throw new Error(
      `[ProjectProfile] Prisma client chưa biết bảng ProjectProfile (${what}) — dev server đang chạy ` +
        'client cũ. Bảng ĐÃ có trong dev.db (migration 20260811182705); restart dev server là xong.',
    );
  }
  return p.projectProfile;
}

function toRow(r: ProfileRecord): ProjectProfileRow {
  return {
    projectId: r.projectId,
    loaiHinh: r.loaiHinh,
    dienTichM2: r.dienTichM2,
    nganSach: r.nganSach,
    mocBanGiao: r.mocBanGiao ? r.mocBanGiao.toISOString() : null,
    hienTrang: r.hienTrang,
    ghiChu: r.ghiChu,
    updatedAt: r.updatedAt.toISOString(),
  };
}

/** Đọc profile — dự án chưa từng khai trả null (KHÔNG tự tạo hàng rỗng: trống ≠ hàng rác). */
export async function getProjectProfile(projectId: string): Promise<ProjectProfileRow | null> {
  const t = profileTable('getProjectProfile');
  const r = await t.findUnique({ where: { projectId } });
  return r ? toRow(r) : null;
}

/** Chuẩn hoá 1 field chuỗi từ patch: undefined giữ nguyên · null/rỗng → null · còn lại trim. */
function normStr(v: string | null | undefined): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const s = v.trim();
  return s === '' ? null : s;
}

/**
 * Ghi profile (upsert — lần đầu là create). Kiểm đầu vào tại đây để cả API lẫn test node đi
 * chung một cửa: dienTichM2 phải là số dương hữu hạn; mocBanGiao phải parse được thành Date.
 */
export async function upsertProjectProfile(projectId: string, patch: ProjectProfileInput): Promise<ProjectProfileRow> {
  const t = profileTable('upsertProjectProfile');

  const data: Record<string, unknown> = {};
  for (const key of ['loaiHinh', 'nganSach', 'hienTrang', 'ghiChu'] as const) {
    const v = normStr(patch[key]);
    if (v !== undefined) data[key] = v;
  }
  if (patch.dienTichM2 !== undefined) {
    if (patch.dienTichM2 === null) data.dienTichM2 = null;
    else if (typeof patch.dienTichM2 === 'number' && Number.isFinite(patch.dienTichM2) && patch.dienTichM2 > 0) {
      data.dienTichM2 = patch.dienTichM2;
    } else {
      throw new Error('[ProjectProfile] dienTichM2 phải là số dương (m²) hoặc null.');
    }
  }
  if (patch.mocBanGiao !== undefined) {
    if (patch.mocBanGiao === null || patch.mocBanGiao === '') data.mocBanGiao = null;
    else {
      const d = new Date(patch.mocBanGiao);
      if (Number.isNaN(d.getTime())) throw new Error('[ProjectProfile] mocBanGiao không phải ngày hợp lệ.');
      data.mocBanGiao = d;
    }
  }

  const r = await t.upsert({
    where: { projectId },
    create: { projectId, ...data },
    update: data,
  });
  return toRow(r);
}
