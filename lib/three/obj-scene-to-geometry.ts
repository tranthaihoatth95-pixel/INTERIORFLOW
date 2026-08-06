/**
 * lib/three/obj-scene-to-geometry.ts — Adapter TẦNG B (SPEC-3D-CORE.md §2 quyết định #2):
 * `Scene3DData` (từ `cad-to-obj.ts`) → `THREE.BufferGeometry`, VIẾT TAY — không parse ngược
 * `obj` text (đi vòng, `cad-to-obj.ts` đã có sẵn mảng vị trí tam-giác-hoá qua `groups`).
 *
 * File này import `three` tĩnh — CHỈ an toàn vì nơi gọi duy nhất (`Scene3DViewer.tsx`) luôn được
 * mount qua `next/dynamic(..., { ssr: false })`, nên Next tách chunk đúng chỗ (three ~170KB gzip
 * không lọt vào bundle chính — quyết định #1). KHÔNG import file này từ code tải khi mở app.
 */
import * as THREE from 'three';
import type { Scene3DData, SceneGroup } from './cad-to-obj';
import { geometryOf, resolveGroupGeometry } from './build-ops';

export interface BuiltGroup {
  name: string;
  geometry: THREE.BufferGeometry;
  colorHex: string;
}

/** Group có `ops` boolean cần CSG riêng (`resolveGroupGeometry`, `build-ops.ts`) — KHÔNG gộp
 * chung màu với group khác (gộp là concat `positions` thô, hình học đã boolean không còn là
 * mảng vị trí gốc để concat kiểu đó). Số tường có khoét thường vài chục, chấp nhận thêm vài draw
 * call như đã chấp nhận cho `buildMassingWalls`. */
function hasOpsGeometry(g: SceneGroup): boolean {
  return !!g.ops?.some((op) => op.op === 'boolean');
}

/**
 * Gộp mọi group CÙNG MÀU thành 1 BufferGeometry — đúng "merge theo layer" spec yêu cầu khi FPS
 * chậm (§4 SPEC-3D-CORE). Trong lược đồ vật liệu hiện tại mỗi HỌ (tường/sàn/nội thất/phòng/cửa
 * sổ) đã dùng chung 1 màu phẳng — gộp theo màu tương đương gộp theo lớp, không mất chi tiết hình
 * ảnh (không PBR nên không có gì để phân biệt giữa 2 khối cùng màu ngoài hình dạng, vẫn giữ
 * nguyên qua concat vertex). Biến ~2000 object (worst case: 1 group/entity) thành ~6 draw call.
 * NC-12 §4 — group có `ops` boolean tách riêng (xem `hasOpsGeometry`), dựng qua CSG thật, không
 * lọt vào đường concat này.
 */
export function buildMergedGeometries(scene: Scene3DData): BuiltGroup[] {
  const byColor = new Map<string, SceneGroup[]>();
  const opsGroups: SceneGroup[] = [];
  for (const g of scene.groups) {
    if (!g.positions.length) continue;
    if (hasOpsGeometry(g)) {
      opsGroups.push(g);
      continue;
    }
    const arr = byColor.get(g.colorHex);
    if (arr) arr.push(g);
    else byColor.set(g.colorHex, [g]);
  }
  const out: BuiltGroup[] = [];
  for (const [colorHex, groups] of byColor) {
    const total = groups.reduce((n, g) => n + g.positions.length, 0);
    const positions = new Array<number>(total);
    let off = 0;
    for (const g of groups) {
      for (let i = 0; i < g.positions.length; i++) positions[off + i] = g.positions[i];
      off += g.positions.length;
    }
    out.push({ name: `merged_${colorHex}`, geometry: geometryOf(positions), colorHex });
  }
  for (const g of opsGroups) {
    out.push({ name: g.name, geometry: resolveGroupGeometry(g), colorHex: g.colorHex });
  }
  return out;
}

