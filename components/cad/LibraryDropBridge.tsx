'use client';

/**
 * components/cad/LibraryDropBridge.tsx — CHỖ NGHE còn thiếu của sự kiện thả từ Thư viện (G-M3-14).
 *
 * Bệnh (đo 06/08, và `LibrarySheet.tsx:38` đã tự ghi chú từ 05/08): `LIBRARY_INSTANTIATE_EVENT`
 * có **1 chỗ phát, 0 chỗ nghe** ⇒ bấm "dùng" một món trên kệ chỉ hiện toast *"Đã tạo bản làm
 * việc…"* trong khi bản vẽ KHÔNG có gì rơi xuống. Lời báo còn tệ hơn việc thiếu tính năng: nó
 * khẳng định đã xong.
 *
 * Component này KHÔNG vẽ gì (trả `null`) — chỉ nghe sự kiện, đối chiếu món qua
 * `lib/cad/library-item-resolve.ts` (thuần, có test) rồi ghi vào ĐÚNG đường có sẵn:
 * `useCadStore.addEntities()` — cùng đường mà kệ "cụm bàn" (`ClusterPanel`) đã chạy thật, nên
 * được 1 nấc Undo cho cả cụm và không đẻ cơ chế thứ hai (luật một-cỗ-máy-nhiều-mặt-tiền).
 *
 * Ba đường thả (R8 19/08 thêm đường ⓪ — đứng TRƯỚC hai đường khớp-tên):
 *  ⓪ món `.idfc` trong kho studio → làm phẳng CHÍNH `body.geom2d` của nó (geom2d trước nay
 *     0 reader — UF-2 mắt đứt 2), gắn `srcBlock`/`srcInsertId` để cả cụm chọn/truy gốc được.
 *  ① `BLOCKS` → tạo **`BlockEntity` thật** (đếm được · chọn được · gán `specId` được ⇒ lên BOQ
 *     được). Đây là lý do resolver ưu tiên kho này trong các đường khớp-tên.
 *  ② manifest .dxf → `insertBlockById()` làm phẳng thành đường rời. VẪN THẢ (có còn hơn không)
 *     nhưng câu báo NÓI THẲNG là nét rời — đúng bệnh G-M3-10 chưa sửa, không giấu.
 *
 * Không khớp được kho nào ⇒ báo câu thật + chỉ đường làm tiếp, KHÔNG thả hình bừa.
 *
 * Mount ở `CadEditor` (màn 2D) — nơi duy nhất hiện có bản vẽ để đón món. Ở màn khác không ai
 * nhận, `LibrarySheet` tự biết nhờ cờ `detail.claimed` và báo câu khác (xem `LibrarySheet.tsx`).
 */

import { useEffect } from 'react';
import { LIBRARY_INSTANTIATE_EVENT } from '@/components/library/LibrarySheet';
import { pushLibraryToast } from '@/components/library/LibraryToast';
import { useCadStore, newId } from '@/lib/cad/store';
import { screenToWorld } from '@/lib/cad/model';
import type { Entity, Pt } from '@/lib/cad/model';
import { loadManifest, insertBlockById, clusterPrimsToEntities } from '@/lib/cad/block-library';
import { tronKhoMam } from '@/lib/idfc-seed';
import {
  resolveLibraryItem,
  unresolvedMessage,
  idfcGeom2dOf,
  idfcNoGeom2dMessage,
  type LibraryItemRef,
} from '@/lib/cad/library-item-resolve';
import { hydrateIdfcStore, loadIdfcStore } from '@/lib/library/idfc-store';

/** Chi tiết sự kiện: món trên kệ + cờ để nơi PHÁT biết đã có ai nhận chưa (đặt lại đồng bộ ngay
 * trong listener — `dispatchEvent` chạy đồng bộ nên nơi phát đọc được ngay sau khi gọi).
 * R8: `id` — LibrarySheet vốn spread cả `SheetItem` vào detail nên trường này ĐÃ đi kèm từ trước
 * (không phải sửa nơi phát); khai ra đây để nơi nghe nhận diện món `.idfc` (`id = "idfc:<code>"`,
 * đúng cách kệ `common-idfc` đặt id — xem LibrarySheet `idfcItems.map`). */
