/**
 * lib/server/blender.ts — convert OBJ/MTL (node "Bản vẽ → 3D") sang FBX bằng Blender CLI
 * headless (`blender --background --factory-startup --python scripts/blender/obj2fbx.py`).
 * CHỈ import phía server (child_process/fs).
 *
 * Degrade tường minh: không tìm thấy binary Blender → BlenderMissingError với hướng dẫn
 * cài — route trả 501, nút FBX trên node hiện message, OBJ/MTL vẫn tải được (tầng lõi).
 */
import { execFile } from 'node:child_process';
import { promises as fs, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export class BlenderMissingError extends Error {}
export class BlenderConvertError extends Error {}

/** Ứng viên binary theo thứ tự ưu tiên — export để test tất định. */
export function blenderCandidates(env: Record<string, string | undefined> = process.env): string[] {
  const list: string[] = [];
  if (env.BLENDER_PATH) list.push(env.BLENDER_PATH);
  list.push(
    '/Applications/Blender.app/Contents/MacOS/Blender', // macOS mặc định (máy này: 4.5 LTS)
    '/usr/local/bin/blender',
    '/opt/homebrew/bin/blender',
    'C:\\Program Files\\Blender Foundation\\Blender\\blender.exe', // Windows RTX công ty
  );
  return list;
}

/** Tìm binary Blender — null nếu máy chưa cài (caller tự degrade). */
export function findBlender(env: Record<string, string | undefined> = process.env): string | null {
  for (const p of blenderCandidates(env)) {
    try {
      if (existsSync(p)) return p;
    } catch {
      /* đường dẫn hỏng — thử ứng viên kế */
    }
  }
  return null;
}

/** Args CLI cho lần convert — export để test không cần chạy Blender thật. */
export function blenderArgs(scriptPath: string, objPath: string, fbxPath: string, camPath?: string): string[] {
  const args = ['--background', '--factory-startup', '--python', scriptPath, '--', objPath, fbxPath];
  if (camPath) args.push(camPath);
  return args;
}

export interface ConvertInput {
  /** nội dung file .obj (text từ docToObjScene) */
  obj: string;
  /** nội dung file .mtl đi kèm (tuỳ chọn) */
  mtl?: string;
  /** JSON PlacedCamera từ lib/three/camera.ts (tuỳ chọn) */
  camera?: string;
  timeoutMs?: number;
}

/**
 * OBJ (+MTL, camera) → Buffer FBX. Ghi file tạm trong os.tmpdir, dọn sạch sau khi xong.
 * Throw BlenderMissingError (chưa cài) / BlenderConvertError (convert lỗi, kèm stderr rút gọn).
 */
export async function convertObjToFbx(input: ConvertInput): Promise<Buffer> {
  const bin = findBlender();
  if (!bin) {
    throw new BlenderMissingError(
      'Chưa tìm thấy Blender trên máy server — cài blender.org (macOS: /Applications/Blender.app) ' +
        'hoặc đặt BLENDER_PATH trong .env.local. Trong lúc đó vẫn tải được OBJ/MTL để import tay.',
    );
  }
  const script = path.join(process.cwd(), 'scripts', 'blender', 'obj2fbx.py');
  if (!existsSync(script)) throw new BlenderConvertError(`Thiếu script convert: ${script}`);

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'if-obj2fbx-'));
  const objPath = path.join(dir, 'scene.obj');
  const fbxPath = path.join(dir, 'scene.fbx');
  const camPath = path.join(dir, 'camera.json');
  try {
    await fs.writeFile(objPath, input.obj, 'utf8');
    // OBJ tham chiếu "mtllib scene.mtl" — ghi cạnh scene.obj để Blender đọc vật liệu
    if (input.mtl) await fs.writeFile(path.join(dir, 'scene.mtl'), input.mtl, 'utf8');
    if (input.camera) await fs.writeFile(camPath, input.camera, 'utf8');

    await new Promise<void>((resolve, reject) => {
      execFile(
        bin,
        blenderArgs(script, objPath, fbxPath, input.camera ? camPath : undefined),
        { timeout: input.timeoutMs ?? 120_000, maxBuffer: 8 * 1024 * 1024 },
        (err, _stdout, stderr) => {
          if (err) {
            const tail = String(stderr || err.message).split('\n').filter(Boolean).slice(-4).join(' · ');
            reject(new BlenderConvertError(`Blender convert lỗi: ${tail.slice(0, 300)}`));
          } else resolve();
        },
      );
    });
    if (!existsSync(fbxPath)) throw new BlenderConvertError('Blender chạy xong nhưng không sinh file FBX.');
    return await fs.readFile(fbxPath);
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