/** 1 mesh/group riêng — dùng để bench so draw-call thật (xem scripts đo FPS 3D-1) hoặc debug
 * từng khối. KHÔNG dùng làm mặc định trong Scene3DViewer (quá nhiều draw call ở scene lớn). */
export function buildUnmergedGeometries(scene: Scene3DData): BuiltGroup[] {
  return scene.groups.filter((g) => g.positions.length > 0).map((g) => ({ name: g.name, geometry: geometryOf(g.positions), colorHex: g.colorHex }));
}

export interface MassingWall {
  entityId: string;
  /** cao độ (mm) ĐÃ dùng để đùn group này lúc `docToObjScene()` chạy — mốc gốc để tính scale khi
   * kéo-đẩy (3D-5), KHÔNG suy lại từ hình học. */
  baseHeightMm: number;
  /** 05/08 (S2 BUILD#1) — CỐT ĐÁY (mm) tường này đứng (`SceneGroup.baseMm`, giải từ
   * `computeHeights()`). 0 = cốt ±0.000 như trước. Push-pull PHẢI neo scale quanh cốt này chứ
   * không quanh gốc 0, nếu không tường tầng 2 vừa kéo cao vừa TRƯỢT XUỐNG khỏi sàn tầng đó. */
  baseMm: number;
  geometry: THREE.BufferGeometry;
  colorHex: string;
}

/** Group nào đủ điều kiện tách thành mesh push-pull riêng (mode `massing`) — PHẢI có `entityId`
 * (SPEC-TANG-DU-LIEU-CAU-KIEN §0.4/§8 Đ1, nay gán cho CẢ Furn_i/Window_i, không chỉ Wall_i) VÀ
 * `heightMm` (chỉ Wall_i có — cao độ đùn để tính scale khi kéo). Kiểm CẢ HAI, không chỉ
 * `entityId`, để Furn_i/Window_i (có entityId, KHÔNG có heightMm) không lọt vào đây lẫn bị loại
 * khỏi scene tĩnh — 1 hàm dùng chung cho `buildMassingWalls` VÀ `Scene3DViewer.tsx` (đúng luật
 * "1 nguồn", tránh 2 nơi tự đoán rồi lệch nhau như đã từng xảy ra với "tường"). */
export function isMassingWallGroup(g: SceneGroup): boolean {
  return g.entityId !== undefined && g.heightMm !== undefined;
}

/** 1 mesh/tường RIÊNG, gắn `entityId` — nền cho raycasting push-pull (3D-5, mode `massing`
 * `Scene3DViewer.tsx`). Chỉ tường (group có `entityId` VÀ `heightMm`, do `docToObjScene()` gắn)
 * — số lượng thường vài chục, không phải ~2000 entity toàn bản vẽ, nên KHÔNG cần gộp draw-call
 * như `buildMergedGeometries` (quyết định #2 SPEC-3D-CORE chỉ áp cho hiển thị TĨNH). */
export function buildMassingWalls(scene: Scene3DData): MassingWall[] {
  const out: MassingWall[] = [];
  for (const g of scene.groups) {
    if (!isMassingWallGroup(g) || !g.positions.length) continue;
    // NC-12 §4 — tường có `ops` boolean (đã khoét) phải hiện ĐÚNG hình cắt trong mode `massing`
    // luôn, không chỉ ở scene tĩnh (`buildMergedGeometries`) — dùng chung `resolveGroupGeometry`
    // để 2 đường không lệch nhau (luật K1 "một nguồn"). Kéo-đẩy (push-pull) sau đó scale.y mesh
    // này tạm thời méo hố khoét trong lúc kéo — chấp nhận được, `pointerup` ghi `heightMm` mới
    // vào Doc rồi `useScene3D()` tính lại `scene` → hình cắt đúng lại (xem Scene3DViewer.tsx).
    out.push({ entityId: g.entityId!, baseHeightMm: g.heightMm!, baseMm: g.baseMm ?? 0, geometry: resolveGroupGeometry(g), colorHex: g.colorHex });
  }
  return out;
}
