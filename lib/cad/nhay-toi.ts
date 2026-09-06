/**
 * lib/cad/nhay-toi.ts — NHẢY TỚI MỘT ĐỐI TƯỢNG: chọn nó + đưa vào tầm nhìn.
 *
 * ⛔ VÌ SAO TÁCH RA (V6, 06/09): động tác này đã sống thật từ phiếu `focus-entity-2d-present` —
 * deep-link `?focusEntity=` của Bảng việc gọi `select([id])` rồi bắn `cad:goto-box`. Nhưng nó nằm
 * CHÌM trong một `useEffect` của `CadEditor.tsx` nên không nơi nào khác với tới được. Hệ quả đo
 * được: bảng "vật liệu này dùng ở 12 chỗ" bày ra con số mà **không đi tới được chỗ nào** — biết mà
 * không tới được thì con số chỉ để nhìn.
 *
 * Tách ở đây là CONNECT, không phải NEW: cùng một cặp `select` + `cad:goto-box`, cùng một khoảng
 * đệm, không đường thứ hai. `CadEditor` và bảng tác động vật liệu nay gọi chung hàm này.
 *
 * Thuần trình duyệt (đụng `window`), không React.
 */

import { entityBox, type Entity } from './model';
import { useCadStore } from './store';

/** Đệm 1.5m quanh đối tượng — thấy ngữ cảnh, không dí sát mép. */
const DEM_MM = 1500;

/** Đưa đúng một hộp world (mm) vào tầm nhìn. `CadCanvas` nghe `cad:goto-box`. */
export function bayToiHop(box: { minX: number; minY: number; maxX: number; maxY: number }, demMm = DEM_MM): boolean {
  if (!Number.isFinite(box.minX) || !Number.isFinite(box.maxX)) return false;
  window.dispatchEvent(new CustomEvent('cad:goto-box', {
    detail: { minX: box.minX - demMm, minY: box.minY - demMm, maxX: box.maxX + demMm, maxY: box.maxY + demMm },
  }));
  return true;
}

/**
 * Chọn `entityId` và bay tới nó. Trả `false` khi đối tượng KHÔNG còn trong bản vẽ — nơi gọi tự
 * quyết báo gì; hàm này không tự bịa toast, cũng không im lặng coi như đã nhảy.
 *
 * `status` để trống thì KHÔNG đụng dòng trạng thái (đường deep-link và đường bảng vật liệu muốn
 * nói hai câu khác nhau — ép chung một câu là một trong hai câu sẽ sai ngữ cảnh).
 */
export function nhayToiDoiTuong(entityId: string, status?: string): boolean {
  const st = useCadStore.getState();
  const ent: Entity | undefined = st.doc.entities.find((e) => e.id === entityId);
  if (!ent) return false;
  st.select([entityId]);
  bayToiHop(entityBox(ent));
  if (status) st.setStatus(status);
  return true;
}
