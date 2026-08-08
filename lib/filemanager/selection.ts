// lib/filemanager/selection.ts — LOGIC CHỌN NHIỀU thuần (không DOM, không React) cho màn Files.
//
// Vì sao tách ra đây: `docs/SPEC-MAT-DO-CON-TRO.md` §2/§4 — desktop thiếu hẳn từ vựng chuột+bàn
// phím (shift-click chọn dải · ⌘-click thêm/bớt · mũi tên di chuyển tiêu điểm). Luật shift/anchor
// có nhiều ca biên (anchor đã bị lọc mất, focus ngoài danh sách, mũi tên ở mép) nên phải là hàm
// thuần test được bằng `npx tsx`, không trộn vào FileManagerShell.
//
// Mô hình theo Finder/Explorer:
// - `anchorId`  = mốc của dải shift (đặt lại ở mỗi cú click KHÔNG-shift).
// - `focusId`   = mục đang có tiêu điểm bàn phím (mũi tên dời nó).
// - `selectedIds` giữ THỨ TỰ chọn (⌘-click thêm vào cuối) — dải shift thì theo thứ tự danh sách.
// Danh sách `ids` truyền vào là danh sách ĐANG HIỂN THỊ (đã qua tìm/lọc) — dải chọn phải theo
// mắt người dùng thấy, không theo dữ liệu gốc.

export interface SelectionState {
  selectedIds: string[];
  anchorId: string | null;
  focusId: string | null;
}

export const EMPTY_SELECTION: SelectionState = { selectedIds: [], anchorId: null, focusId: null };

/** Dải [a..b] theo thứ tự danh sách, bất kể chiều kéo. */
function rangeIds(ids: string[], fromId: string, toId: string): string[] {
  const a = ids.indexOf(fromId);
  const b = ids.indexOf(toId);
  if (a < 0 || b < 0) return toId ? [toId] : [];
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  return ids.slice(lo, hi + 1);
}

/**
 * Click chuột lên 1 mục.
 * - thường: chọn đúng 1 mục, đặt anchor+focus.
 * - `toggle` (⌘/Ctrl): thêm/bớt mục khỏi tập chọn, anchor dời theo (đúng Finder).
 * - `shift`: chọn dải từ anchor tới mục bấm, GIỮ anchor (kéo dải tiếp vẫn từ mốc cũ);
 *   anchor không còn trong danh sách (bị lọc mất) thì mục bấm tự thành mốc.
 */
export function clickSelect(
  ids: string[],
  state: SelectionState,
  targetId: string,
  mods: { shift?: boolean; toggle?: boolean } = {},
): SelectionState {
  if (!ids.includes(targetId)) return state;
  if (mods.shift) {
    const anchor = state.anchorId && ids.includes(state.anchorId) ? state.anchorId : targetId;
    return { selectedIds: rangeIds(ids, anchor, targetId), anchorId: anchor, focusId: targetId };
  }
  if (mods.toggle) {
    const has = state.selectedIds.includes(targetId);
    return {
      selectedIds: has ? state.selectedIds.filter((i) => i !== targetId) : [...state.selectedIds, targetId],
      anchorId: targetId,
      focusId: targetId,
    };
  }
  return { selectedIds: [targetId], anchorId: targetId, focusId: targetId };
}

/**
 * Mũi tên dời tiêu điểm `delta` bước (âm = lùi). KẸP Ở MÉP — không vòng (wrap) vì danh sách file
 * không phải carousel; đứng ở mục cuối bấm xuống thì đứng yên, đúng Finder.
 * - chưa có focus: delta dương vào mục ĐẦU, âm vào mục CUỐI (đi vào từ mép gần hướng bấm).
 * - `extend` (Shift+mũi tên): nới dải từ anchor tới focus mới; thường: chọn đúng 1 mục mới.
 */
export function moveFocus(
  ids: string[],
  state: SelectionState,
  delta: number,
  extend = false,
): SelectionState {
  if (ids.length === 0) return EMPTY_SELECTION;
  const cur = state.focusId ? ids.indexOf(state.focusId) : -1;
  const next = cur < 0
    ? (delta >= 0 ? 0 : ids.length - 1)
    : Math.min(ids.length - 1, Math.max(0, cur + delta));
  const nextId = ids[next];
  if (extend) {
    const anchor = state.anchorId && ids.includes(state.anchorId) ? state.anchorId : nextId;
    return { selectedIds: rangeIds(ids, anchor, nextId), anchorId: anchor, focusId: nextId };
  }
  return { selectedIds: [nextId], anchorId: nextId, focusId: nextId };
}

/**
 * Chuột phải lên 1 mục: mục ĐÃ nằm trong tập chọn thì GIỮ NGUYÊN tập (menu áp cho cả cụm,
 * đúng Finder/Explorer); chưa nằm trong thì chọn lại đúng 1 mục đó.
 */
export function contextSelect(ids: string[], state: SelectionState, targetId: string): SelectionState {
  if (!ids.includes(targetId)) return state;
  if (state.selectedIds.includes(targetId)) return { ...state, focusId: targetId };
  return { selectedIds: [targetId], anchorId: targetId, focusId: targetId };
}

/** Danh sách đổi (lọc/tìm/đổi thư mục) → gạt id không còn hiển thị khỏi tập chọn. */
export function pruneSelection(ids: string[], state: SelectionState): SelectionState {
  const keep = new Set(ids);
  const selectedIds = state.selectedIds.filter((i) => keep.has(i));
  if (
    selectedIds.length === state.selectedIds.length &&
    (state.anchorId === null || keep.has(state.anchorId)) &&
    (state.focusId === null || keep.has(state.focusId))
  ) {
    return state; // không đổi gì → trả nguyên tham chiếu, tránh re-render thừa
  }
  return {
    selectedIds,
    anchorId: state.anchorId && keep.has(state.anchorId) ? state.anchorId : null,
    focusId: state.focusId && keep.has(state.focusId) ? state.focusId : null,
  };
}
