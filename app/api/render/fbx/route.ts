import { NextResponse } from 'next/server';
import {
  convertObjToFbx,
  findBlender,
  BlenderMissingError,
  BlenderConvertError,
} from '@/lib/server/blender';
import { getSessionUser } from '@/lib/server/auth';

/**
 * Convert OBJ/MTL (node "Bản vẽ → 3D") → FBX bằng Blender local, headless.
 * Máy chưa cài Blender → 501 code 'BLENDER_MISSING' (nút FBX hiện message,
 * OBJ/MTL vẫn tải được — degrade tường minh, không chặn tầng lõi).
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { obj?: string; mtl?: string; camera?: string };
  const obj = String(body.obj ?? '');
  if (!obj.includes('\nv ') && !obj.startsWith('v ')) {
    return NextResponse.json({ error: 'Body thiếu nội dung OBJ hợp lệ.' }, { status: 400 });
  }
  // scene node lớn nhất hiện tại vài trăm KB — chặn payload bất thường (an toàn server)
  if (obj.length > 20_000_000) {
    return NextResponse.json({ error: 'OBJ quá lớn (>20MB).' }, { status: 413 });
  }
  if (!findBlender()) {
    return NextResponse.json(
      {
        error:
          'Máy server chưa cài Blender — cài từ blender.org hoặc đặt BLENDER_PATH vào .env.local. ' +
          'Trong lúc đó dùng nút "OBJ + MTL" rồi import tay vào 3ds Max/Blender.',
        code: 'BLENDER_MISSING',
      },
      { status: 501 },
    );
  }
  try {
    const fbx = await convertObjToFbx({
      obj,
      mtl: typeof body.mtl === 'string' ? body.mtl : undefined,
      camera: typeof body.camera === 'string' ? body.camera : undefined,
    });
    return NextResponse.json({ fbx: fbx.toString('base64'), bytes: fbx.length });
  } catch (err) {
    if (err instanceof BlenderMissingError) {
      return NextResponse.json({ error: err.message, code: 'BLENDER_MISSING' }, { status: 501 });
    }
    const msg = err instanceof BlenderConvertError ? err.message : 'Convert FBX thất bại.';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
