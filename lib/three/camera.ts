/**
 * lib/three/camera.ts — CAMERA TẤT ĐỊNH cho hệ node render v2 (node "Góc máy ảnh").
 *
 * Thuần dữ liệu + toán, không DOM — test bằng sucrase-node. Một CameraSpec đi 2 đường:
 *  (i)  promptFragment nhồi vào prompt render (node Tạo ảnh / Sketch→Render…),
 *  (ii) placeCamera() đặt vị trí máy thật trong scene 3D (node Bản vẽ → 3D) — toạ độ
 *       Z-up mét, Blender đọc trực tiếp (scripts/blender/obj2fbx.py).
 */

export type CameraKind = 'eye' | 'wide' | 'macro' | 'top';

export interface CameraSpec {
  kind: CameraKind;
  /** nhãn tiếng Việt hiện trên node */
  label: string;
  /** cao máy so với sàn (m) */
  heightM: number;
  /** tiêu cự full-frame (mm) */
  lensMm: number;
  /** tỉ lệ khung 'w:h' */
  ratio: string;
  /** FOV ngang (độ) — suy từ tiêu cự, sensor 36mm */
  fovDeg: number;
  /** mẩu prompt tiếng Anh nhồi vào node render */
  prompt: string;
}

/** Nhãn preset hiện trên node (tiếng Việt, dễ hiểu). */
export const CAMERA_PRESETS = [
  'Tầm mắt (đứng trong phòng)',
  'Góc rộng (thấy cả phòng)',
  'Cận vật liệu (chi tiết)',
  'Trên cao (nhìn bao quát)',
] as const;

export const CAMERA_LENSES = ['24mm', '35mm', '50mm', '85mm'] as const;
export const CAMERA_RATIOS = ['16:9', '4:3', '1:1', '9:16'] as const;

const PRESET_KIND: Record<string, CameraKind> = {
  [CAMERA_PRESETS[0]]: 'eye',
  [CAMERA_PRESETS[1]]: 'wide',
  [CAMERA_PRESETS[2]]: 'macro',
  [CAMERA_PRESETS[3]]: 'top',
};

/** FOV ngang (độ) từ tiêu cự full-frame 36mm. */
export function fovFromLens(lensMm: number): number {
  return (2 * Math.atan(36 / (2 * lensMm)) * 180) / Math.PI;
}

/** Preset + tiêu cự + khung → CameraSpec tất định. Tiêu cự bị preset ép khi cần (wide/macro). */
export function presetCamera(preset: string, lens: string, ratio: string): CameraSpec {
  const kind = PRESET_KIND[preset] ?? 'eye';
  let lensMm = parseInt(lens, 10) || 35;
  let heightM = 1.5;
  let prompt = '';
  switch (kind) {
    case 'eye':
      heightM = 1.5;
      prompt = `eye-level interior photography, camera height 1.5m, ${lensMm}mm lens, straight verticals`;
      break;
    case 'wide':
      lensMm = Math.min(lensMm, 24);
      heightM = 1.6;
      prompt = `wide angle ${lensMm}mm lens, full room view, one-point perspective, straight verticals`;
      break;
    case 'macro':
      lensMm = Math.max(lensMm, 85);
      heightM = 1.1;
      prompt = `close-up material detail shot, ${lensMm}mm lens, shallow depth of field, texture focus`;
      break;
    case 'top':
      heightM = 4.5;
      prompt = `elevated high-angle overview of the interior, bird perspective, ${lensMm}mm lens`;
      break;
  }
  return {
    kind,
    label: preset,
    heightM,
    lensMm,
    ratio: CAMERA_RATIOS.includes(ratio as (typeof CAMERA_RATIOS)[number]) ? ratio : '16:9',
    fovDeg: Math.round(fovFromLens(lensMm) * 10) / 10,
    prompt,
  };
}

/** Parse chuỗi JSON từ port 'camera' — sai/thiếu trả null (node downstream tự bỏ qua). */
export function parseCameraSpec(text: string | undefined | null): CameraSpec | null {
  if (!text) return null;
  try {
    const j = JSON.parse(text) as Partial<CameraSpec>;
    if (typeof j.lensMm !== 'number' || typeof j.heightM !== 'number' || !j.kind) return null;
    return j as CameraSpec;
  } catch {
    return null;
  }
}

export interface PlacedCamera {
  /** vị trí máy — Z-up, MÉT (khớp toạ độ Blender sau import OBJ) */
  pos: [number, number, number];
  /** điểm nhìn — Z-up, MÉT */
  target: [number, number, number];
  lensMm: number;
}

export interface BboxMm {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Đặt camera tất định theo bbox mặt bằng (mm, hệ CAD Y-lên) + CameraSpec.
 * Quy ước: máy đứng phía Nam (-Y) nhìn vào tâm; preset 'top' treo trên tâm.
 */
export function placeCamera(bbox: BboxMm, spec: CameraSpec): PlacedCamera {
  const cx = (bbox.minX + bbox.maxX) / 2 / 1000;
  const cy = (bbox.minY + bbox.maxY) / 2 / 1000;
  const w = Math.max(0.5, (bbox.maxX - bbox.minX) / 1000);
  const d = Math.max(0.5, (bbox.maxY - bbox.minY) / 1000);
  const span = Math.max(w, d);
  if (spec.kind === 'top') {
    // trên cao chéo 30° — thấy khối lẫn mặt bằng
    return {
      pos: [cx, cy - span * 0.55, Math.max(spec.heightM, span * 0.9)],
      target: [cx, cy, 0.4],
      lensMm: spec.lensMm,
    };
  }
  const back = spec.kind === 'wide' ? 0.12 : spec.kind === 'macro' ? 0.35 : 0.18;
  // máy đứng sát mép Nam bên trong phòng, nhìn vào tâm ở cao 1.2m
  const y = bbox.minY / 1000 + d * back;
  return {
    pos: [cx, y, spec.heightM],
    target: [cx, cy + d * 0.15, spec.kind === 'macro' ? spec.heightM - 0.1 : 1.2],
    lensMm: spec.lensMm,
  };
}
