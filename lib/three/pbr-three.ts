/**
 * lib/three/pbr-three.ts — CHỖ DUY NHẤT đọc `MaterialPbr` (kèm 7 map + uvScaleMm) ra vật liệu
 * three.js. VIỆC 3 phiếu M-VAT-LIEU-2 (07/08): cả quả cầu xem trước
 * (`components/three/material-preview.ts`) lẫn scene 3D sau này cùng đi qua đây — colorSpace/
 * repeat khai MỘT lần, không rải công thức ra hai nơi rồi lệch nhau.
 *
 * ⚠️ COLORSPACE — chỗ dễ sai nhất, ghi thẳng tại nơi gán:
 *   · baseColorMapUrl → SRGBColorSpace (ảnh màu người chụp/scan là sRGB)
 *   · roughness/metallic/normal/height/ao → NoColorSpace (dữ liệu tuyến tính, KHÔNG phải màu)
 *   Đặt nhầm là màu lệch TOÀN CỤC (gamma hai lần) — lý do trường mới phải khai rõ ở
 *   `lib/materials/schema.ts`.
 *
 * ⚠️ Import `three` TĨNH — cùng ràng buộc `csg.ts`/`obj-scene-to-geometry.ts`: chỉ gọi từ nhánh
 * client (`next/dynamic(ssr:false)` hoặc component 'use client'); TextureLoader cần DOM Image.
 */
import * as THREE from 'three';
import type { MaterialPbr } from '../materials/schema';
import { DEFAULT_PBR } from '../materials/schema';

/** Quy ước tỉ lệ: bề mặt xem trước/khối coi như VẬT 1 MÉT — `uvScaleMm {w,h}` = 1 chu kỳ ảnh phủ
 * w×h mm ⇒ repeat = 1000/w × 1000/h trên mỗi mét UV. Viên gạch 600×600 ⇒ lặp ~1.67 lần/m, đúng
 * cỡ thật thay vì kéo 1 ảnh phủ cả khối. */
export function uvRepeatOf(pbr: Pick<MaterialPbr, 'uvScaleMm'>): [number, number] {
  const w = pbr.uvScaleMm?.w;
  const h = pbr.uvScaleMm?.h;
  return [w && w > 0 ? 1000 / w : 1, h && h > 0 ? 1000 / h : 1];
}

const texCache = new Map<string, Promise<THREE.Texture>>();

/** Khoá cache rẻ cho URL (data-URI có thể dài hàng trăm KB — không dùng nguyên chuỗi làm key so
 * sánh trong key render). KHÔNG phải hash mật mã; đủ phân biệt 2 ảnh khác nhau trong app. */
export function cheapUrlKey(url: string): string {
  let acc = url.length;
  for (let i = 0; i < url.length; i += 97) acc = (acc * 31 + url.charCodeAt(i)) | 0;
  return `${url.length}:${acc}`;
}

function loadTexture(url: string, srgb: boolean): Promise<THREE.Texture> {
  const key = `${srgb ? 's' : 'l'}|${url}`;
  const hit = texCache.get(key);
  if (hit) return hit;
  const p = new Promise<THREE.Texture>((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (t) => {
        t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        resolve(t);
      },
      undefined,
      (e) => reject(e),
    );
  });
  texCache.set(key, p);
  p.catch(() => texCache.delete(key)); // ảnh hỏng không được găm vĩnh viễn trong cache
  return p;
}

export interface PbrTextureSet {
  map?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  metalnessMap?: THREE.Texture;
  normalMap?: THREE.Texture;
  aoMap?: THREE.Texture;
  bumpMap?: THREE.Texture;
}

/** Tải TRƯỚC mọi map của 1 pbr (cache theo URL — mỗi ảnh chỉ decode 1 lần). Map nào lỗi/thiếu ⇒
 * bỏ qua map đó, KHÔNG reject cả cụm (1 ảnh hỏng không được làm quả cầu trống). */
export async function loadPbrTextures(pbr: MaterialPbr): Promise<PbrTextureSet> {
  const safe = (url: string | undefined, srgb: boolean) =>
    url ? loadTexture(url, srgb).catch(() => undefined) : Promise.resolve(undefined);
  const [map, roughnessMap, metalnessMap, normalMap, aoMap, bumpMap] = await Promise.all([
    safe(pbr.baseColorMapUrl, true), // sRGB — DUY NHẤT map này
    safe(pbr.roughnessMapUrl, false),
    safe(pbr.metallicMapUrl, false),
    safe(pbr.normalUrl, false),
    safe(pbr.aoUrl, false),
    safe(pbr.heightUrl, false),
  ]);
  return { map, roughnessMap, metalnessMap, normalMap, aoMap, bumpMap };
}

