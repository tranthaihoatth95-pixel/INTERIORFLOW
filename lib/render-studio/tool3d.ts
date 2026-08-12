/**
 * lib/render-studio/tool3d.ts — MÁY TRẠNG THÁI CÔNG CỤ 3D [marker: Tool3DStateMachine]
 * (phiếu `docs/phieu-giao/tool-state-3d.md` ô④(1)-(2)).
 *
 * Mô hình: chọn tool → thao tác (nhập số ở Tool3DBar) → Enter áp + kết thúc · Esc huỷ + kết thúc
 * · Space về Chọn. GIZMO-FIRST GIỮ NGUYÊN — tool rời là ĐƯỜNG THÊM: gizmo/push-pull trên khối đang
 * chọn vẫn chạy y như cũ bất kể tool nào đang bật, `select` chỉ là trạng thái mặc định "không có
 * tool rời nào cầm tay".
 *
 * Vì sao THAO TÁC = NHẬP SỐ chứ chưa phải click-điểm trên khung nhìn: unproject con trỏ → mặt sàn
 * cần camera sống, camera sống nằm kín trong `components/three/Scene3DViewer` (NGOÀI vùng file
 * phiếu này — components/three không thuộc vùng). Nhập số đi đúng tinh thần SPEC-LENH-VE-IF
 * ("gõ số sau thao tác") và cùng khuôn lệnh Tường hai điểm sẵn có ở `Command3DPanel`. Đề xuất
 * mở API pick-mặt-sàn từ Scene3DViewer ghi ở báo cáo phiên, không tự nối.
 *
 * THUẦN + store mỏng (zustand, cùng khuôn `array-grid-ops.ts` không 'use client'):
 *  - phần thuần test được bằng sucrase-node (`tool3d.test.ts`);
 *  - mọi hàm dựng/biến đổi TÁI DÙNG engine chặng CAD (`wallSegmentOutline` · `translateEntity` ·
 *    `rotateEntity` · `ellipsePoints` · `entityBox`) — không chế hình học mới (luật "một cỗ máy,
 *    nhiều mặt tiền");
 *  - KHÔNG ghi vào Doc ở đây — trả Entity[]/updates, nơi gọi (Tool3DBar) ghi qua
 *    `useCadStore.addEntities/updateEntities` ⇒ vào lịch sử ⇒ Ctrl+Z lùi được (KS4).
 *
 * ⚠️ Khối vẽ ra (Đường/Chữ nhật/Vòng tròn) mang `elementType:'wall'`: đường đùn DUY NHẤT hôm nay
 * của `docToObjScene` (`cad-to-obj.ts:571-575`) chỉ đùn hatch được phân loại tường — muốn có
 * "khối massing chung" cần elementType mới ở `lib/cad/model.ts` (NGOÀI vùng, đề xuất trong báo
 * cáo). Nhãn UI nói thật: "khối dựng", không hứa hơn.
 */
import { create } from 'zustand';
import type { Entity, Pt } from '../cad/model';
import { entityBox } from '../cad/model';
import { translateEntity, rotateEntity, ellipsePoints } from '../cad/geometry';
import { wallSegmentOutline } from '../cad/commands';
import { newId } from '../cad/store';

/* ───────────────────────── trạng thái tool ───────────────────────── */

export const TOOL3D_IDS = ['select', 'line', 'rect', 'circle', 'move', 'rotate', 'dup', 'ruler'] as const;
export type Tool3DId = (typeof TOOL3D_IDS)[number];

/** Phím tắt 1 chữ → tool, ĐÚNG chữ đã in trên dock từ trước (V/L/R/C/M/Q/D/T). */
export const TOOL3D_HOTKEYS: Record<string, Tool3DId> = {
  v: 'select', l: 'line', r: 'rect', c: 'circle', m: 'move', q: 'rotate', d: 'dup', t: 'ruler',
};

