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
 * Hai đường thả, ưu tiên đường GIỮ DANH TÍNH:
 *  ① `BLOCKS` → tạo **`BlockEntity` thật** (đếm được · chọn được · gán `specId` được ⇒ lên BOQ
 *     được). Đây là lý do resolver ưu tiên kho này.
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
import { loadManifest, insertBlockById } from '@/lib/cad/block-library';
import { resolveLibraryItem, unresolvedMessage, type LibraryItemRef } from '@/lib/cad/library-item-resolve';

/** Chi tiết sự kiện: món trên kệ + cờ để nơi PHÁT biết đã có ai nhận chưa (đặt lại đồng bộ ngay
 * trong listener — `dispatchEvent` chạy đồng bộ nên nơi phát đọc được ngay sau khi gọi). */
export interface LibraryInstantiateDetail extends LibraryItemRef {
  claimed?: boolean;
}

/** Thả vào GIỮA khung nhìn hiện tại, không phải gốc toạ độ — cùng cách `ClusterPanel` làm (thả
 * vào gốc dễ chồng lên bản vẽ có sẵn và nằm ngoài màn hình). */
function dropPoint(): Pt {
  const st = useCadStore.getState();
  return screenToWorld(st.viewport, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
}

async function dropItem(item: LibraryItemRef): Promise<void> {
  const st = useCadStore.getState();
  const at = dropPoint();

  // manifest tải lười + cache theo phiên trang (`loadManifest`), hỏng mạng thì coi như chưa có
  // kho ② chứ không chặn kho ①.
  const manifest = await loadManifest().catch(() => null);
  const hit = resolveLibraryItem(item, manifest);

  if (!hit) {
    const msg = unresolvedMessage(item);
    st.setStatus(msg);
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
      void dropItem({ name: detail.name, code: detail.code, kind: detail.kind });
    };
    window.addEventListener(LIBRARY_INSTANTIATE_EVENT, onInstantiate);
    return () => window.removeEventListener(LIBRARY_INSTANTIATE_EVENT, onInstantiate);
  }, []);

  return null;
}
