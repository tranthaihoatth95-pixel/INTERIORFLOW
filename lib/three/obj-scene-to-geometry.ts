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

export interface BuiltGroup {
  name: string;
  geometry: THREE.BufferGeometry;
  colorHex: string;
}

function geometryOf(positions: number[]): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Gộp mọi group CÙNG MÀU thành 1 BufferGeometry — đúng "merge theo layer" spec yêu cầu khi FPS
 * chậm (§4 SPEC-3D-CORE). Trong lược đồ vật liệu hiện tại mỗi HỌ (tường/sàn/nội thất/phòng/cửa
 * sổ) đã dùng chung 1 màu phẳng — gộp theo màu tương đương gộp theo lớp, không mất chi tiết hình
 * ảnh (không PBR nên không có gì để phân biệt giữa 2 khối cùng màu ngoài hình dạng, vẫn giữ
 * nguyên qua concat vertex). Biến ~2000 object (worst case: 1 group/entity) thành ~6 draw call.
 */
export function buildMergedGeometries(scene: Scene3DData): BuiltGroup[] {
  const byColor = new Map<string, SceneGroup[]>();
  for (const g of scene.groups) {
    if (!g.positions.length) continue;
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
  return out;
}

/** 1 mesh/group riêng — dùng để bench so draw-call thật (xem scripts đo FPS 3D-1) hoặc debug
 * từng khối. KHÔNG dùng làm mặc định trong Scene3DViewer (quá nhiều draw call ở scene lớn). */
export function buildUnmergedGeometries(scene: Scene3DData): BuiltGroup[] {
  return scene.groups.filter((g) => g.positions.length > 0).map((g) => ({ name: g.name, geometry: geometryOf(g.positions), colorHex: g.colorHex }));
}