/**
 * Chuyển trạng thái theo phím — THUẦN, một nguồn cho cả listener lẫn test:
 *  - Enter/Escape/Space khi đang cầm tool → về 'select' (Enter = nơi gọi ÁP trước rồi mới gọi);
 *  - chữ tắt → tool tương ứng (đổi tool trực tiếp, không phải qua 'select');
 *  - còn lại → null (không đổi gì).
 */
export function tool3dKeyTransition(active: Tool3DId, key: string): Tool3DId | null {
  if (key === 'Enter' || key === 'Escape' || key === ' ') {
    return active === 'select' ? null : 'select';
  }
  const next = TOOL3D_HOTKEYS[key.toLowerCase()];
  if (next && next !== active) return next;
  return null;
}

interface Tool3DState {
  active: Tool3DId;
  setActive: (t: Tool3DId) => void;
}

export const useTool3D = create<Tool3DState>((set) => ({
  active: 'select',
  setActive: (t) => set({ active: t }),
}));

/* ───────────────────────── vẽ khối đáy → đùn ───────────────────────── */

export interface BlockDrawOpts {
  heightMm: number;
  layer: string;
}

/** Cặp hatch(poché)+outline khép kín — CÙNG khuôn `wallSegmentOutline` (hatch.hostId = outline.id,
 * A3·G-M1-08: dời một nửa không rách khối). */
function polygonBlockEntities(points: Pt[], o: BlockDrawOpts): Entity[] {
  const outlineId = newId('e');
  return [
    { id: newId('e'), type: 'hatch', layer: o.layer, points, solid: true, elementType: 'wall', hostId: outlineId, heightMm: o.heightMm },
    { id: outlineId, type: 'polyline', layer: o.layer, points, closed: true, elementType: 'wall', heightMm: o.heightMm },
  ];
}

/** Tool Đường: dải khối 2 điểm × bề dày — TÁI DÙNG `wallSegmentOutline` (engine thật), chỉ đắp
 * `heightMm` để đùn (cùng cách `taoTuongMau` của skeleton). */
export function lineBlockEntities(from: Pt, to: Pt, thicknessMm: number, o: BlockDrawOpts): Entity[] {
  return wallSegmentOutline(from, to, thicknessMm, o.layer).map((e) => ({ ...e, heightMm: o.heightMm }));
}

/** Tool Chữ nhật: đáy w×d từ góc `at`, đùn cao `heightMm`. */
export function rectBlockEntities(at: Pt, wMm: number, dMm: number, o: BlockDrawOpts): Entity[] {
  const points: Pt[] = [
    { x: at.x, y: at.y },
    { x: at.x + wMm, y: at.y },
    { x: at.x + wMm, y: at.y + dMm },
    { x: at.x, y: at.y + dMm },
  ];
  return polygonBlockEntities(points, o);
}

/** Tool Vòng tròn: đáy tròn xấp xỉ N-gon (`ellipsePoints` — engine chặng CAD), đùn cao. */
export function circleBlockEntities(center: Pt, radiusMm: number, o: BlockDrawOpts, segments = 32): Entity[] {
  return polygonBlockEntities(ellipsePoints(center, radiusMm, radiusMm, segments), o);
}

/* ───────────────────── biến đổi khối đang chọn (Doc là nguồn) ───────────────────── */

/** Cụm entity đi cùng khối đang chọn — CÙNG luật hostId của gizmo (`Render3DModeSkeleton.
 * handleNudge`): chính nó + chủ (`hostId`) + mọi entity con bám vào chủ/chính nó. */
export function linkedSelectionIds(entities: Entity[], selectedId: string): Set<string> {
  const sel = entities.find((e) => e.id === selectedId);
  const ids = new Set<string>();
  if (!sel) return ids;
  ids.add(sel.id);
  if (sel.hostId) ids.add(sel.hostId);
  for (const e of entities) {
    if (e.hostId === sel.id || (sel.hostId && e.hostId === sel.hostId)) ids.add(e.id);
  }
  return ids;
}

