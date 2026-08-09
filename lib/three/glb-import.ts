import {
  Box3,
  BufferAttribute,
  Color,
  Mesh,
  MeshStandardMaterial,
  LoadingManager,
  Object3D,
  Vector3,
  type Material,
} from 'three';
import type { Scene3DData, SceneGroup } from './cad-to-obj';

export interface GlbImportReport {
  meshes: number;
  triangles: number;
  materials: number;
  textures: number;
  animations: number;
  warnings: string[];
}

export interface ParsedGlb {
  scene: Scene3DData;
  report: GlbImportReport;
}

export interface GltfResource {
  name: string;
  dataUrl: string;
}

function colorOf(material: Material | Material[] | undefined): string {
  const first = Array.isArray(material) ? material[0] : material;
  const color = first && 'color' in first ? (first as MeshStandardMaterial).color : new Color('#b8b3aa');
  return `#${color.getHexString()}`;
}

/** Chuyển scene glTF sang tam giác thuần mà viewer IF đã dùng. Transform node được bake vào
 * vertex; đơn vị glTF là mét và trục Y-up nên không đổi tỉ lệ/trục. */
export function objectToScene3D(root: Object3D): { scene: Scene3DData; meshes: number; triangles: number; materials: number; textures: number } {
  root.updateMatrixWorld(true);
  const groups: SceneGroup[] = [];
  const materialIds = new Set<string>();
  let triangles = 0;
  let textures = 0;
  root.traverse((object) => {
    if (!(object instanceof Mesh) || !object.geometry) return;
    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    const attr = geometry.getAttribute('position');
    if (!(attr instanceof BufferAttribute)) return;
    geometry.applyMatrix4(object.matrixWorld);
    const positions = Array.from((geometry.getAttribute('position') as BufferAttribute).array as ArrayLike<number>);
    if (positions.length < 9) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.filter(Boolean).forEach((m) => {
      materialIds.add(m.uuid);
      if ('map' in m && m.map) textures += 1;
    });
    groups.push({
      name: `Import · ${object.name || `Mesh ${groups.length + 1}`}`,
      colorHex: colorOf(object.material),
      positions,
    });
    triangles += positions.length / 9;
    geometry.dispose();
  });

  const bounds = new Box3().setFromObject(root);
  const size = bounds.isEmpty() ? new Vector3(1, 1, 1) : bounds.getSize(new Vector3());
  const min = bounds.isEmpty() ? new Vector3() : bounds.min;
  return {
    scene: {
      groups,
      // Scene3DData dùng bbox mặt phẳng CAD (mm); glTF dùng X/Z trên sàn.
      bboxMm: { minX: min.x * 1000, minY: min.z * 1000, maxX: (min.x + size.x) * 1000, maxY: (min.z + size.z) * 1000 },
      sizeM: { w: size.x, d: size.z, h: size.y },
    },
    meshes: groups.length,
    triangles,
    materials: materialIds.size,
    textures,
  };
}

export async function parseGlb(buffer: ArrayBuffer): Promise<ParsedGlb> {
  // Loader là ESM và khá nặng — chỉ nạp khi người dùng thật sự chọn GLB; test chuyển hình học
  // thuần không phải kéo loader/browser API vào Node.
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  const gltf = await loader.parseAsync(buffer, '');
  const converted = objectToScene3D(gltf.scene);
  const warnings: string[] = [];
  if (converted.textures) warnings.push('Texture được giữ trong tệp nguồn nhưng viewport khối xám hiện chưa hiển thị texture.');
  if (gltf.animations.length) warnings.push('Animation được giữ trong tệp nguồn nhưng chưa phát trong viewport.');
  return {
    scene: converted.scene,
    report: {
      meshes: converted.meshes,
      triangles: converted.triangles,
      materials: converted.materials,
      textures: converted.textures,
      animations: gltf.animations.length,
      warnings,
    },
  };
}

