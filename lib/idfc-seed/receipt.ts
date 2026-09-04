/**
 * lib/idfc-seed/receipt.ts — BIÊN LAI NGUỒN/GIẤY PHÉP cho fixture seed (Slice 8, 09/2026).
 *
 * Phiếu: "A small lawful test fixture is acceptable with source/license receipt." Đây là biên lai
 * đó, dạng mã để test đọc được và license-gate kiểm được (ba vế người/ngày/bằng chứng).
 *
 * KHÔNG có byte nào chép từ nguồn ngoài: mọi fixture ở đây là hình khối tham số dựng bằng
 * `fixture-glb.ts`. Kích thước là SỐ KHAI CỦA TÁC GIẢ FIXTURE (cờ `verified`, nguồn = tệp này) —
 * chúng không mô phỏng sản phẩm thật nào, chỉ là hộp để chứng minh đường chuẩn hoá chạy đúng.
 */

import type { LicenseClaim } from '../idfc-import/license-gate';

export const SEED_RECEIPT = {
  source: 'self-authored: lib/idfc-seed/fixture-glb.ts (procedural box, no external bytes)',
  author: 'InteriorFlow',
  license: 'CC0-1.0' as const,
  evidenceUrl: 'repo://lib/idfc-seed/receipt.ts',
  verifiedBy: 'slice-8-ingestion',
  verifiedAt: '2026-09-02T00:00:00.000Z',
  note: 'Fixture kiểm thử — không phải sản phẩm thật, không có thương hiệu, không có giá.',
} as const;

/** LicenseClaim đủ ba vế xác minh — license-gate phải cho `redistributable` với nguồn `if-seed`. */
export function seedLicenseClaim(): LicenseClaim {
  return {
    id: SEED_RECEIPT.license,
    sourceUrl: SEED_RECEIPT.evidenceUrl,
    evidenceUrl: SEED_RECEIPT.evidenceUrl,
    verifiedBy: SEED_RECEIPT.verifiedBy,
    verifiedAt: SEED_RECEIPT.verifiedAt,
    redistributionPermission: 'explicit',
    termsForbidRebundle: false,
    attribution: `${SEED_RECEIPT.author} · CC0-1.0`,
  };
}

/** Ba hộp đại diện ba loại chia thầu khác nhau (furniture · millwork · fixture). Kích thước = số tác giả khai. */
export const SEED_BOXES = [
  { code: 'IF-SEED-BOX-STOOL', name: 'Seed box · stool', kind: 'furniture' as const, wMm: 400, dMm: 400, hMm: 450, group: 'Phòng khách' as const },
  { code: 'IF-SEED-BOX-CABINET', name: 'Seed box · cabinet', kind: 'millwork' as const, wMm: 900, dMm: 600, hMm: 2100, group: 'Bếp' as const },
  { code: 'IF-SEED-BOX-LAMP', name: 'Seed box · floor lamp', kind: 'fixture' as const, wMm: 300, dMm: 300, hMm: 1500, group: 'Phòng ngủ' as const },
] as const;