/** Tool Di chuyển: dx/dy tịnh tiến (translateEntity), dz đổi cao độ đáy (`elevationMm`, kẹp ≥0 —
 * cùng luật trục Z của gizmo). Trả updates cho `updateEntities`; rỗng khi không tìm thấy. */
export function moveSelectionUpdates(entities: Entity[], selectedId: string, dxMm: number, dyMm: number, dzMm = 0): Entity[] {
  const ids = linkedSelectionIds(entities, selectedId);
  if (!ids.size) return [];
  return entities
    .filter((e) => ids.has(e.id))
    .map((e) => {
      const moved = dxMm !== 0 || dyMm !== 0 ? translateEntity(e, dxMm, dyMm) : e;
      return dzMm !== 0 ? { ...moved, elevationMm: Math.max(0, (e.elevationMm ?? 0) + dzMm) } : moved;
    });
}

/** Tool Xoay: quay cả cụm quanh TÂM BBOX của entity đang chọn (`entityBox` — engine thật),
 * góc dương = ngược chiều kim đồng hồ (hệ Y-Bắc của Doc). */
export function rotateSelectionUpdates(entities: Entity[], selectedId: string, angleDeg: number): Entity[] {
  const sel = entities.find((e) => e.id === selectedId);
  if (!sel || angleDeg === 0) return [];
  const b = entityBox(sel);
  if (!Number.isFinite(b.minX)) return [];
  const c: Pt = { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
  const ang = (angleDeg * Math.PI) / 180;
  const ids = linkedSelectionIds(entities, selectedId);
  return entities.filter((e) => ids.has(e.id)).map((e) => rotateEntity(e, c, ang));
}

/** Tool Nhân bản: chép cả cụm, dời dx/dy, id MỚI và `hostId` REMAP theo cặp mới (khác
 * `pasteEntities` — hàm đó giữ hostId cũ nên bản sao vẫn neo vào khối gốc, dời là rách). */
export function duplicateSelectionEntities(entities: Entity[], selectedId: string, dxMm: number, dyMm: number): Entity[] {
  const ids = linkedSelectionIds(entities, selectedId);
  if (!ids.size) return [];
  const originals = entities.filter((e) => ids.has(e.id));
  const idMap = new Map(originals.map((e) => [e.id, newId('e')]));
  return originals.map((e) => {
    const moved = translateEntity(e, dxMm, dyMm);
    const newHost = e.hostId ? idMap.get(e.hostId) : undefined;
    return { ...moved, id: idMap.get(e.id)!, ...(e.hostId ? { hostId: newHost ?? e.hostId } : {}) };
  });
}

/* ───────────────────────── thước đo ───────────────────────── */

export interface SelectionMeasure {
  wMm: number;
  dMm: number;
  /** null khi khối không khai `heightMm` (chưa đùn) — nói thật, không bịa 2700. */
  hMm: number | null;
}

/** Tool Thước: đo bbox đáy (W×D) + cao đã đùn của cụm khối đang chọn — số THẬT từ Doc. */
export function measureSelection(entities: Entity[], selectedId: string): SelectionMeasure | null {
  const ids = linkedSelectionIds(entities, selectedId);
  if (!ids.size) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hMm: number | null = null;
  for (const e of entities) {
    if (!ids.has(e.id)) continue;
    const b = entityBox(e);
    if (Number.isFinite(b.minX)) {
      minX = Math.min(minX, b.minX);
      minY = Math.min(minY, b.minY);
      maxX = Math.max(maxX, b.maxX);
      maxY = Math.max(maxY, b.maxY);
    }
    if (e.heightMm !== undefined) hMm = Math.max(hMm ?? 0, e.heightMm);
  }
  if (!Number.isFinite(minX)) return null;
  return { wMm: Math.round(maxX - minX), dMm: Math.round(maxY - minY), hMm };
}
