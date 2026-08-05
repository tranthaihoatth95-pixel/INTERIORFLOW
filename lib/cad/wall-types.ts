/**
 * lib/cad/wall-types.ts — TYPE vs INSTANCE cho tường. Hàm THUẦN (không React/DOM/store), test độc
 * lập bằng `sucrase-node lib/cad/wall-types.test.ts` — cùng khuôn `lib/cad/levels.ts`.
 *
 * VÌ SAO CÓ FILE NÀY (`docs/SO-KIEM-TONG.md` §7 dòng "Type vs Instance" — ⬜ CHƯA ở CẢ 2D lẫn 3D):
 * *"không có `WallType`/catalog nào tồn tại; `wallKind`·`wallThicknessMm`·`heightMm` nằm thẳng
 * trên TỪNG entity — 100% instance, không có '1 chỗ đổi cả dự án đổi'"*.
 *
 * ⛔ KHÔNG ĐỤNG `components/*` — `WallTypePanel` (`components/cad/CadEditor.tsx:2119`, tên gây
 * hiểu lầm: nó gán `wallKind` lên TỪNG entity chứ không quản lý Type) nằm ngoài vùng phiên này.
 * File này chỉ dựng TẦNG DỮ LIỆU + phép giải; nối UI là việc phiên khác.
 *
 * ⚠️ LUẬT GHI ĐÈ (đúng Revit): **giá trị khai trên INSTANCE THẮNG giá trị của Type.** Type là mặc
 * định, không phải xiềng. Mọi hàm dưới đây trả về CẢ giá trị cuối LẪN nguồn của nó, để UI hiện
 * được chấm "đã override" mà không phải tự suy lại.
 */

import type { Doc, Entity, WallKind, WallRun, WallType } from './model';

/** Giá trị cuối cùng đến từ đâu. 'none' = cả instance lẫn type đều không khai (undefined) — KHÔNG
 * bịa mặc định ở tầng này (N4); nơi gọi tự quyết lấy mặc định nào. */
export type WallParamSource = 'instance' | 'type' | 'none';

export interface ResolvedWallParams {
  /** bề dày cuối (mm). undefined = chưa ai khai — với tường vẽ bằng lệnh WALL thì bề dày đã BAKED
   * vào hình học (xem docstring `Base.wallThicknessMm`), số ở đây chỉ là metadata KHAI BÁO. */
  thicknessMm?: number;
  thicknessFrom: WallParamSource;
  kind?: WallKind;
  kindFrom: WallParamSource;
  /** FK mềm `ProductSpec.id`. */
  specId?: string;
  specIdFrom: WallParamSource;
  /** Type đang áp (đã tra được). undefined = entity không `typeId`, HOẶC `typeId` mồ côi. */
  type?: WallType;
  /** `typeId` trỏ tới Type KHÔNG tồn tại trong `doc.wallTypes` (type đã bị xoá) — hàm đã lùi về
   * thuần-instance để không sập, nhưng nơi gọi phải cảnh báo, đừng im lặng. */
  danglingTypeId?: string;
  /** tổng bề dày các lớp cấu tạo của Type (mm). undefined khi Type không khai `layers`. */
  layerThicknessSumMm?: number;
  /** `layerThicknessSumMm − type.thicknessMm`. Khác 0 = cấu tạo lớp KHÔNG khớp bề dày tổng —
   * hồ sơ kỹ thuật sai, phải báo người dùng. Hàm **KHÔNG tự sửa số nào** (N4): `thicknessMm` trả
   * về vẫn là con số chính thức của Type, không phải tổng lớp. */
  layersMismatchMm?: number;
}

/** `undefined` nếu doc chưa có catalog HOẶC id không tra được (type đã bị xoá — tham chiếu mồ côi). */
export function wallTypeById(doc: Doc, id: string | undefined): WallType | undefined {
  if (!id || !doc.wallTypes?.length) return undefined;
  return doc.wallTypes.find((t) => t.id === id);
}

/** Kiểm cấu tạo lớp của một Type. Tách riêng để `resolveWallParams`/`resolveWallRunParams` dùng
 * chung, và để UI "Structure editor" sau này gọi thẳng mà không cần entity nào. */
