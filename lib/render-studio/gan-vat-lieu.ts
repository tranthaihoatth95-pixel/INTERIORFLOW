/**
 * lib/render-studio/gan-vat-lieu.ts — LÕI THUẦN của việc GÁN VẬT LIỆU cho khối đang chọn ở
 * chặng 3D (`[3D-VL-01]`, `docs/delivery/AUDIT-THAO-TAC-A3.md`).
 *
 * ⛔ BỆNH ĐÃ ĐO (05/09, tái hiện trên app thật): `LIBRARY_APPLY_EVENT` có **1 chỗ phát,
 * 0 chỗ nghe** — `grep -rn "LIBRARY_APPLY_EVENT" app/ components/ lib/` chỉ ra
 * `LibrarySheet.tsx:563` (`dispatchEvent`) và KHÔNG một `addEventListener` nào. Chính
 * `LibrarySheet.tsx:80` đã tự khai từ 06/08: *"`LIBRARY_APPLY_EVENT` VẪN CÒN 0 nơi nghe"*.
 * Vậy mà `applyPreset` vẫn bắn toast xanh *"Đã áp … lên vật đang chọn"* VÔ ĐIỀU KIỆN ⇒ đúng ca
 * `docs/00-CHOT.md` 04/09: *"nút nói dối việc nó vừa làm, tệ hơn nút chết"*.
 *
 * Tệp này CHỈ chứa phần tính được — không React, không store, không sự kiện — để test thẳng.
 * Phần dây nằm ở `components/render-studio/Library3DApplyBridge.tsx`.
 *
 * LUẬT GIỮ (không nới): entity chỉ mang **khoá nối** `specId` (FK mềm `ProductSpec.id`,
 * `lib/cad/model.ts` `Base.specId`) — KHÔNG chép tên/giá/PBR vào entity. Đó là luật 2.1.9.i
 * (30/07) và chốt 16/08 *"vật liệu TRỎ TỚI bản ghi thương mại, KHÔNG chép giá vào mình"*.
 */
import type { Doc, Entity } from '@/lib/cad/model';

/** Vì sao một cú gán KHÔNG thực hiện được. Nơi gọi phải NÓI ĐÚNG lý do, không nuốt. */
export type LyDoKhongGan =
  /** Chưa chọn khối nào trong khung nhìn / cây đối tượng. */
  | 'chua-chon'
  /** Khối đang chọn không truy được về một entity trong Doc (Sàn/Phòng/Trần là hình tổng hợp). */
  | 'khong-co-entity'
  /** Entity đã bị xoá giữa chừng (chọn xong rồi Undo). */
  | 'entity-mat'
  /** Món trên kệ không tra được về một `ProductSpec` thật ⇒ không có gì để nối. */
  | 'khong-tra-duoc-ma'
  /** Món không phải vật liệu (preset dựng ảnh, theme…) — chặng 3D không nhận. */
  | 'khong-phai-vat-lieu';

export interface KetQuaGan {
  ok: boolean;
  lyDo?: LyDoKhongGan;
  /** Entity ĐÃ vá — nơi gọi đưa thẳng vào `useCadStore.updateEntities([...])`. */
  entityMoi?: Entity;
}

/**
 * Món trên kệ có phải VẬT LIỆU không. Kệ `common-atlas` là kho vật liệu ATLAS; `cad-hatch` là
 * mẫu tô 2D. Chặng 3D chỉ nhận kho vật liệu — preset dựng ảnh/theme đi đường khác, và nhận bừa
 * rồi ghi `specId` bậy còn tệ hơn không nhận.
 */
export function laMonVatLieu(mon: { shelfId?: string; kind?: string }): boolean {
  return mon.shelfId === 'common-atlas' || mon.kind === 'material';
}

/**
 * Tra `ProductSpec.id` cho một món trên kệ. Dùng ĐÚNG một đường so khớp đang có
 * (`matchSpec` — so `sku`), không đẻ đường thứ hai. Không khớp ⇒ `null`, KHÔNG bịa id.
 */
export function traSpecId(
  code: string,
  specs: readonly { id: string; sku: string | null }[] | null | undefined,
  ganTay?: string,
): string | null {
  if (!specs?.length) return null;
  if (ganTay && specs.some((s) => s.id === ganTay)) return ganTay;
  const key = code.trim().toLowerCase();
  if (!key) return null;
  return specs.find((s) => (s.sku ?? '').trim().toLowerCase() === key)?.id ?? null;
}

/**
 * Vá `specId` vào entity đang chọn. Trả bản SAO (không sửa tại chỗ) — `updateEntities` cần một
 * entity mới để snapshot Undo đúng một nấc.
 *
 * `specId` nằm trên `Base` (`lib/cad/model.ts:361`) nên MỌI loại entity mang được — tường, vùng
 * tô, block, nét rời. Không lọc theo loại: lọc là dựng lại chính giới hạn mà IDFC-INTEGRITY-001
 * đã gỡ.
 */
export function ganSpecVaoEntity(doc: Doc, entityId: string | null | undefined, specId: string): KetQuaGan {
  if (!entityId) return { ok: false, lyDo: 'chua-chon' };
  const e = doc.entities.find((x) => x.id === entityId);
  if (!e) return { ok: false, lyDo: 'entity-mat' };
  return { ok: true, entityMoi: { ...e, specId } };
}

/** Câu báo cho người dùng — HÀNH ĐỘNG TRƯỚC, ≤ ~20 từ, luôn chỉ đường đi tiếp (SPEC-NGON-NGU-CHI-DAN). */
export function cauBaoKhongGan(lyDo: LyDoKhongGan, tenMon: string): { vi: string; en: string } {
  switch (lyDo) {
    case 'chua-chon':
      return {
        vi: `Chọn một khối trong khung nhìn 3D rồi áp "${tenMon}" lại.`,
        en: `Select a block in the 3D view, then apply "${tenMon}" again.`,
      };
    case 'khong-co-entity':
      return {
        vi: `Khối này là hình tổng hợp (sàn/phòng/trần) — chưa gán vật liệu được. Chọn tường hoặc vùng tô.`,
        en: `This block is derived geometry (floor/room/ceiling) — can't take a material yet. Pick a wall or hatch.`,
      };
    case 'entity-mat':
      return {
        vi: `Khối vừa chọn không còn trong bản vẽ. Chọn lại rồi áp "${tenMon}".`,
        en: `That block is no longer in the drawing. Select again, then apply "${tenMon}".`,
      };
    case 'khong-tra-duoc-ma':
      return {
        vi: `Chưa áp được "${tenMon}" — mã này chưa có trong kho vật liệu. Mở Kho vật liệu để thêm.`,
        en: `Couldn't apply "${tenMon}" — this code isn't in the material warehouse yet. Open it to add.`,
      };
    case 'khong-phai-vat-lieu':
      return {
        vi: `"${tenMon}" không phải vật liệu — chặng 3D chỉ nhận món từ kho vật liệu.`,
        en: `"${tenMon}" isn't a material — the 3D stage only takes items from the material warehouse.`,
      };
  }
}
