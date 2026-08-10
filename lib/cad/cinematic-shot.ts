/** Ý đồ cảnh quay → đường camera có số liệu thật và luôn bung thành polyline sửa được. */
import type { Pt } from './model';
import { planCamPath, type CamPathResult, type LookAtMode } from './campath';

export type CinematicShotIntent = 'low-track' | 'follow' | 'reveal' | 'push-in' | 'orbit';
export type ShotEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface CinematicShotOptions {
  target?: Pt;
  orbitRadiusMm?: number;
  orbitStartRad?: number;
  orbitSweepRad?: number;
  speedMmPerSec?: number;
}

export interface ShotSafetyReport {
  warnings: string[];
  /** Chỉ scene 3D thật mới xác nhận được camera có xuyên tường/đồ hay không. */
  requiresSceneCollisionCheck: true;
}

export interface CinematicShotSpec {
  intent: CinematicShotIntent;
  label: string;
  /** Polyline đã “eject”, là nguồn chỉnh sửa thật của người dùng. */
  controlPoints: Pt[];
  path: CamPathResult;
  cameraHeightM: number;
  lensMm: number;
  easing: ShotEasing;
  stabilization: 'locked' | 'soft' | 'handheld';
  lookAt: LookAtMode;
  promptFragment: string;
  safety: ShotSafetyReport;
}

interface ShotPreset {
  label: string;
  cameraHeightM: number;
  lensMm: number;
  speedMmPerSec: number;
  easing: ShotEasing;
  stabilization: CinematicShotSpec['stabilization'];
  promptFragment: string;
}

export const CINEMATIC_SHOT_PRESETS: Record<CinematicShotIntent, ShotPreset> = {
  'low-track': { label: 'Đi thấp sát sàn', cameraHeightM: 0.32, lensMm: 24, speedMmPerSec: 700, easing: 'ease-in-out', stabilization: 'soft', promptFragment: 'low-angle lateral tracking shot, camera 0.32m above floor, stabilized movement' },
  follow: { label: 'Bám theo', cameraHeightM: 0.9, lensMm: 35, speedMmPerSec: 1200, easing: 'ease-in-out', stabilization: 'handheld', promptFragment: 'follow shot at waist height, gentle natural camera movement, subject kept in frame' },
  reveal: { label: 'Hé lộ không gian', cameraHeightM: 1.5, lensMm: 35, speedMmPerSec: 550, easing: 'ease-out', stabilization: 'locked', promptFragment: 'slow architectural reveal shot, straight verticals, focal point gradually disclosed' },
  'push-in': { label: 'Tiến vào điểm nhấn', cameraHeightM: 1.5, lensMm: 50, speedMmPerSec: 450, easing: 'ease-out', stabilization: 'locked', promptFragment: 'slow push-in toward the focal point, stable architectural camera, straight verticals' },
  orbit: { label: 'Orbit quanh đối tượng', cameraHeightM: 1.35, lensMm: 50, speedMmPerSec: 650, easing: 'ease-in-out', stabilization: 'locked', promptFragment: 'smooth orbit shot around the selected object, consistent distance and locked target' },
};

function orbitPoints(target: Pt, radiusMm: number, startRad: number, sweepRad: number): Pt[] {
  const segments = Math.max(6, Math.ceil(Math.abs(sweepRad) / (Math.PI / 12)));
  return Array.from({ length: segments + 1 }, (_, i) => {
    const a = startRad + (sweepRad * i) / segments;
    return { x: target.x + Math.cos(a) * radiusMm, y: target.y + Math.sin(a) * radiusMm };
  });
}

function lookAtFor(intent: CinematicShotIntent, target?: Pt): LookAtMode {
  if ((intent === 'reveal' || intent === 'push-in' || intent === 'orbit') && target) return { kind: 'point', at: target };
  return { kind: 'tangent' };
}

export function analyzeShotSafety(path: CamPathResult, cameraHeightM: number): ShotSafetyReport {
  const warnings: string[] = [];
  if (path.samples.length < 2 || path.totalLengthMm < 300) warnings.push('Đường quay quá ngắn để tạo chuyển động ổn định.');
  if (path.totalDurationSec > 45) warnings.push('Shot dài hơn 45 giây; nên chia thành nhiều shot để dễ dựng và render lại.');
  if (cameraHeightM < 0.2) warnings.push('Camera quá sát sàn, dễ xuyên sàn hoặc che bởi đồ nội thất.');
  let maxYawPerM = 0;
  for (let i = 1; i < path.samples.length; i++) {
    const a = path.samples[i - 1];
    const b = path.samples[i];
    const dM = Math.max(0.001, (b.cumLenMm - a.cumLenMm) / 1000);
    let yaw = Math.abs(b.dirRad - a.dirRad);
    if (yaw > Math.PI) yaw = Math.PI * 2 - yaw;
    maxYawPerM = Math.max(maxYawPerM, yaw / dM);
  }
  if (maxYawPerM > Math.PI / 2) warnings.push('Hướng nhìn đổi quá gắt; nên nới góc hoặc thêm điểm điều khiển.');
  return { warnings, requiresSceneCollisionCheck: true };
}

export function createCinematicShot(intent: CinematicShotIntent, inputPoints: Pt[], options: CinematicShotOptions = {}): CinematicShotSpec {
  const preset = CINEMATIC_SHOT_PRESETS[intent];
  const target = options.target;
  if ((intent === 'reveal' || intent === 'push-in' || intent === 'orbit') && !target) throw new Error(`${intent} cần một điểm nhấn để khoá hướng nhìn.`);
  const controlPoints = intent === 'orbit'
    ? orbitPoints(target!, Math.max(300, options.orbitRadiusMm ?? 2400), options.orbitStartRad ?? 0, options.orbitSweepRad ?? Math.PI)
    : inputPoints.slice();
  const lookAt = lookAtFor(intent, target);
  const path = planCamPath(controlPoints, { speedMmPerSec: options.speedMmPerSec ?? preset.speedMmPerSec, lookAt });
  return { intent, label: preset.label, controlPoints, path, cameraHeightM: preset.cameraHeightM, lensMm: preset.lensMm, easing: preset.easing, stabilization: preset.stabilization, lookAt, promptFragment: preset.promptFragment, safety: analyzeShotSafety(path, preset.cameraHeightM) };
}
