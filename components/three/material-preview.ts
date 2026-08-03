// components/three/material-preview.ts — QUẢ CẦU XEM TRƯỚC VẬT LIỆU (G4, SPEC-VAT-LIEU-PBR-IF §2).
//
// Vì sao cầu: một quả cầu cho thấy mọi hướng pháp tuyến cùng lúc — tâm = phản xạ trực diện (F0),
// rìa = Fresnel falloff (chính V-Ray cũng render preview bằng cầu). Ba cảnh Cầu/Sàn/Vải học từ
// V-Ray Asset Editor, tự chọn theo danh mục (xem `sceneForKind`).
//
// LUẬT RẺ (bài học FPS ở SPEC-3D-CORE): MỘT renderer + MỘT env PMREM (RoomEnvironment — studio
// light, không cần tải HDRI) DÙNG CHUNG cho mọi quả cầu; mỗi lần render chỉ swap material rồi
// chụp PNG. Kết quả cache theo hash(params) trong Map — component chỉ nhận dataURL, không giữ
// canvas WebGL nào sống (không đội draw call).
//
// ⚠️ PBR THẬT chưa có trong catalog (schema matId+PBR là việc PHU, SO-KIEM-TONG §3 PHU-4).
// Tạm suy tham số từ LOẠI bề mặt (gỗ/đá/kim loại/sơn/vải/kính) + 2 màu gradient sẵn có của
// swatch — khi PHU xong schema thì thay `specFromKind` bằng đọc PBR thật, chỗ khác giữ nguyên.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type PreviewKind = 'wood' | 'stone' | 'metal' | 'paint' | 'fabric' | 'glass';
export type PreviewScene = 'sphere' | 'floor' | 'fabric';

export interface PreviewSpec {
  /** khoá cache — matId hoặc code món (duy nhất trong catalog đang xem). */
  id: string;
  /** 2 màu đầu-cuối của gradient swatch sẵn có (#rrggbb). */
  colorA: string;
  colorB: string;
  kind: PreviewKind;
  scene?: PreviewScene; // bỏ trống = tự chọn theo kind
}

/** matId ATLAS mock: W- gỗ · S- đá · M- kim loại · P- sơn · F- vải · G- kính. */
export function kindFromMatId(matId: string): PreviewKind {
  const p = matId[0]?.toUpperCase();
  return p === 'W' ? 'wood' : p === 'S' ? 'stone' : p === 'M' ? 'metal' : p === 'F' ? 'fabric' : p === 'G' ? 'glass' : 'paint';
}

/** Cảnh theo danh mục (V-Ray có Generic/Fabric/Floor…): vải → Vải; còn lại mặc định Cầu.
 * `floorHint` = món rõ nghĩa lát sàn (gạch/lát/sàn) — danh mục ATLAS thật nối sau. */
export function sceneForKind(kind: PreviewKind, floorHint = false): PreviewScene {
  if (kind === 'fabric') return 'fabric';
  if (floorHint) return 'floor';
  return 'sphere';
}

/** Rút 2 mã màu #hex đầu tiên từ chuỗi gradient CSS — dùng cho catalog chỉ có swatch. */
export function colorsFromGradient(gradient: string): [string, string] {
  const hex = gradient.match(/#[0-9a-fA-F]{3,8}/g);
  return [hex?.[0] ?? '#888888', hex?.[1] ?? hex?.[0] ?? '#666666'];
}

/** Loại bề mặt suy từ TÊN (ATLAS `ProductSpec` chưa có cột PBR/danh mục máy đọc được) —
 * vi + en, sai thì rơi về 'paint' (bề mặt mờ trung tính, không bao giờ trông sai hẳn). */
export function kindFromName(name: string): PreviewKind {
  const n = name.toLowerCase();
  if (/gỗ|wood|oak|walnut|ash|veneer/.test(n)) return 'wood';
  if (/đá|stone|marble|granite|travertine|terrazzo|gạch|tile|ceramic/.test(n)) return 'stone';
  if (/thép|steel|đồng|brass|nhôm|alumin|metal|inox|sắt|iron|copper/.test(n)) return 'metal';
  if (/vải|fabric|linen|nhung|velvet|len|wool|da |leather/.test(n)) return 'fabric';
  if (/kính|glass|gương|mirror/.test(n)) return 'glass';
  return 'paint';
}

/** Màu thứ hai khi nguồn chỉ có 1 mã màu (vd. `colorHex` ATLAS) — tối đi ~28% cho quả cầu có tông. */
export function darken(hex: string, factor = 0.72): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ---- lõi render dùng chung (singleton, lazy — SSR không đụng WebGL) ----

interface Rig {
  renderer: THREE.WebGLRenderer;
  env: THREE.Texture;
  scenes: Partial<Record<PreviewScene, { scene: THREE.Scene; camera: THREE.PerspectiveCamera; target: THREE.Mesh }>>;
}

let rig: Rig | null | false = null; // false = WebGL hỏng, đừng thử lại mãi

function getRig(): Rig | null {
  if (rig === false) return null;
  if (rig) return rig;
  if (typeof window === 'undefined') return null;
  try {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    rig = { renderer, env, scenes: {} };
    return rig;
  } catch {
    rig = false; // vd. WebGL bị tắt — caller rơi về swatch phẳng
    return null;
  }
}

function buildScene(r: Rig, type: PreviewScene) {
  const scene = new THREE.Scene();
  scene.environment = r.env;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  let target: THREE.Mesh;
  if (type === 'floor') {
    // mặt phẳng nhìn phối cảnh thấp — cho gạch/gỗ lát đọc được vân chạy sâu
    target = new THREE.Mesh(new THREE.PlaneGeometry(6, 6));
    target.rotation.x = -Math.PI / 2;
    // khung chặt, mắt thấp: mặt sàn ĂN KÍN khung. Khung rộng hơn (verify 04/08) để lọt mảng trống
    // phía trên đường chân trời → ô trông như thẻ rỗng, không ra "sàn".
    camera.position.set(0, 0.62, 1.35);
    camera.lookAt(0, 0, -0.75);
  } else if (type === 'fabric') {
    // "khối phủ vải": cầu dẹt như nệm — đường cong mềm cho sheen/roughness vải
    target = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32));
    target.scale.set(1.15, 0.62, 1.05);
    camera.position.set(0, 0.7, 4.3);
    camera.lookAt(0, 0, 0);
  } else {
    target = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32));
    camera.position.set(0, 0, 4.6);
    camera.lookAt(0, 0, 0);
  }
  // KHUNG HÌNH (sửa 04/08): fov 32° ở khoảng cách 3.05 chỉ thấy cao 1.75 đơn vị < đường kính cầu
  // (2.0) ⇒ quả cầu TRÀN khung, ô xem trước thành hình vuông bo góc, mất hẳn rìa Fresnel — thứ
  // làm quả cầu có nghĩa. Lùi camera ra 4.6 để cầu chiếm ~77% khung, còn viền thở.
  scene.add(target);
  r.scenes[type] = { scene, camera, target };
  return r.scenes[type]!;
}

