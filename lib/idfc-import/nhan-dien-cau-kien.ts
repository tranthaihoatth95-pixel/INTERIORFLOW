/**
 * lib/idfc-import/nhan-dien-cau-kien.ts — MỐI NỐI đã tháo giữa hai cụm của cùng một dây chuyền.
 *
 * ── ĐO TẠI NGUỒN 05/09, trước khi viết một dòng nào (luật B25 NO-REBUILD, negative evidence) ──
 * `lib/idfc-import/` có BỐN module engine, 64 test, một proof chạy thật (ghế Lincoln 327, 14/08).
 * Nhưng chúng nằm thành HAI CỤM RỜI NHAU, và cả hai cụm đều 0 nơi gọi ngoài test của chính nó:
 *   cụm ① `from-photo.ts`  — ảnh → vision phân loại → fal TRELLIS mesh → `.idfc` có cờ 3 nấc.
 *   cụm ② `chuan-net.ts` + `surface-graph.ts` + `part-lock.ts` — GLB → chuẩn nét → diện → cấu
 *         kiện đặt tên nghề.
 * `grep "chuan-net" lib/idfc-import/from-photo.ts` = 0 ⇒ **mesh mà cụm ① sinh ra CHƯA BAO GIỜ
 * được cụm ② chuẩn nét**. Đó là mối tháo, và nó nằm ngay giữa hai tệp cùng thư mục.
 *
 * File này KHÔNG viết lại một dòng thuật toán nào. Nó chỉ GỌI, theo đúng thứ tự mà bốn docstring
 * kia đã mô tả nhưng chưa ai nối:
 *
 *   GLB bytes
 *     ├─ `chuanNet()`            → mảnh primitive tham số (cylinder/torus) + OBJ/MTL + recipe
 *     │                            (bên trong tự chạy `mirrorCompleteShapes()` — entry mirror)
 *     ├─ `xayDoThiDien()`        → N diện + phân loại planar/cylindrical/toroidal/freeform
 *     ├─ `buildPartLockFromChuanNet()` → cấu kiện có TÊN NGHỀ (4 chân · 2 vòng tay · mặt ngồi…)
 *     └─ `buildIdfcFromPhoto()`  → bản ghi `.idfc` kind furniture + bảng cờ 3 nấc per-trường
 *
 * THUẦN — không fs, không mạng, không DOM, không AI. Caller ghi đĩa và tiêu credit, không phải
 * file này. Nhờ vậy chạy được cả ở route server lẫn (về nguyên tắc) trong trình duyệt.
 *
 * KHÔNG đổi lược đồ `.idfc`, không bump `IDFC_VERSION`: bản ghi ra vẫn đi qua đúng
 * `exportIdfc`/`importIdfc` của `lib/cad/idfc.ts`, và `buildIdfcFromPhoto` tự ném nếu app không mở
 * nổi file nó vừa sinh. Cây cấu kiện KHÔNG nhét vào `.idfc` (thêm khoá lạ vào một định dạng đã ghi
 * ra đĩa là việc phải có bảng nâng cấp) — nó là một CÁCH THỂ HIỆN riêng, đúng chỗ mà
 * `AssetRepresentation` (schema.prisma:347) sinh ra để chứa.
 */

import { chuanNet, parseGlbGeometry, type ChuanNetOpts, type ChuanNetResult } from './chuan-net';
import { xayDoThiDien, type DoThiDien } from './surface-graph';
import { buildPartLockFromChuanNet, type PartLockAsset } from './part-lock';
import {
  buildIdfcFromPhoto,
  type MeshResult,
  type PhotoClassification,
  type VerifiedSpec,
  type FromPhotoRecord,
} from './from-photo';
import type { BlockGroup } from '../cad/shared-types';