function normalizedResourceName(name: string): string {
  return decodeURIComponent(name).replace(/^\.\//, '').replace(/\\/g, '/');
}

/** Ghép manifest `.gltf` với `.bin`/texture người dùng chọn cùng lượt. Ưu tiên đúng đường dẫn;
 * nếu file picker làm mất thư mục thì cho phép basename DUY NHẤT. Trùng basename bị từ chối để
 * không âm thầm gắn nhầm texture. Data URI/URL tuyệt đối để loader tự xử lý. */
export function resolveGltfResource(uri: string, resources: readonly GltfResource[]): string | null {
  if (/^(data:|blob:|https?:)/i.test(uri)) return uri;
  const wanted = normalizedResourceName(uri);
  const exact = resources.find((resource) => normalizedResourceName(resource.name) === wanted);
  if (exact) return exact.dataUrl;
  const basename = wanted.split('/').pop();
  const matches = resources.filter((resource) => normalizedResourceName(resource.name).split('/').pop() === basename);
  return matches.length === 1 ? matches[0].dataUrl : null;
}

/** URI phụ được manifest khai trực tiếp. Chỉ đọc hai vị trí chuẩn glTF 2.0; data URI đã tự chứa
 * nên không cần file. URL/blob ngoài không được coi là gói bền vì lần mở offline sẽ hỏng. */
export function gltfDependencyUris(manifest: unknown): string[] {
  if (!manifest || typeof manifest !== 'object') return [];
  const root = manifest as { buffers?: unknown; images?: unknown };
  const from = (items: unknown) => Array.isArray(items)
    ? items.flatMap((item) => item && typeof item === 'object' && typeof (item as { uri?: unknown }).uri === 'string'
      ? [(item as { uri: string }).uri]
      : [])
    : [];
  return Array.from(new Set([...from(root.buffers), ...from(root.images)]));
}

export async function parseGltfBundle(manifestText: string, resources: readonly GltfResource[]): Promise<ParsedGlb> {
  let manifest: unknown;
  try {
    manifest = JSON.parse(manifestText);
  } catch {
    throw new Error('Tệp .gltf không phải JSON hợp lệ.');
  }
  if (!manifest || typeof manifest !== 'object' || !('asset' in manifest)) {
    throw new Error('Tệp .gltf thiếu khối asset bắt buộc.');
  }
  const dependencyUris = gltfDependencyUris(manifest);
  const remote = dependencyUris.filter((uri) => /^(blob:|https?:)/i.test(uri));
  if (remote.length) throw new Error(`File phụ dùng URL ngoài, chưa thể lưu offline: ${remote.join(', ')}`);
  const preflightMissing = dependencyUris.filter((uri) => !/^data:/i.test(uri) && !resolveGltfResource(uri, resources));
  if (preflightMissing.length) throw new Error(`Thiếu file phụ: ${preflightMissing.join(', ')}`);
  const manager = new LoadingManager();
  const missing = new Set<string>();
  manager.setURLModifier((url) => {
    const resolved = resolveGltfResource(url, resources);
    if (!resolved) missing.add(normalizedResourceName(url));
    return resolved ?? url;
  });
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  try {
    const gltf = await new GLTFLoader(manager).parseAsync(manifestText, '');
    const converted = objectToScene3D(gltf.scene);
    const warnings: string[] = [];
    if (converted.textures) warnings.push('Texture được giữ trong gói nguồn nhưng viewport khối xám hiện chưa hiển thị texture.');
    if (gltf.animations.length) warnings.push('Animation được giữ trong gói nguồn nhưng chưa phát trong viewport.');
    return {
      scene: converted.scene,
      report: {
        meshes: converted.meshes,
        triangles: converted.triangles,
        materials: converted.materials,
        textures: converted.textures,
        animations: gltf.animations.length,
        warnings,
      },
    };
  } catch (error) {
    if (missing.size) throw new Error(`Thiếu file phụ: ${Array.from(missing).join(', ')}`);
    throw error;
  }
}

export function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) throw new Error('Nguồn GLB không phải data URL hợp lệ.');
  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
