/**
 * lib/three/build-recipe.ts — Đợt 4 (12/08/2026), phiếu `docs/phieu-giao/build-recipe.md`.
 * "Công Thức Khối" (BuildRecipe), CẤP 1 xuyên app (`docs/00-CHOT.md` chốt 11/08): biến `BuildOp`
 * từ "nướng chết" MỘT LẦN (`Base.ops[]`, ưu tiên CỐ ĐỊNH theo loại — xem `resolveGroupGeometry`
 * `build-ops.ts`) thành NGĂN XẾP THẬT kiểu 3ds Max/Blender modifier stack: mỗi bước tự bật/tắt,
 * tự id, đổi thứ tự tự do — sai 1 tham số sửa lại bước đó, không phải dựng lại từ đầu.
 *
 * Type `BuildRecipeStep`/`BuildRecipe` khai Ở `lib/cad/model.ts` (cạnh `BuildOp`), KHÔNG khai ở
 * đây — `model.ts` là lõi THUẦN, không phụ thuộc `three` dưới bất kỳ hình thức nào (kể cả
 * type-only import ngược), đúng ranh giới lớp đã ghi khắp `cad-to-obj.ts`. File này RE-EXPORT hai
 * type để nơi gọi vẫn `import { BuildRecipe, evalRecipe } from 'lib/three/build-recipe'` đúng
 * hợp đồng phiếu giao việc (mục ④.1).
 *
 * `evalRecipe` KHÔNG viết lại toán hình học — gọi thẳng các hàm THUẦN đã có ở `build-ops.ts`
 * (`prismTapered`/`prismBeveledEx`/`sweepProfile`/`revolveProfile`/`loftSections`/`arrayRadial`/
 * `mirrorGeometry`/`repeatGeometry`) + `booleanOp` (`csg.ts`). Khác `resolveGroupGeometry` ở CHỖ
 * DUY NHẤT: thứ tự ÁP DỤNG là thứ tự MẢNG `steps` (người dùng kéo lên/xuống ở UI), không phải ưu
 * tiên cố định theo loại op — đây chính là ý nghĩa "ngăn xếp" mà `ops[]` cũ không có.
 *
 * CHIỀU PHỤ THUỘC MỘT CHIỀU trong `lib/three/`: file này → `build-ops.ts`/`csg.ts`/`cad-to-obj.ts`.
 * KHÔNG sửa ngược `build-ops.ts` để nó gọi vào đây — sẽ tạo vòng lặp import (`build-ops.ts` ←→
 * `build-recipe.ts`). Nơi tiêu thụ THẬT (`obj-scene-to-geometry.ts`) gọi thẳng
 * `resolveSceneGroupGeometry` (export ở cuối file) thay vì `resolveGroupGeometry` — đó là chỗ
 * "đọc recipe khi có" mà mục ④.3 của phiếu yêu cầu.
 */
import * as THREE from 'three';
import type { BuildRecipe, BuildRecipeStep } from '../cad/model';
import type { SceneGroup } from './cad-to-obj';
import {
  geometryOf,
  prismBeveledEx,
  prismTapered,
  sweepProfile,
  revolveProfile,
  loftSections,
  arrayRadial,
  mirrorGeometry,
  repeatGeometry,
  resolveGroupGeometry,
} from './build-ops';
import { booleanOp } from './csg';

export type { BuildRecipe, BuildRecipeStep };

/** Hình học GỐC + số liệu context (cao độ đáy/đỉnh, cutter boolean) — CÙNG KHUÔN các field liên
 * quan của `SceneGroup` (`cad-to-obj.ts`) để `resolveSceneGroupGeometry` truyền thẳng không phải
 * dựng lại object. Tách riêng interface (không import cả `SceneGroup`) để `evalRecipe` dùng được
 * ở NGỮ CẢNH KHÁC SceneGroup sau này (vd UI xem-trước 1 bước trước khi ghi Doc). */
