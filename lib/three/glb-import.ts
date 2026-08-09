import {
  Box3,
  BufferAttribute,
  Color,
  Mesh,
  MeshStandardMaterial,
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

export function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) throw new Error('Nguồn GLB không phải data URL hợp lệ.');
  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