export interface LibraryInstantiateDetail extends LibraryItemRef {
  claimed?: boolean;
  id?: string;
}

/** Thả vào GIỮA khung nhìn hiện tại, không phải gốc toạ độ — cùng cách `ClusterPanel` làm (thả
 * vào gốc dễ chồng lên bản vẽ có sẵn và nằm ngoài màn hình). */
function dropPoint(): Pt {
  const st = useCadStore.getState();
  return screenToWorld(st.viewport, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
}

async function dropItem(item: LibraryItemRef, sheetItemId?: string): Promise<void> {
  const st = useCadStore.getState();
  const at = dropPoint();

  // R8 (UF-2 mắt đứt 2) — món có nguồn là `.idfc` trong kho studio (id kệ `idfc:<code>`): tra
  // ĐÚNG bản ghi theo `meta.code` (danh tính kho — upsert theo code, xem idfc-store.ts) rồi rút
  // geom2d của CHÍNH nó. Chỉ đụng IDB khi id mang tiền tố — món kệ thường không tốn lượt hydrate.
  let idfcGeom2d: ReturnType<typeof idfcGeom2dOf> | undefined;
  let idfcWithoutGeom = false;
  if (sheetItemId?.startsWith('idfc:')) {
    await hydrateIdfcStore().catch(() => undefined); // IDB hỏng ⇒ coi như kho chưa có, đi đường cũ
    // 🔴 SỬA 22/08 — KỆ VÀ CÚ THẢ TỪNG ĐỌC HAI NGUỒN KHÁC NHAU. Kệ Thư viện dựng danh sách bằng
    // `tronKhoMam(loadIdfcStore())` (kho studio TRỘN kho mầm, `LibrarySheet:298`), còn chỗ này chỉ
    // đọc `loadIdfcStore()` — tức CHỈ IndexedDB. Hệ quả đo trên app thật: kệ bày 73 món, kéo một
    // món mầm xuống thì tra không thấy bản ghi ⇒ tuột sang nhánh khớp-tên, ra 1 nét chung chung
    // thay vì 41 nét hình thật, và `srcBlock` rỗng nên mất luôn đường truy về mẫu gốc.
    // Nay đọc CÙNG MỘT NGUỒN với kệ — món nào bày ra được thì thả xuống được, không có ngoại lệ.
    const rec = tronKhoMam(loadIdfcStore()).find((s) => s.meta.code === item.code);
    if (rec) {
      idfcGeom2d = idfcGeom2dOf(rec.body);
      idfcWithoutGeom = !idfcGeom2d;
    }
  }

  // manifest tải lười + cache theo phiên trang (`loadManifest`), hỏng mạng thì coi như chưa có
  // kho ② chứ không chặn kho ①.
  const manifest = await loadManifest().catch(() => null);
  const hit = resolveLibraryItem(item, manifest, undefined, idfcGeom2d);

  if (!hit) {
    // `.idfc` có trong kho nhưng không mang hình 2D (video/mẫu trang/vật liệu chưa có ký hiệu…)
    // và đường khớp-tên cũng trắng tay ⇒ nói ĐÚNG nguyên nhân, không đổ cho "kho block thiếu món".
    const msg = idfcWithoutGeom ? idfcNoGeom2dMessage(item) : unresolvedMessage(item);
    st.setStatus(msg);
    pushLibraryToast(msg);
    return;
  }

  if (hit.via === 'idfc') {
    // Hình học của CHÍNH món — làm phẳng bằng primitive có sẵn (`clusterPrimsToEntities`, cùng
    // đường ClusterPanel; KHÔNG đăng ký block động vào BLOCK_MAP — mở lại bản vẽ sẽ mất hình,
    // lý do đã ghi block-library.ts:201). Gắn `srcBlock` + MỘT `srcInsertId` chung cho cả cụm
    // (Base đã có 2 field, serialize vào .idf) ⇒ chọn 1 nét là nở ra cả cụm
    // (`expandIdsByInsertGroup`), truy được gốc "từ .idfc nào".
    // ⚠️ specId (R1) KHÔNG gắn được lên nét rời — schema chỉ cho Block/Hatch entity mang specId;
    // thêm field vào model.ts là NGOÀI phạm vi phiếu. Khai thật trong báo cáo, không im lặng.
    const srcInsertId = newId('idfc-ins');
    const entities = clusterPrimsToEntities(hit.geom2d.prims, at, { layer: 'l-furniture' }).map((e) => ({
      ...e,
      srcBlock: item.code,
      srcInsertId,
    }));
    if (entities.length === 0) {
      const msg = idfcNoGeom2dMessage(item);
      st.setStatus(msg);
      pushLibraryToast(msg);
      return;
    }
    useCadStore.getState().addEntities(entities);
    const msg = `Đã thả "${item.name}" từ hình vẽ của chính mẫu .idfc — ${entities.length} nét, bấm một nét là chọn được cả cụm. ⌘Z để lùi.`;
    useCadStore.getState().setStatus(msg);
    pushLibraryToast(msg);
    return;
  }

  if (hit.via === 'blockdef') {
    const e: Entity = {
      id: newId('e'),
      type: 'block',
      layer: 'l-furniture',
      block: hit.def.id,
      at,
      rot: 0,
      sx: 1,
      sy: 1,
      // R1 (19/08): giữ FK mềm ProductSpec.id đi xuyên tới entity — món có mã lên được BOQ,
      // hết `missing-specId-item` cho đúng ca thả từ Thư viện. Không có ⇒ KHÔNG khai field.
      ...(hit.specId ? { specId: hit.specId } : {}),
    };
    useCadStore.getState().addEntities([e]);
    // Khớp gần đúng (tên kệ ≠ tên kho) PHẢI nói ra tên thứ thật sự vừa thả — vòng kiểm phản biện
    // đã bắt được ca "Bàn trang điểm có gương" ra Bàn trà mà lời báo vẫn ngọt như khớp chuẩn.
    const msg = hit.approximate
      ? `Đã thả "${hit.def.name}" (gần đúng với "${item.name}") — kiểm lại trước khi dùng. ⌘Z để lùi.`
      : `Đã thả "${hit.def.name}" vào giữa màn hình — ⌘Z để lùi.`;
    useCadStore.getState().setStatus(msg);
    pushLibraryToast(msg);
    return;
  }

  try {
    const entities = await insertBlockById(manifest!, hit.meta.id, at, { layer: 'l-furniture' });
    useCadStore.getState().addEntities(entities);
    const near = hit.approximate ? ` (gần đúng với "${item.name}")` : '';
    const msg = `Đã thả "${hit.meta.name}"${near} — ${entities.length} nét rời (block .dxf chưa giữ danh tính). ⌘Z để lùi.`;
    useCadStore.getState().setStatus(msg);
    pushLibraryToast(msg);
  } catch (err) {
    const msg = `Không mở được block "${hit.meta.name}": ${err instanceof Error ? err.message : String(err)}`;
    useCadStore.getState().setStatus(msg);
    pushLibraryToast(msg);
  }
}

export function LibraryDropBridge() {
  useEffect(() => {
    const onInstantiate = (ev: Event) => {
      const detail = (ev as CustomEvent<LibraryInstantiateDetail>).detail;
      if (!detail || typeof detail.name !== 'string') return;
      // Nhận việc NGAY (đồng bộ) để nơi phát không hiện câu "chưa thả xuống được"; kết quả thật
      // (thả được / chưa có hình) báo tiếp bằng toast + thanh trạng thái ngay sau đó.
      detail.claimed = true;
      // R1: chuyển tiếp specId đã chốt ở tầng UI (gán tay thắng khớp mã — xem LibrarySheet).
      // R8: kèm `detail.id` để nhận diện món `.idfc` (tiền tố "idfc:") — trường này LibrarySheet
      // vốn đã gửi sẵn trong detail (spread cả SheetItem), chỉ là trước nay không ai đọc.
      void dropItem(
        { name: detail.name, code: detail.code, kind: detail.kind, specId: detail.specId },
        detail.id,
      );
    };
    window.addEventListener(LIBRARY_INSTANTIATE_EVENT, onInstantiate);
    return () => window.removeEventListener(LIBRARY_INSTANTIATE_EVENT, onInstantiate);
  }, []);

  return null;
}