export function wallTypeLayerCheck(type: WallType): { sumMm?: number; mismatchMm?: number } {
  if (!type.layers?.length) return {};
  const sumMm = type.layers.reduce((s, l) => s + (Number.isFinite(l.thicknessMm) ? l.thicknessMm : 0), 0);
  const diff = sumMm - type.thicknessMm;
  return { sumMm, ...(diff === 0 ? {} : { mismatchMm: diff }) };
}

function merge<T>(instance: T | undefined, fromType: T | undefined): { value?: T; from: WallParamSource } {
  if (instance !== undefined) return { value: instance, from: 'instance' };
  if (fromType !== undefined) return { value: fromType, from: 'type' };
  return { from: 'none' };
}

/**
 * Tham số tường CUỐI CÙNG của một entity, sau khi hoà Type với override trên instance.
 *
 * **Đổi 1 `WallType` → mọi entity trỏ vào nó đổi theo NGAY** (trừ chỗ instance đã override), vì
 * hàm không cache gì, luôn đọc lại từ `doc` (K1 — một nguồn).
 *
 * `typeId` mồ côi KHÔNG làm hàm sập: coi như thuần instance + ghi `danglingTypeId`.
 */
export function resolveWallParams(entity: Entity, doc: Doc): ResolvedWallParams {
  const type = wallTypeById(doc, entity.typeId);
  const dangling = entity.typeId && !type ? entity.typeId : undefined;

  const thickness = merge(entity.wallThicknessMm, type?.thicknessMm);
  const kind = merge(entity.wallKind, type?.kind);
  // `specId` KHÔNG nằm ở `Base` — chỉ `HatchEntity`/`BlockEntity` có (model.ts, mỗi chỗ một
  // docstring riêng). Tường poché là `HatchEntity` nên có; entity khác thì coi như chưa khai.
  const instanceSpecId = 'specId' in entity ? entity.specId : undefined;
  const specId = merge(instanceSpecId, type?.specId);
  const layers = type ? wallTypeLayerCheck(type) : {};

  return {
    ...(thickness.value === undefined ? {} : { thicknessMm: thickness.value }),
    thicknessFrom: thickness.from,
    ...(kind.value === undefined ? {} : { kind: kind.value }),
    kindFrom: kind.from,
    ...(specId.value === undefined ? {} : { specId: specId.value }),
    specIdFrom: specId.from,
    ...(type ? { type } : {}),
    ...(dangling ? { danglingTypeId: dangling } : {}),
    ...(layers.sumMm === undefined ? {} : { layerThicknessSumMm: layers.sumMm }),
    ...(layers.mismatchMm === undefined ? {} : { layersMismatchMm: layers.mismatchMm }),
  };
}

/**
 * `WallRun` (P11, tường parametric mode Kỹ thuật) — TẠM THỜI **luôn 100% INSTANCE**.
 *
 * Lý do KHÔNG thêm `WallRun.typeId` ở đợt này (K4 — field mới chỉ thêm khi ĐÃ CÓ nơi tiêu thụ):
 * `WallRun.thicknessMm` là field **BẮT BUỘC** (`model.ts`), nên instance LUÔN có giá trị và theo
 * luật ghi đè thì Type sẽ KHÔNG BAO GIỜ thắng ⇒ `typeId` trên run là field CHẾT. Muốn Type ăn
 * được vào run phải đổi `thicknessMm` thành optional + sửa `regenWallRun()` (`lib/cad/commands.ts`)
 * đọc bề dày qua hàm này — việc RIÊNG, đụng đường sinh hình học đang chạy (§0d), không gộp vào đây.
 *
 * Hàm này tồn tại để nơi gọi có MỘT cửa duy nhất hỏi "bề dày cuối của tường này là bao nhiêu",
 * bất kể tường là entity rời hay WallRun — và để `thicknessFrom: 'instance'` nói thật hiện trạng.
 */
export function resolveWallRunParams(run: WallRun, _doc: Doc): ResolvedWallParams {
  return {
    thicknessMm: run.thicknessMm,
    thicknessFrom: 'instance',
    kindFrom: 'none',
    specIdFrom: 'none',
  };
}