/**
 * Áp `MaterialPbr` + bộ texture đã tải vào 1 `MeshPhysicalMaterial` MỚI. Repeat theo `uvScaleMm`
 * áp CHUNG cho mọi map (một lưới UV — schema đã ghi). Texture trong cache dùng CHUNG giữa nhiều
 * material ⇒ phải clone trước khi đổi repeat, không thì 2 vật liệu cùng ảnh giẫm repeat của nhau.
 */
export function buildPbrMaterial(pbr: MaterialPbr, tex: PbrTextureSet): THREE.MeshPhysicalMaterial {
  const m = new THREE.MeshPhysicalMaterial();
  m.color = new THREE.Color(pbr.baseColor ?? '#9a9a9a');
  m.roughness = pbr.roughness ?? DEFAULT_PBR.roughness;
  m.metalness = pbr.metallic ?? DEFAULT_PBR.metallic;
  const [ru, rv] = uvRepeatOf(pbr);
  const withRepeat = (t?: THREE.Texture) => {
    if (!t) return undefined;
    const c = t.clone();
    c.repeat.set(ru, rv);
    c.needsUpdate = true;
    return c;
  };
  if (tex.map) {
    m.map = withRepeat(tex.map)!;
    // glTF: factor × texture — có ảnh màu thì color là TINT; trắng = hiện ảnh đúng màu gốc.
    // Giữ baseColor người dùng chọn làm tint chỉ khi họ đã chọn; chưa chọn thì trắng (không ám màu).
    m.color = new THREE.Color(pbr.baseColor ?? '#ffffff');
  }
  if (tex.roughnessMap) m.roughnessMap = withRepeat(tex.roughnessMap)!;
  if (tex.metalnessMap) m.metalnessMap = withRepeat(tex.metalnessMap)!;
  if (tex.normalMap) m.normalMap = withRepeat(tex.normalMap)!;
  if (tex.aoMap) m.aoMap = withRepeat(tex.aoMap)!;
  if (tex.bumpMap) { m.bumpMap = withRepeat(tex.bumpMap)!; m.bumpScale = 0.02; }
  if (pbr.transmission) {
    m.transmission = pbr.transmission.value;
    m.ior = pbr.transmission.ior;
    m.transparent = true;
    m.thickness = 0.8;
  }
  if (pbr.clearcoat) { m.clearcoat = pbr.clearcoat.value; m.clearcoatRoughness = pbr.clearcoat.roughness; }
  if (pbr.sheen != null) { m.sheen = pbr.sheen; m.sheenColor = new THREE.Color(pbr.baseColor ?? '#ffffff'); }
  if (pbr.emissive && pbr.emissive.intensity > 0) {
    m.emissive = new THREE.Color(pbr.emissive.color);
    m.emissiveIntensity = pbr.emissive.intensity;
  }
  if (pbr.opacity && pbr.opacity.value < 1) {
    m.opacity = pbr.opacity.value;
    m.transparent = pbr.opacity.mode === 'blend';
    if (pbr.opacity.mode === 'cutout') m.alphaTest = 0.5;
  }
  return m;
}

/** Chuỗi định danh pbr cho khoá cache render (map dài → cheapUrlKey, không nhét cả data-URI). */
export function pbrCacheKey(pbr: MaterialPbr): string {
  const u = (x?: string) => (x ? cheapUrlKey(x) : '-');
  return [
    pbr.typeId ?? '-', pbr.baseColor ?? '-', pbr.roughness ?? '-', pbr.metallic ?? '-',
    pbr.transmission?.value ?? '-', pbr.sheen ?? '-', pbr.clearcoat?.value ?? '-',
    u(pbr.baseColorMapUrl), u(pbr.roughnessMapUrl), u(pbr.metallicMapUrl),
    u(pbr.normalUrl), u(pbr.aoUrl), u(pbr.heightUrl),
    pbr.uvScaleMm ? `${pbr.uvScaleMm.w}x${pbr.uvScaleMm.h}` : '-',
  ].join('|');
}
