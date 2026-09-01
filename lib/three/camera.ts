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

/* ────────────────────────────────────────────────────────────────────────────
 * HAI ĐIỂM TỤ — chuẩn nghề ảnh kiến trúc (chốt 9 của Hoà: "đi sau phải giống
 * nó trước rồi mới hơn nó").
 *
 * Nghề chụp/dựng kiến trúc có MỘT quy ước cứng: **đường đứng phải đứng**. Máy
 * ngóc lên để lấy trần là làm đường đứng đổ về một điểm tụ thứ ba — ảnh đọc ra
 * "nhà đổ". Nghề chữa bằng ống kính DỊCH (tilt-shift): giữ trục máy NGANG rồi
 * dịch ống kính lên, khung ăn lên trần mà đường đứng vẫn song song.
 *
 * Số điểm tụ suy được TẤT ĐỊNH từ hình học, không cần đoán:
 *   · trục nhìn không ngang                ⇒ 3 điểm tụ (đường đứng hội tụ) — SAI nghề
 *   · trục nhìn ngang, phương vị ≈ trục nhà ⇒ 1 điểm tụ (chính diện)
 *   · trục nhìn ngang, phương vị chéo       ⇒ 2 điểm tụ ← thứ nghề dùng nhiều nhất
 * `soDiemTu()` là cái thước đó; `datCameraHaiDiemTu()` là chỗ đặt máy theo nó.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Sai số phương vị (độ) còn tính là "chính diện" ⇒ một điểm tụ. */
export const NGUONG_CHINH_DIEN_DEG = 5;
/** Sai số cao độ (m) giữa máy và điểm nhìn còn tính là trục NGANG. */
export const NGUONG_TRUC_NGANG_M = 1e-6;
/** Cao trần mặc định khi đề bài không khai (m) — nhà ở VN phổ biến 2,8. */
export const CAP_TRAN_MAC_DINH_M = 2.8;
/** Trần dịch ống kính, tính theo NỬA chiều cao khung. Ống tilt-shift 24mm dịch
 *  12mm trên nửa khung 12mm ⇒ 1.0 là kịch biên vật lý; nghề hiếm khi vượt. */
export const TRAN_DICH_ONG_KINH = 1.0;

export interface CameraHaiDiemTu extends PlacedCamera {
  /** dịch ống kính theo trục đứng, chuẩn hoá theo NỬA khung. + = dịch lên. */
  shiftY: number;
  /** phương vị trục nhìn (độ, 0 = +X, ngược chiều kim đồng hồ) */
  yawDeg: number;
  /** cao trần dùng để tính `shiftY` (m) */
  capTranM: number;
  /** số điểm tụ hình học suy ra — phải bằng 2 thì mới đúng tên hàm */
  soDiemTu: 1 | 2 | 3;
}

/** FOV ĐỨNG (độ) từ tiêu cự + tỉ lệ khung, cùng mô hình cảm biến rộng 36mm với `fovFromLens`. */
export function fovDocFromLens(lensMm: number, ratio: string): number {
  const [w, h] = ratio.split(':').map((n) => parseFloat(n));
  const tyLe = w > 0 && h > 0 ? h / w : 9 / 16;
  const caoCamBien = 36 * tyLe;
  return (2 * Math.atan(caoCamBien / (2 * lensMm)) * 180) / Math.PI;
}

/**
 * Số điểm tụ của một thế máy — THƯỚC, không phải ý kiến.
 * Trả 3 khi trục nhìn nghiêng (đường đứng hội tụ), 1 khi nhìn chính diện một trục
 * nhà, 2 khi nhìn chéo. `nguongDeg` là bề rộng vùng "coi như chính diện".
 */
export function soDiemTu(cam: PlacedCamera, nguongDeg: number = NGUONG_CHINH_DIEN_DEG): 1 | 2 | 3 {
  const dz = cam.target[2] - cam.pos[2];
  if (Math.abs(dz) > NGUONG_TRUC_NGANG_M) return 3;
  const dx = cam.target[0] - cam.pos[0];
  const dy = cam.target[1] - cam.pos[1];
  if (dx === 0 && dy === 0) return 1;
  const yaw = (Math.atan2(dy, dx) * 180) / Math.PI;
  // khoảng cách tới bội số 90° gần nhất — trục nhà là hai trục vuông góc
  const lech = Math.abs(((((yaw % 90) + 135) % 90) - 45));
  return lech <= nguongDeg ? 1 : 2;
}