/** texture 2 tông từ cặp màu gradient — cho quả cầu không bị 1 màu bẹt. */
function twoToneTexture(a: string, b: string): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 64, 64);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Tham số PBR suy từ loại bề mặt — thay bằng schema PHU khi có (ghi chú đầu file). */
function materialFromSpec(spec: PreviewSpec): THREE.MeshPhysicalMaterial {
  const m = new THREE.MeshPhysicalMaterial({ map: twoToneTexture(spec.colorA, spec.colorB) });
  switch (spec.kind) {
    case 'wood': m.roughness = 0.55; m.metalness = 0; break;
    case 'stone': m.roughness = 0.32; m.metalness = 0; break;
    case 'metal': m.roughness = 0.34; m.metalness = 1; break;
    case 'paint': m.roughness = 0.82; m.metalness = 0; break;
    case 'fabric': m.roughness = 0.95; m.metalness = 0; m.sheen = 1; m.sheenRoughness = 0.6; m.sheenColor = new THREE.Color(spec.colorA); break;
    case 'glass': m.roughness = 0.18; m.metalness = 0; m.transmission = 0.85; m.thickness = 0.6; m.transparent = true; break;
  }
  return m;
}

const cache = new Map<string, string>();

/**
 * Render 1 lần / lần đổi tham số → PNG dataURL, cache theo hash(params).
 * `resolution`: nấc phân giải kiểu V-Ray (lưới cuộn 0.25 · panel chi tiết 1) — van chi phí.
 * Trả null khi WebGL không có (caller giữ swatch phẳng làm fallback).
 */
export function renderMaterialPreview(spec: PreviewSpec, size = 96, resolution: 0.25 | 0.5 | 1 = 1): string | null {
  // Nấc phân giải vẫn là van chi phí, nhưng phải nhân DPR và có SÀN — verify 04/08 cho thấy
  // 120px ô × nấc 25% = 30px nguồn, phóng lên màn Retina thành vệt mờ, mất hẳn highlight/Fresnel
  // (đúng thứ khiến quả cầu có nghĩa). Cache theo key nên mỗi tham số chỉ render 1 lần ⇒ sàn 96px
  // rẻ hơn nhiều so với cái giá "ảnh xấu".
  const dpr = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  const px = Math.max(96, Math.round(size * resolution * dpr));
  const key = `${spec.id}|${spec.scene ?? 'auto'}|${spec.kind}|${spec.colorA}|${spec.colorB}|${px}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const r = getRig();
  if (!r) return null;
  const sceneType = spec.scene ?? sceneForKind(spec.kind);
  const s = r.scenes[sceneType] ?? buildScene(r, sceneType);

  const mat = materialFromSpec(spec);
  s.target.material = mat;
  r.renderer.setSize(px, px, false);
  r.renderer.render(s.scene, s.camera);
  const url = r.renderer.domElement.toDataURL('image/png');
  // dọn tài nguyên theo lượt render — renderer/env/geometry giữ lại (dùng chung), material/map bỏ
  (mat.map as THREE.Texture | null)?.dispose();
  mat.dispose();
  cache.set(key, url);
  return url;
}