export interface BuildRecipeBase {
  /** hình học đáy đã tam-giác-hoá (mm CAD → mét three.js, KHÔNG index) — cùng khuôn
   * `SceneGroup.positions`. Với bước đầu là `extrude`/không có bước thay-hình-gốc, đây LÀ hình
   * dựng cuối của bước đó (base đã đùn theo `heightMm`, xem docstring `Base.ops` union `extrude`). */
  positions: number[] | Float32Array;
  /** cao độ ĐÁY (mm) — cần cho bậc thay-hình-gốc (taper/bevelEx) đọc z0/z1 SỐNG, cùng khuôn
   * `SceneGroup.baseMm`. undefined = 0. */
  baseMm?: number;
  /** cao độ (mm) — cùng khuôn `SceneGroup.heightMm`. undefined = 2700 (lưới đỡ, xem
   * `buildShapeGeometry` gốc ở `build-ops.ts`). */
  heightMm?: number;
  /** hình học cutter cho bậc `boolean`, khoá theo `withRef` — cùng khuôn `SceneGroup.opCutters`. */
  opCutters?: Record<string, number[]>;
}

export interface BuildRecipeResult {
  geometry: THREE.BufferGeometry;
  /** lỗi theo TỪNG BƯỚC (khoá = `step.id`). Bước có lỗi bị BỎ QUA (không crash, không âm thầm
   * ship geometry sai — luật vận hành 8 `docs/CLAUDE.md`); các bước SAU vẫn chạy bình thường. */
  stepErrors: Record<string, string>;
}

function isEmptyGeometry(g: THREE.BufferGeometry): boolean {
  return (g.attributes.position?.count ?? 0) === 0;
}

/**
 * Evaluator THUẦN (mục ④.2 phiếu): áp lần lượt các bước BẬT (`enabled:true`) trong `steps`, ĐÚNG
 * THỨ TỰ MẢNG — khác `resolveGroupGeometry` (ưu tiên cố định theo loại op). Bước `enabled:false`
 * bị BỎ QUA HOÀN TOÀN (không tính vào `stepErrors`, không ảnh hưởng geometry — tắt = tạm ẩn, giữ
 * nguyên tham số để bật lại sau, đúng tinh thần "mắt nhắm" của `opsDisabled` cũ).
 *
 * Quy tắc từng loại bước (bám sát ngữ nghĩa `resolveGroupGeometry`/`buildShapeGeometry` gốc):
 *  · `extrude` — base ĐÃ LÀ kết quả extrude, bước này không derive thêm (cùng docstring `BuildOp`).
 *  · `taper`/`bevelEx`/`sweep`/`revolve`/`loft` — THAY HẲN geometry hiện có bằng hình dựng từ tham
 *    số NƯỚNG trong chính op (không đọc geometry của bước trước). Tối đa 1 bước loại này CÓ TÁC
 *    DỤNG — bước thứ 2 trở đi (dù bật) bị coi là LỖI (`stepErrors`), không âm thầm bỏ qua như
 *    `resolveGroupGeometry` (N4) — ngăn xếp cho người dùng THẤY xung đột thay vì đoán hộ.
 *  · `boolean` — thiếu cutter (`withRef` không tra được trong `base.opCutters`) ⇒ lỗi, giữ nguyên
 *    geometry trước bước này (không sập, không đoán).
 *  · `mirror`/`arrayLinear`/`arrayRadial` — biến đổi geometry HIỆN CÓ, tích luỹ được nhiều bước.
 *  · Mọi bước ném exception (vd CSG boolean trên hình suy biến) ⇒ bắt lại, ghi `stepErrors`, KHÔNG
 *    làm hỏng các bước sau.
 */
