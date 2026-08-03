// components/three/material-preview.ts — QUẢ CẦU XEM TRƯỚC VẬT LIỆU (G4, SPEC-VAT-LIEU-PBR-IF §2 + §2c).
//
// Vì sao cầu: một quả cầu cho thấy mọi hướng pháp tuyến cùng lúc — tâm = phản xạ trực diện (F0),
// rìa = Fresnel falloff (chính V-Ray cũng render preview bằng cầu). Công thức khung hình §2c
// (nền xám radial · bóng tiếp đất · fov 30 · NeutralToneMapping) học từ bảng vật liệu V-Ray/D5.
//
// LUẬT RẺ (bài học FPS ở SPEC-3D-CORE): MỘT renderer + MỘT env PMREM (RoomEnvironment — studio
// light, không cần tải HDRI) DÙNG CHUNG cho mọi quả cầu; mỗi lần render chỉ swap material rồi
// chụp PNG. Kết quả cache theo hash(params) trong Map — component chỉ nhận dataURL, không giữ
// canvas WebGL nào sống (không đội draw call).
//
// ⚠️ RIG GĂM VÀO globalThis, KHÔNG phải biến module. Bài học sự cố 04/08 "12/12 cầu ngừng render":
// mỗi lần Fast Refresh thay module này là biến module reset → tạo WebGLRenderer MỚI mà renderer cũ
// không ai dispose; sửa file đủ nhiều vòng trong một phiên dev là vượt trần ~16 WebGL context của
// browser → new WebGLRenderer() ném lỗi → rig=false vĩnh viễn → mọi ô rơi về fallback, chỉ warn
// đúng 1 lần (chìm trong log Fast Refresh). Ba "nghi can" công thức (environmentRotation · nền
// CanvasTexture · drawImage sau setSize) đã cô lập từng biến trên browser 04/08 — đều vô tội.
//
// ⚠️ PBR THẬT chưa có trong catalog (schema matId+PBR là việc PHU, SO-KIEM-TONG §3 PHU-4).
// Tạm suy tham số từ LOẠI bề mặt (gỗ/đá/kim loại/sơn/vải/kính) + 2 màu gradient sẵn có của
// swatch — khi PHU xong schema thì thay `materialFromSpec` bằng đọc PBR thật, chỗ khác giữ nguyên.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type PreviewKind = 'wood' | 'stone' | 'metal' | 'paint' | 'fabric' | 'glass';
export type PreviewScene = 'sphere' | 'floor' | 'fabric' | 'glass';

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

/** Cảnh theo danh mục. MỌI vật liệu đều là QUẢ CẦU (Hoà 04/08: cùng một kiểu xem trước) — khác
 * nhau chỉ ở phần nền: kính có thẻ checker sau lưng để đọc độ trong. Cảnh `floor` giữ lại cho
 * panel chi tiết CHỌN TAY, KHÔNG bao giờ tự đoán theo tên món nữa. */
