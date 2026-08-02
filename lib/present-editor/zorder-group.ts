/**
 * lib/present-editor/zorder-group.ts — z-order CẢ CỤM khi đang chọn NHIỀU phần tử (chốt
 * `docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md` mục "z-order nhóm", 04/08): Tiến/Lùi 1 bậc dịch
 * CẢ CỤM đã chọn CÙNG NHAU — nhảy qua ĐÚNG 1 "khối" liền kề KHÔNG được chọn, giữ NGUYÊN thứ tự
 * tương đối giữa các phần tử ĐÃ chọn (chuẩn Figma multi-select z-order — không xé lẻ, không đảo
 * lộn cụm). front/back: gom hết phần tử đã chọn (giữ thứ tự tương đối) rồi đẩy nguyên khối ra
 * đầu/cuối mảng, các phần tử còn lại cũng giữ nguyên thứ tự tương đối với nhau.
 *
 * TRƯỚC ĐÂY (`PresentEditor.tsx#onZOrder` gốc) chỉ đọc `ed.selectedId` (= phần tử ĐƯỢC CHỌN
 * CUỐI CÙNG trong `selectedIds`, xem `useEditor.ts`) — khi đang multi-select, bấm Tiến/Lùi chỉ
 * dịch ĐÚNG 1 phần tử đó, các phần tử khác trong lô chọn im lìm (bug ngầm, không báo lỗi). Hàm ở
 * đây thay thế hoàn toàn logic cũ, ăn `selectedIds: string[]` (mảng, luôn đúng dù chọn 1 hay
 * nhiều) — với `selectedIds.length === 1` cho kết quả Y HỆT thuật toán đơn-phần-tử gốc (đơn là
 * trường hợp riêng của thuật toán chung).
 *
 * Tách THUẦN (không đụng DOM) để test bằng sucrase-node, cùng chỗ đứng với `resize-group.ts`.
 */

export interface ZOrderable {
  id: string;
}

/**
 * Sắp lại `elements` theo hướng `dir`, coi TOÀN BỘ `selectedIds` là 1 lô di chuyển cùng nhau.
 * Trả mảng MỚI (không mutate `elements` truyền vào — caller tự gán lại, khớp quy ước
 * `scaleMemberFrame`/`groupBoundingBox` ở `resize-group.ts`). `selectedIds` rỗng → trả nguyên
 * `elements` không đổi gì.
 */
export function reorderZOrderGroup<T extends ZOrderable>(
  elements: T[],
  selectedIds: string[],
  dir: 'front' | 'back' | 'forward' | 'backward',
): T[] {
  const selSet = new Set(selectedIds);
  if (selSet.size === 0) return elements;
  const arr = elements.slice();

  if (dir === 'front' || dir === 'back') {
    const selected = arr.filter((e) => selSet.has(e.id));
    const rest = arr.filter((e) => !selSet.has(e.id));
    return dir === 'front' ? [...rest, ...selected] : [...selected, ...rest];
  }

  // forward/backward — gom các phần tử ĐÃ CHỌN thành từng KHỐI liền kề (run) trong mảng gốc;
  // mỗi khối dịch 1 bậc bằng cách hoán đổi với ĐÚNG 1 phần tử KHÔNG được chọn ngay sát nó.
  const runs: { start: number; end: number }[] = []; // end = chỉ số NGAY SAU khối (exclusive)
  let i = 0;
  while (i < arr.length) {
    if (selSet.has(arr[i].id)) {
      const start = i;
      while (i < arr.length && selSet.has(arr[i].id)) i++;
      runs.push({ start, end: i });
    } else {
      i++;
    }
  }
  if (runs.length === 0) return arr;

  if (dir === 'forward') {
    // Xử lý từ khối CUỐI mảng về khối ĐẦU — thao tác trên khối r chỉ đụng chỉ số trong
    // [start_r, end_r], LUÔN nằm SAU end của mọi khối đứng trước nó (runs rời rạc, cách nhau
    // ≥1 phần tử không-chọn) → xử lý ngược không làm lệch chỉ số các khối chưa xử lý.
    for (let r = runs.length - 1; r >= 0; r--) {
      const { start, end } = runs[r];
      if (end >= arr.length) continue; // khối đã sát đỉnh (cuối mảng) — không dịch được nữa
      const neighbor = arr[end];
      arr.splice(end, 1); // bỏ phần tử liền sau khối ra
      arr.splice(start, 0, neighbor); // chèn lại NGAY TRƯỚC khối → khối dịch lên đúng 1 bậc
    }
  } else {
    // backward — đối xứng: xử lý từ khối ĐẦU mảng về khối CUỐI (an toàn chỉ số tương tự).
    for (let r = 0; r < runs.length; r++) {
      const { start, end } = runs[r];
      if (start <= 0) continue; // khối đã sát đáy — không dịch được nữa
      const neighbor = arr[start - 1];
      arr.splice(start - 1, 1); // bỏ phần tử liền trước khối ra
      arr.splice(end - 1, 0, neighbor); // chèn lại NGAY SAU khối (end đã lùi 1 do splice trên)
    }
  }
  return arr;
}