export interface DauVaoNhanDien {
  /** byte GLB — từ fal TRELLIS (đường mạng) HOẶC tệp người dùng đưa (đường 0 credit). */
  glb: Uint8Array;
  /** số đo hãng đã tra tay — mọi trường ở đây mang cờ `verified`, nên `sourceUrl` là BẮT BUỘC. */
  spec: VerifiedSpec;
  phanLoai: PhotoClassification;
  mesh: MeshResult;
  sourceImageUrl: string;
  group?: BlockGroup;
  /** atlas baseColor đã giải mã — có thì mảnh primitive kế thừa màu thật thay vì xám cứng (CN-F2). */
  texRgba?: ChuanNetOpts['texRgba'];
  /** số lát cắt của bước chuẩn nét — để nguyên mặc định trừ khi có lý do đo được. */
  slabs?: number;
}

export interface SoLieuNhanDien {
  triTruoc: number;
  triSau: number;
  soManh: number;
  soManhThamSo: number;
  soDien: number;
  soCauKien: number;
  soCauKienDatTen: number;
  scaleMmPerUnit: number;
  coTexture: boolean;
}

export interface KetQuaNhanDien extends FromPhotoRecord {
  chuanNet: ChuanNetResult;
  doThiDien: DoThiDien;
  partLock: PartLockAsset;
  soLieu: SoLieuNhanDien;
  /** khai thật mọi chỗ máy KHÔNG chắc — gộp ghi chú của cả ba bước, không lọc bớt cho đẹp [T0]. */
  ghiChu: string[];
}

/** Tên nghề đã gán được (khác tên kỹ thuật "dien-12"/"manh-3" mà part-lock giữ khi không suy nổi). */
function daDatTenNghe(id: string): boolean {
  return !/^(dien|manh|part)-?\d+$/i.test(id);
}

/** Ghép bốn bước. Ném khi GLB không đọc được — caller báo người dùng, KHÔNG dựng khối cho có. */
export function nhanDienCauKien(input: DauVaoNhanDien): KetQuaNhanDien {
  const hMm = input.spec.hMm;
  if (!Number.isFinite(hMm) || hMm <= 0) {
    throw new Error('Thiếu chiều cao thật (hMm) — không có nó thì mọi số mm phía sau là bịa.');
  }

  const geom = parseGlbGeometry(input.glb);
  if (!geom) throw new Error('Tệp không phải GLB đọc được (thiếu magic/chunk hoặc không có mesh).');

  // ① chuẩn nét — bên trong đã tự chạy mirror-completion sau khi fit
  const cn = chuanNet(input.glb, { hMm, slabs: input.slabs, texRgba: input.texRgba });
  if (!cn) throw new Error('Bước chuẩn nét không đọc được hình học từ GLB.');

  // ② đồ thị diện — cùng một mesh, cách nhìn thứ hai (region-growing theo pháp tuyến)
  const dt = xayDoThiDien(
    { positions: geom.positions, uvs: geom.uvs, indices: geom.indices },
    { hMm, ...(input.texRgba ? { atlas: input.texRgba as never } : {}) },
  );

  // ③ ghép hai cách nhìn thành cây cấu kiện có tên nghề
  const pl = buildPartLockFromChuanNet({ dien: dt.dien }, { parts: cn.parts });

  // ④ bản ghi .idfc — vỏ chuẩn, cờ 3 nấc per-trường
  const rec = buildIdfcFromPhoto({
    spec: input.spec,
    classification: input.phanLoai,
    mesh: { ...input.mesh, triangles: input.mesh.triangles ?? cn.polySau },
    sourceImageUrl: input.sourceImageUrl,
    group: input.group,
  });

  const soManhThamSo = cn.parts.filter((p) => p.loai === 'cylinder' || p.loai === 'torus').length;

  return {
    ...rec,
    chuanNet: cn,
    doThiDien: dt,
    partLock: pl,
    soLieu: {
      triTruoc: cn.polyTruoc,
      triSau: cn.polySau,
      soManh: cn.parts.length,
      soManhThamSo,
      soDien: dt.dien.length,
      soCauKien: pl.parts.length,
      soCauKienDatTen: pl.parts.filter((p) => daDatTenNghe(p.id)).length,
      scaleMmPerUnit: cn.scaleMmPerUnit,
      coTexture: cn.texture !== null,
    },
    ghiChu: [...cn.ghiChu, ...pl.ghiChu],
  };
}
