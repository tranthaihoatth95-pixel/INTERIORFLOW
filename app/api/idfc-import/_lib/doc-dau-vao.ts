/**
 * app/api/idfc-import/_lib/doc-dau-vao.ts — phần THUẦN của cửa nhận diện: đọc body, kiểm từng
 * trường, dựng đầu vào cho `nhanDienCauKien`. Tách khỏi handler (cần session/Prisma/fs) để test
 * không cần DB — cùng lối `app/api/asset-representation/_lib/kiem.ts`.
 *
 * 🔴 VÌ SAO `sourceUrl` BẮT BUỘC, không phải thủ tục rườm rà: mọi số w/d/h đi qua đây được
 * `buildIdfcFromPhoto` đóng cờ **`verified`** — nấc sự thật cao nhất. Một con số `verified` mà
 * không nêu được đối chiếu với cái gì thì đó là **một cái gật đầu đội lốt phép đo**
 * (`lib/capabilities/image-to-3d.ts` — bốn nghĩa canonical, Hoà chốt 20/08).
 */

import type { BlockGroup } from '../../../../lib/cad/shared-types';
import type { PhotoClassification, VerifiedSpec } from '../../../../lib/idfc-import/from-photo';

export type NhanhChay = 'khoi' | 'anh';

export interface DauVaoNhanDienApi {
  nhanh: NhanhChay;
  /** ảnh của món (data-URI) — LUÔN cần: nó là DANH TÍNH trong Thư viện, và là đầu vào nhánh 'anh'. */
  anhDataUri: string;
  /** chỉ nhánh 'khoi' */
  glbBase64: string;
  tenTepKhoi: string;
  spec: VerifiedSpec;
  phanLoai: PhotoClassification;
  group?: BlockGroup;
}

export type KetQuaDoc = { ok: true; dauVao: DauVaoNhanDienApi } | { ok: false; error: string };

/** Câu báo thiếu khoá — MỘT chỗ khai, GET và POST cùng đọc (không để hai câu lệch nhau). */
export const THIEU_KHOA_MANG = (thieu: string[]): string =>
  `Chưa dựng khối từ ảnh được — máy chủ thiếu ${thieu.join(' và ')}. Dùng tệp khối 3D có sẵn thì chạy ngay.`;

const SO = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : null);
const CHU = (x: unknown): string => (typeof x === 'string' ? x.trim() : '');

/** Trần 40MB cho GLB — mesh TRELLIS thật đo 1,6MB; 40MB đã rộng hơn hai bậc độ lớn. */
const GLB_MAX_BYTES = 40 * 1024 * 1024;

export function docDauVao(body: unknown): KetQuaDoc {
  if (typeof body !== 'object' || body === null || Array.isArray(body))
    return { ok: false, error: 'Body phải là JSON object.' };
  const b = body as Record<string, unknown>;

  const nhanh = CHU(b.nhanh);
  if (nhanh !== 'khoi' && nhanh !== 'anh')
    return { ok: false, error: 'Thiếu `nhanh` — nhận "khoi" (tệp 3D) hoặc "anh" (dựng từ ảnh).' };

  const anhDataUri = CHU(b.anhDataUri);
  if (!anhDataUri.startsWith('data:image/'))
    return { ok: false, error: 'Cần ảnh của món (data-URI) — ảnh là danh tính của nó trong Thư viện.' };

  const s = (typeof b.spec === 'object' && b.spec !== null ? b.spec : {}) as Record<string, unknown>;
  const name = CHU(s.name);
  const code = CHU(s.code);
  const sourceUrl = CHU(s.sourceUrl);
  const wMm = SO(s.wMm);
  const dMm = SO(s.dMm);
  const hMm = SO(s.hMm);
  if (!name) return { ok: false, error: 'Thiếu tên món.' };
  if (!code) return { ok: false, error: 'Thiếu mã món.' };
  if (!wMm || !dMm || !hMm)
    return { ok: false, error: 'Cần đủ rộng × sâu × cao (mm, lớn hơn 0) — thiếu thì mọi số phía sau là bịa.' };
  if (!sourceUrl)
    return {
      ok: false,
      error:
        'Cần nguồn số đo (đường dẫn trang hãng hoặc hồ sơ) — các số này sẽ mang cờ "đã xác minh", không nêu được đối chiếu với cái gì thì không phải xác minh.',
    };

  const spec: VerifiedSpec = {
    name,
    code,
    wMm,
    dMm,
    hMm,
    sourceUrl,
    ...(CHU(s.brand) ? { brand: CHU(s.brand) } : {}),
    ...(SO(s.seatHMm) ? { seatHMm: SO(s.seatHMm) as number } : {}),
    ...(SO(s.weightKg) ? { weightKg: SO(s.weightKg) as number } : {}),
    ...(Array.isArray(s.materials) ? { materials: s.materials.filter((m): m is string => typeof m === 'string') } : {}),
  };

  const p = (typeof b.phanLoai === 'object' && b.phanLoai !== null ? b.phanLoai : {}) as Record<string, unknown>;
  // Nhánh 'anh': vision ghi đè khối này ở handler. Nhánh 'khoi': người khai ⇒ cờ + nguồn nói ĐÚNG
  // là người khai, không đội lốt "vision:<model>" (xem `PhotoClassification.nguon`).
  const phanLoai: PhotoClassification = {
    caption: CHU(p.caption),
    style: CHU(p.style),
    materials: Array.isArray(p.materials) ? p.materials.filter((m): m is string => typeof m === 'string') : [],
    room: CHU(p.room),
    visionModel: '-',
    nguon: { flag: 'verified', source: 'người nhập khai lúc nhập tệp khối' },
  };

  let glbBase64 = '';
  let tenTepKhoi = '';
  if (nhanh === 'khoi') {
    glbBase64 = CHU(b.glbBase64);
    tenTepKhoi = CHU(b.tenTepKhoi) || 'khoi.glb';
    if (!glbBase64) return { ok: false, error: 'Thiếu tệp khối 3D (.glb).' };
    // Ước byte từ độ dài base64 — chặn TRƯỚC khi giải mã, không nạp 200MB vào RAM rồi mới từ chối.
    if (Math.floor((glbBase64.length * 3) / 4) > GLB_MAX_BYTES)
      return { ok: false, error: 'Tệp khối 3D quá 40MB.' };
  }

  const group = CHU(b.group);
  return {
    ok: true,
    dauVao: {
      nhanh,
      anhDataUri,
      glbBase64,
      tenTepKhoi,
      spec,
      phanLoai,
      ...(group ? { group: group as BlockGroup } : {}),
    },
  };
}