export function evalRecipe(base: BuildRecipeBase, steps: BuildRecipeStep[]): BuildRecipeResult {
  const stepErrors: Record<string, string> = {};
  let geom: THREE.BufferGeometry | null = null;
  let shapeReplacedBy: string | null = null;

  for (const step of steps) {
    if (!step.enabled) continue;
    const op = step.op;
    try {
      switch (op.op) {
        case 'extrude': {
          if (!geom) geom = geometryOf(base.positions);
          break;
        }
        case 'taper':
        case 'bevelEx':
        case 'sweep':
        case 'revolve':
        case 'loft': {
          if (shapeReplacedBy) {
            stepErrors[step.id] = 'chỉ 1 bậc thay-hình-gốc có tác dụng mỗi lần — tắt bớt bậc trước để dùng bậc này';
            break;
          }
          const z0 = base.baseMm ?? 0;
          const z1 = z0 + (base.heightMm ?? 2700);
          let built: THREE.BufferGeometry;
          if (op.op === 'taper') built = prismTapered(op.polyMm, z0, z1, op.topInsetMm);
          else if (op.op === 'bevelEx') built = prismBeveledEx(op.polyMm, z0, z1, { radiusMm: op.radiusMm, segments: op.segments, edges: op.edges });
          else if (op.op === 'sweep') built = sweepProfile(op.profileMm, op.pathMm, { closed: op.closed });
          else if (op.op === 'revolve') built = revolveProfile(op.profileMm, { centerXMm: op.centerXMm, centerYMm: op.centerYMm, segments: op.segments, sweepDeg: op.sweepDeg });
          else built = loftSections(op.sections);
          if (isEmptyGeometry(built)) {
            stepErrors[step.id] = 'tham số hình học không hợp lệ (đa giác/tiết diện rỗng hoặc suy biến)';
            break;
          }
          geom = built;
          shapeReplacedBy = step.id;
          break;
        }
        case 'boolean': {
          if (!geom) geom = geometryOf(base.positions);
          const cutterPositions = base.opCutters?.[op.withRef];
          if (!cutterPositions || !cutterPositions.length) {
            stepErrors[step.id] = `không tìm thấy hình cắt cho withRef="${op.withRef}"`;
            break;
          }
          geom = booleanOp(geom, geometryOf(cutterPositions), op.kind);
          break;
        }
        case 'mirror': {
          if (!geom) geom = geometryOf(base.positions);
          geom = mirrorGeometry(geom, { axis: op.axis, atMm: op.atMm, withOriginal: op.withOriginal });
          break;
        }
        case 'arrayLinear': {
          if (!(op.n >= 1)) {
            stepErrors[step.id] = 'số bản (n) phải ≥ 1';
            break;
          }
          if (!geom) geom = geometryOf(base.positions);
          geom = repeatGeometry(geom, op);
          break;
        }
        case 'arrayRadial': {
          if (!(op.n >= 1)) {
            stepErrors[step.id] = 'số bản (n) phải ≥ 1';
            break;
          }
          if (!geom) geom = geometryOf(base.positions);
          geom = arrayRadial(geom, { n: op.n, centerXMm: op.centerXMm, centerYMm: op.centerYMm, sweepDeg: op.sweepDeg });
          break;
        }
        default: {
          const _exhaustive: never = op;
          void _exhaustive;
        }
      }
    } catch (e) {
      stepErrors[step.id] = e instanceof Error ? e.message : 'lỗi không xác định khi dựng bước này';
    }
  }

  return { geometry: geom ?? geometryOf(base.positions), stepErrors };
}

/**
 * Nơi tiêu thụ THẬT (mục ④.3 phiếu) — `obj-scene-to-geometry.ts` gọi hàm này THAY `resolveGroupGeometry`
 * trực tiếp. `recipe` có ít nhất 1 bước BẬT ⇒ THẮNG (ngăn xếp thứ tự người dùng chọn); không thì
 * lùi nguyên về đường cũ `ops[]` (`resolveGroupGeometry`, KHÔNG đổi hành vi file/entity chưa có
 * `recipe` — tương thích ngược tuyệt đối, đúng luật additive của field `Base.recipe`).
 *
 * KHÔNG cache ở đây (khác `resolveGroupGeometry` có `meshCache`) — `evalRecipe` là hàm thuần rẻ so
 * với chi phí CSG bên trong nó tự chịu; nơi gọi (hook `useMemo` ở `Scene3DViewer.tsx`, chạy lại
 * khi `scene` đổi chứ không phải mỗi frame) đã đủ chặn tính lại thừa. Thêm cache ở đây là tối ưu
 * sớm chưa có bằng chứng cần (đo — không đoán), để lại cho đợt sau nếu profiling thấy chậm thật. */
export function resolveSceneGroupGeometry(g: SceneGroup): THREE.BufferGeometry {
  const steps = g.recipe?.steps;
  if (steps?.some((s) => s.enabled)) {
    return evalRecipe({ positions: g.positions, baseMm: g.baseMm, heightMm: g.heightMm, opCutters: g.opCutters }, steps).geometry;
  }
  return resolveGroupGeometry(g);
}
