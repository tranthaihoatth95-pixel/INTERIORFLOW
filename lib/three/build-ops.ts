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
import type { BuildOp } from '../cad/model';
import { cadToThreeM, type SceneGroup } from './cad-to-obj';
import { booleanOp } from './csg';

/** Dựng `BufferGeometry` thô từ mảng vị trí tam-giác-hoá phẳng (`SceneGroup.positions`) — không
 * CSG, không cache. Nơi DUY NHẤT tạo `BufferGeometry` từ dữ liệu `cad-to-obj.ts`, dùng chung cho
 * cả đường KHÔNG có `ops` (đa số) lẫn làm nguyên liệu đầu vào cho `resolveGroupGeometry` dưới. */
export function geometryOf(positions: number[] | Float32Array): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const arr = positions instanceof Float32Array ? positions : new Float32Array(positions);
  geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** NC-12 §4.2 tầng ④ "arrayLinear" — nhân bản `geom` thành `op.n` bản, mỗi bản dịch thêm
 * `i × (dx,dy,dz)` (mm, hệ CAD X-Y mặt bằng + Z cao độ) so bản trước. Dùng ĐÚNG phép đổi trục
 * `cadToThreeM` của `cad-to-obj.ts` (tuyến tính — áp được cho VECTOR dịch chuyển, không chỉ điểm
 * tuyệt đối, nên tái dùng thẳng thay vì tự viết công thức trục thứ hai). CHỈ NỐI hình học (concat
 * vị trí tam giác) — không CSG union: viewer preview không cần khối liền (SPEC-3D-CORE §6 "xám
 * trơn không PBR, đủ xem"), union N bản qua CSG tốn nhiều hơn hẳn mà không đổi gì nhìn thấy được. */
function repeatGeometry(geom: THREE.BufferGeometry, op: Extract<BuildOp, { op: 'arrayLinear' }>): THREE.BufferGeometry {
  const n = Math.max(1, Math.round(op.n));
  if (n <= 1) return geom;
  const flat = geom.index ? geom.toNonIndexed() : geom;
  const base = flat.attributes.position.array as ArrayLike<number>;
  const [stepX, stepY, stepZ] = cadToThreeM(op.dx, op.dy, op.dz);
  const out = new Float32Array(base.length * n);
  for (let i = 0; i < n; i++) {
    const ox = stepX * i;
    const oy = stepY * i;
    const oz = stepZ * i;
    const off = i * base.length;
    for (let v = 0; v < base.length; v += 3) {
      out[off + v] = base[v] + ox;
      out[off + v + 1] = base[v + 1] + oy;
      out[off + v + 2] = base[v + 2] + oz;
    }
  }
  return geometryOf(out);
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
 * Hình học CUỐI của 1 `SceneGroup`, ÁP `ops` boolean + arrayLinear nếu có (theo ĐÚNG thứ tự khai
 * trong `ops[]`: boolean trước, mảng SAU CÙNG — nhân bản khối ĐÃ khoét, không phải nhân bản rồi
 * khoét từng bản, khớp trực giác "modifier stack" đọc từ trên xuống của NC-12 §4.2). Group không
 * có `ops` (đa số — tường chưa khoét/chưa mảng, sàn, nội thất…) đi thẳng qua `geometryOf`, KHÔNG
 * cache (đã rẻ sẵn). Group có `ops`: cache theo `entityId` (rơi về `name` nếu thiếu — group có
 * `ops` luôn có `entityId` trong `cad-to-obj.ts` hôm nay, đây là lưới đỡ), vô hiệu khi
 * `hashGroup()` đổi.
 *
 * `op.op === 'extrude'` KHÔNG xử lý ở đây — bevel cần ĐA GIÁC gốc của entity (đã mất khi xuống
 * tới triangle soup `g.positions`), áp thẳng ở `cad-to-obj.ts` (`ObjBuilder.prismBeveled`, nơi
 * còn `h.points`) TRƯỚC khi hình học tới được `SceneGroup` này. `h` không dùng (mm cao khai báo
 * lúc đặt bevel — xem `setEntityBevel`, `lib/cad/commands.ts`).
 */
export function resolveGroupGeometry(g: SceneGroup): THREE.BufferGeometry {
  const booleans = g.ops?.filter((op) => op.op === 'boolean') ?? [];
  const arrayOp = g.ops?.find((op): op is Extract<BuildOp, { op: 'arrayLinear' }> => op.op === 'arrayLinear');
  if (!booleans.length && !arrayOp) return geometryOf(g.positions);

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
  if (arrayOp) geom = repeatGeometry(geom, arrayOp);
  meshCache.set(key, { hash, geom });
  return geom;
}