export function sceneForKind(kind: PreviewKind): PreviewScene {
  if (kind === 'glass') return 'glass';
  if (kind === 'fabric') return 'fabric';
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

// ---- lõi render dùng chung (singleton trên globalThis, lazy — SSR không đụng WebGL) ----

interface Rig {
  renderer: THREE.WebGLRenderer;
  env: THREE.Texture;
  scenes: Partial<Record<PreviewScene, { scene: THREE.Scene; camera: THREE.PerspectiveCamera; target: THREE.Mesh }>>;
}

// Sống XUYÊN Fast Refresh (xem cảnh báo đầu file) — module thay bao nhiêu lần vẫn đúng 1 context.
const RIG_KEY = '__ifMaterialPreviewRig';

function getRig(): Rig | null {
  const g = globalThis as Record<string, unknown>;
  const cached = g[RIG_KEY] as Rig | false | undefined;
  if (cached === false) return null;
  if (cached) return cached;
  if (typeof window === 'undefined') return null;
  try {
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    // NeutralToneMapping, KHÔNG ACES (§2c): ACES kéo màu về phía điện ảnh — sơn người dùng chọn
    // ra ảnh KHÁC màu đã chọn, không chấp nhận được với bảng vật liệu.
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    const rig: Rig = { renderer, env, scenes: {} };
    g[RIG_KEY] = rig;
    return rig;
  } catch (err) {
    // Im lặng ở đây từng làm mất cả buổi đi tìm "vì sao ô trống" — nói ra 1 dòng.
    // eslint-disable-next-line no-console
    console.warn('[MaterialSphere] Không dựng được WebGL, rơi về fallback:', err);
    g[RIG_KEY] = false;
    return null;
  }
}

/** Nền XÁM TRUNG TÍNH (radial #8a8a8a→#4a4a4a). Cấm nền trắng: trắng nuốt mất vật liệu sáng
 * (Sơn trắng ngà vs Đá Calacatta nhìn y hệt nhau) và làm mọi cầu trông bệch. */
function backdropTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 96, 10, 128, 128, 190);
  g.addColorStop(0, '#8a8a8a');
  g.addColorStop(1, '#4a4a4a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Thẻ checker xám nhạt — lót sau vật liệu TRONG SUỐT để đọc được độ trong (kính). */
function checkerTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const s = 16;
  for (let y = 0; y < 128 / s; y++) {
    for (let x = 0; x < 128 / s; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#7a7a7a' : '#6a6a6a';
      ctx.fillRect(x * s, y * s, s, s);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Bóng TIẾP ĐẤT: đĩa gradient tròn, bake 1 lần rồi dùng lại cho mọi quả cầu. */
function contactShadowTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,.85)');
  g.addColorStop(0.55, 'rgba(0,0,0,.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function buildScene(r: Rig, type: PreviewScene) {
  const scene = new THREE.Scene();
  scene.environment = r.env;
  // Xoay env để vệt sáng panel rơi vào GÓC TRÊN-TRÁI quả cầu (quy ước đọc highlight của mọi
  // bảng vật liệu: V-Ray/D5 đều đặt nguồn sáng chính phía trên-trái).
  scene.environmentRotation = new THREE.Euler(0, -Math.PI * 0.35, 0);
  scene.environmentIntensity = 1.1;
  scene.background = backdropTexture();

  // fov 30 = ống dài (ít méo phối cảnh, quả cầu đọc đúng hình) · cầu chiếm ~75% khung
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.9, 5);
  camera.lookAt(0, 0, 0);

  // Bóng tiếp đất — đường kính 2.2× quả cầu, nằm ngay dưới cầu.
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2 * 2, 2.2 * 2),
    new THREE.MeshBasicMaterial({ map: contactShadowTexture(), transparent: true, opacity: 0.45, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.02;
  scene.add(shadow);

  let target: THREE.Mesh;
  if (type === 'floor') {
    target = new THREE.Mesh(new THREE.PlaneGeometry(6, 6));
    target.rotation.x = -Math.PI / 2;
    camera.position.set(0, 0.62, 1.35);
    camera.lookAt(0, 0, -0.75);
  } else {
    // Vải KHÔNG bóp hình học (bản cũ scale 1.15/0.62/1.05 ra ellipse dẹt, nhìn như nệm hỏng):
    // dùng ĐÚNG quả cầu, chất vải đọc qua sheen/roughness của material.
    target = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32));
  }
  scene.add(target);

  // Vật liệu trong suốt: thẻ checker dựng đứng phía sau để thấy độ trong.
  if (type === 'glass') {
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      new THREE.MeshBasicMaterial({ map: checkerTexture() }),
    );
    card.position.set(0, 0, -1.6);
    scene.add(card);
  }

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
    // Số roughness/clearcoat kéo giãn có chủ đích (nghiệm thu Hoà 04/08: "Sơn trắng ngà và Đá
    // Calacatta phải NHÌN KHÁC NHAU rõ"): đá = đá MÀI BÓNG (highlight nhỏ, gắt, có lớp phủ) ·
    // sơn = MATTE thật (không highlight tụ điểm, chỉ sáng đều). Đây là khác biệt vật lý thật
    // giữa hai loại bề mặt, không phải chỉnh cho đẹp.
    case 'wood': m.roughness = 0.5; m.metalness = 0; m.clearcoat = 0.25; m.clearcoatRoughness = 0.4; break;
    case 'stone': m.roughness = 0.1; m.metalness = 0; m.clearcoat = 0.7; m.clearcoatRoughness = 0.06; break;
    case 'metal': m.roughness = 0.28; m.metalness = 1; break;
    case 'paint': m.roughness = 0.95; m.metalness = 0; break;
    case 'fabric': m.roughness = 1; m.metalness = 0; m.sheen = 1; m.sheenRoughness = 0.55; m.sheenColor = new THREE.Color(spec.colorA); break;
    case 'glass': m.roughness = 0.15; m.metalness = 0; m.transmission = 0.9; m.thickness = 0.8; m.ior = 1.5; m.transparent = true; break;
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
  try {
    const sceneType = spec.scene ?? sceneForKind(spec.kind);
    const s = r.scenes[sceneType] ?? buildScene(r, sceneType);

    const mat = materialFromSpec(spec);
    s.target.material = mat;

    // Render 2× rồi THU NHỎ bằng canvas 2D: rìa cầu và vệt highlight nét hơn hẳn so với render
    // thẳng ở cỡ đích (antialias của WebGL không cứu được đường cong ở 96-120px).
    const big = px * 2;
    r.renderer.setSize(big, big, false);
    r.renderer.render(s.scene, s.camera);
    const down = document.createElement('canvas');
    down.width = down.height = px;
    const ctx = down.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(r.renderer.domElement, 0, 0, big, big, 0, 0, px, px);
    const url = down.toDataURL('image/png');

    // dọn theo lượt: renderer/env/geometry/nền dùng chung, material+map của lượt này bỏ
    (mat.map as THREE.Texture | null)?.dispose();
    mat.dispose();
    cache.set(key, url);
    return url;
  } catch (err) {
    // Lỗi dựng cảnh/vật liệu KHÔNG được ném vào React — ô rơi về fallback là đủ dùng.
    // eslint-disable-next-line no-console
    console.warn('[MaterialSphere] Render lỗi, rơi về fallback:', err);
    return null;
  }
}