/** Trục nhìn có NGANG không — điều kiện cần để đường đứng còn đứng. */
export function laTrucNgang(cam: PlacedCamera): boolean {
  return Math.abs(cam.target[2] - cam.pos[2]) <= NGUONG_TRUC_NGANG_M;
}

/**
 * Dịch ống kính cần thiết để khung ôm trọn 0 → `capTranM` mà KHÔNG ngóc máy.
 * Đơn vị: nửa-khung. Kẹp ở `TRAN_DICH_ONG_KINH` (biên vật lý của ống thật);
 * kẹp rồi thì khung mất một phần trần — đó là sự thật, không giấu bằng cách ngóc.
 */
export function dichOngKinh(
  caoMayM: number,
  capTranM: number,
  khoangCachM: number,
  lensMm: number,
  ratio: string,
): number {
  const nuaKhung = Math.max(
    1e-9,
    khoangCachM * Math.tan((fovDocFromLens(lensMm, ratio) * Math.PI) / 360),
  );
  const canDich = capTranM / 2 - caoMayM;
  const chuanHoa = canDich / nuaKhung;
  return Math.max(-TRAN_DICH_ONG_KINH, Math.min(TRAN_DICH_ONG_KINH, chuanHoa));
}

export interface TuyChonHaiDiemTu {
  /** cao trần (m) */
  capTranM?: number;
  /** góc chéo so với trục nhà (độ) — nghề hay dùng 30–60; 0 hoặc 90 là một điểm tụ */
  gocCheoDeg?: number;
}

/**
 * Đặt máy HAI ĐIỂM TỤ theo bbox mặt bằng (mm, hệ CAD Y-lên).
 * Máy đứng ở góc Nam-Tây trong phòng, trục nhìn NGANG (nên đường đứng còn đứng),
 * phương vị chéo `gocCheoDeg` so với trục X ⇒ hai bó tường ngang tụ về hai điểm.
 * Phần trần lấy bằng DỊCH ỐNG KÍNH, không bằng ngóc máy.
 */
export function datCameraHaiDiemTu(
  bbox: BboxMm,
  spec: CameraSpec,
  tuyChon: TuyChonHaiDiemTu = {},
): CameraHaiDiemTu {
  const capTranM = tuyChon.capTranM ?? CAP_TRAN_MAC_DINH_M;
  const gocRaw = tuyChon.gocCheoDeg ?? 35;
  // ép ra khỏi vùng chính diện: 0/90 là một điểm tụ, không phải hai
  const gocCheoDeg =
    Math.abs(((((gocRaw % 90) + 135) % 90) - 45)) <= NGUONG_CHINH_DIEN_DEG ? 35 : gocRaw;
  const w = Math.max(0.5, (bbox.maxX - bbox.minX) / 1000);
  const d = Math.max(0.5, (bbox.maxY - bbox.minY) / 1000);
  // máy lùi vào trong góc Nam-Tây một khoảng nhỏ để không dính mặt tường
  const lui = 0.12;
  const x = bbox.minX / 1000 + w * lui;
  const y = bbox.minY / 1000 + d * lui;
  const caoMayM = spec.heightM;
  const rad = (gocCheoDeg * Math.PI) / 180;
  // điểm nhìn nằm CÙNG CAO ĐỘ với máy — đây là chỗ quyết định "đường đứng còn đứng"
  const tam = Math.hypot(w, d);
  const target: [number, number, number] = [
    x + Math.cos(rad) * tam,
    y + Math.sin(rad) * tam,
    caoMayM,
  ];
  const cam: PlacedCamera = { pos: [x, y, caoMayM], target, lensMm: spec.lensMm };
  return {
    ...cam,
    shiftY: dichOngKinh(caoMayM, capTranM, tam, spec.lensMm, spec.ratio),
    yawDeg: gocCheoDeg,
    capTranM,
    soDiemTu: soDiemTu(cam),
  };
}

/** Mẩu prompt tiếng Anh cho đường render ảnh — nói đúng thứ hình học ở trên. */
export function promptHaiDiemTu(cam: CameraHaiDiemTu): string {
  const dich =
    cam.shiftY > 0.02
      ? ', tilt-shift lens rise'
      : cam.shiftY < -0.02
        ? ', tilt-shift lens fall'
        : '';
  return `two-point perspective architectural photograph, camera perfectly level at ${cam.pos[2].toFixed(2)}m, vertical lines strictly parallel, ${cam.lensMm}mm lens${dich}`;
}
