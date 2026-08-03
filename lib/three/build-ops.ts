/**
 * lib/three/build-ops.ts — NC-12 §4.3 "ống kính 3D chạy `ops` ra sao": lấy hình học GỐC (đã đùn
 * theo `heightMm`, `positions` của `SceneGroup` — `cad-to-obj.ts`) rồi chạy lần lượt các bậc
 * `BuildOp` boolean cần CSG (`extrude`/`arrayLinear` không cần logic riêng ở đây, xem docstring
 * `Base.ops` trong `lib/cad/model.ts`).
 *
 * CACHE ĐẶT ĐÚNG CHỖ NC-12 §4.3 yêu cầu: `Map` bên TRONG module này (runtime, KHÔNG ghi vào
 * `Doc`/`.idf` — kho thứ hai bị cấm bởi K1), khoá theo `entityId`, giá trị vô hiệu khi băm
 * (hình học gốc + ops) đổi. Cache RỖNG khi khởi động lại — mở file lại tính lại, đúng ý.
 *
 * Import `three`/`three-bvh-csg` (qua `csg.ts`) TĨNH — cùng ràng buộc an toàn với
 * `obj-scene-to-geometry.ts` (chỉ gọi từ nhánh `next/dynamic(ssr:false)`).
 */
import * as THREE from 'three';
import type { SceneGroup } from './cad-to-obj';
import { booleanOp } from './csg';

/** Dựng `BufferGeometry` thô từ mảng vị trí tam-giác-hoá phẳng (`SceneGroup.positions`) — không
 * CSG, không cache. Nơi DUY NHẤT tạo `BufferGeometry` từ dữ liệu `cad-to-obj.ts`, dùng chung cho
 * cả đường KHÔNG có `ops` (đa số) lẫn làm nguyên liệu đầu vào cho `resolveGroupGeometry` dưới. */
export function geometryOf(positions: number[]): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Băm rẻ tiền để phát hiện ĐỔI (không phải hash mật mã) — lấy mẫu mỗi 37 phần tử thay vì duyệt
 * hết mảng (tường lớn có thể vài chục nghìn số), đủ để cache không trả nhầm khi hình học/ops đổi
 * trong mọi ca thực tế của app này (sửa 1 tham số luôn đổi `length` hoặc giá trị số các mẫu). */
function fingerprint(arr: number[]): string {
  if (!arr.length) return '0';
  let acc = arr.length;
  for (let i = 0; i < arr.length; i += 37) acc = (acc * 31 + Math.round(arr[i] * 1000)) | 0;
  return `${arr.length}:${acc}`;
}

function hashGroup(g: SceneGroup): string {
  const opsPart = JSON.stringify(g.ops ?? []);
  const basePart = fingerprint(g.positions);
  const cuttersPart = g.opCutters
    ? Object.keys(g.opCutters)
        .sort()
        .map((k) => `${k}:${fingerprint(g.opCutters![k])}`)
        .join('|')
    : '';
  return `${opsPart}#${basePart}#${cuttersPart}`;
}

const meshCache = new Map<string, { hash: string; geom: THREE.BufferGeometry }>();

/**
 * Hình học CUỐI của 1 `SceneGroup`, ÁP ops boolean nếu có. Group không có `ops` (đa số — tường
 * chưa khoét, sàn, nội thất…) đi thẳng qua `geometryOf`, KHÔNG cache (đã rẻ sẵn). Group có `ops`
 * chứa bậc `boolean`: cache theo `entityId` (rơi về `name` nếu thiếu — group có `ops` luôn có
 * `entityId` trong `cad-to-obj.ts` hôm nay, đây là lưới đỡ), vô hiệu khi `hashGroup()` đổi.
 *
 * `op.op === 'extrude' | 'arrayLinear'` bị BỎ QUA ở đây theo đúng khai báo trong `Base.ops`
 * (`lib/cad/model.ts`): `extrude` đã phản ánh trong `g.positions` (đùn theo `heightMm` từ
 * `docToObjScene`); `arrayLinear` mới khai TYPE, chưa có UI sinh ra op này (N5) nên chưa nối derive
 * — khai ở đây để phiên sau thấy ngay chỗ cần nối, không phải đoán.
 */
export function resolveGroupGeometry(g: SceneGroup): THREE.BufferGeometry {
  const booleans = g.ops?.filter((op) => op.op === 'boolean') ?? [];
  if (!booleans.length) return geometryOf(g.positions);

  const key = g.entityId ?? g.name;
  const hash = hashGroup(g);
  const cached = meshCache.get(key);
  if (cached && cached.hash === hash) return cached.geom;

  let geom = geometryOf(g.positions);
  for (const op of booleans) {
    if (op.op !== 'boolean') continue;
    const cutterPositions = g.opCutters?.[op.withRef];
    if (!cutterPositions || !cutterPositions.length) continue; // withRef không tra được — giữ hình học trước đó, không sập
    const cutterGeom = geometryOf(cutterPositions);
    geom = booleanOp(geom, cutterGeom, op.kind);
  }
  meshCache.set(key, { hash, geom });
  return geom;
}
