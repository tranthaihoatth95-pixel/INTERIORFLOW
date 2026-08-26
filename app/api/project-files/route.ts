import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { assertProjectAccess } from '@/lib/server/access';
import { isFetchableImageUrl } from '@/lib/stock-photos';
import { docDataUrl, luuProjectFile, PROJECT_FILE_MAX_BYTES } from './_lib/luu-file';
import { FILE_SELECT, kiemDelegate, loiJson as loiJsonChung } from './_lib/guard';

/**
 * app/api/project-files — API của `ProjectFile`: **đầu vào THÔ thuộc ĐÚNG MỘT project**.
 *
 * Vị trí trong chuỗi (`docs/IF-KIEN-TRUC.md` §5): `Files (thô) → cửa sổ công cụ → Master Library
 * → đề xuất`. Route này giữ **mắt xích ĐẦU**; mắt xích Promote nằm ở `[id]/promote`, mắt xích
 * cuối (`ProjectAssetUsage`) đã LIVE ở `app/api/project-asset-usage`.
 *
 * ⭐ RANH GIỚI PHẢI GIỮ: `ProjectFile` **có** `projectId` (1-N, thuộc về một project);
 * `LibraryAsset` **không** — nó là vật dùng lại được, nối vào project qua `ProjectAssetUsage`.
 * Route này TUYỆT ĐỐI không tạo `LibraryAsset` (đó là việc của Promote).
 *
 * POST  {projectId, name, dataUrl|url} → tạo ProjectFile (+ ghi file vào ./uploads)
 * GET   ?projectId=X                   → list tệp thô còn sống của project
 *
 * ⚠️ `mime` do SERVER sniff magic-bytes quyết, KHÔNG lấy nhãn client khai (§6.2
 * `docs/AUDIT-BACKEND-2026-08-03.md`). Body có gửi `mime` cũng bị bỏ qua — cố ý.
 *
 * ══ BẢNG MÃ LỖI — cùng khuôn `app/api/project-asset-usage/route.ts` ══════════════════════════
 *   401 chưa đăng nhập · 403 không đủ vai (AccessError giữ nguyên status) · 404 project/tệp
 *   không tồn tại hoặc đã xoá mềm · 400 thiếu/sai param · 413 quá 25MB · 415 loại file chưa nhận
 *   được · 503 Prisma Client thiếu model (lỗi VẬN HÀNH: server khởi động trước `prisma generate`)
 *   · 500 luôn kèm body JSON + `console.error`, không bao giờ rỗng.
 */

const loiJson = (e: unknown, cho: string) => loiJsonChung(e, 'project-files', cho);

const UA = 'InteriorFlow/1.0 (+https://github.com/tranthaihoatth95-pixel/INTERIORFLOW)';
const TIMEOUT_MS = 15_000;

/** POST — nạp một tệp thô vào project. Cần vai trên 'viewer' — GHI nội dung dự án. Nấc ghi THẤP NHẤT của repo là 'bim' (ROLE_RANK 1, access-policy.ts:16); KHÔNG có vai tên 'editor'. */
export async function POST(req: Request) {
  try {
    return await postHandler(req);
  } catch (e) {
    return loiJson(e, 'POST');
  }
}

async function postHandler(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const thieu = kiemDelegate('project-files');
  if (thieu) return thieu;

  const body = await req.json().catch(() => ({}));
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl : '';
  const url = typeof body.url === 'string' ? body.url : '';

  if (!projectId || !name)
    return NextResponse.json({ error: 'Cần projectId + name.' }, { status: 400 });
  if (!dataUrl && !url)
    return NextResponse.json({ error: 'Cần dataUrl hoặc url.' }, { status: 400 });
  if (dataUrl && url)
    return NextResponse.json({ error: 'Chỉ được truyền một trong hai: dataUrl hoặc url.' }, { status: 400 });

  try {
    await assertProjectAccess(user.id, projectId, 'bim');

    // ── lấy Buffer ────────────────────────────────────────────────────────────────────────────
    let buf: Buffer;
    if (dataUrl) {
      const doc = docDataUrl(dataUrl);
      if (!doc.ok) return NextResponse.json({ error: doc.error }, { status: doc.status });
      buf = doc.buf;
    } else {
      // REUSE `isFetchableImageUrl` — cùng cửa chặn SSRF mà `/api/library/from-url` và
      // `/api/stock-photos` đã dùng. KHÔNG tự viết bộ lọc URL thứ hai.
      const check = isFetchableImageUrl(url);
      if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 400 });
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(check.url, { headers: { 'User-Agent': UA }, signal: ctrl.signal });
        if (!res.ok)
          return NextResponse.json({ error: `Không tải được tệp (HTTP ${res.status}).` }, { status: 400 });
        const ab = await res.arrayBuffer();
        if (ab.byteLength > PROJECT_FILE_MAX_BYTES)
          return NextResponse.json({ error: 'File quá 25MB.' }, { status: 413 });
        buf = Buffer.from(ab);
      } catch {
        return NextResponse.json({ error: 'Không kết nối được tới URL.' }, { status: 400 });
      } finally {
        clearTimeout(t);
      }
    }

    // ── ghi đĩa (sniff MIME thật ở trong) ─────────────────────────────────────────────────────
    const luu = await luuProjectFile(buf);
    if (!luu.ok) return NextResponse.json({ error: luu.error }, { status: luu.status });

    const row = await prisma.projectFile.create({
      data: {
        projectId,
        name: name.slice(0, 200),
        mime: luu.mime,
        path: luu.path,
        contentHash: luu.contentHash,
        uploadedBy: user.id,
        lastEditedBy: user.id,
      },
      select: FILE_SELECT,
    });
    return NextResponse.json({ file: row });
  } catch (e) {
    return loiJson(e, 'POST');
  }
}

/** GET ?projectId= — list tệp thô CÒN SỐNG. Vai 'viewer' là đủ (chỉ đọc). */
export async function GET(req: Request) {
  try {
    return await getHandler(req);
  } catch (e) {
    return loiJson(e, 'GET');
  }
}

async function getHandler(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const thieu = kiemDelegate('project-files');
  if (thieu) return thieu;

  const projectId = new URL(req.url).searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'Cần ?projectId=.' }, { status: 400 });

  try {
    await assertProjectAccess(user.id, projectId, 'viewer');
    const files = await prisma.projectFile.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { uploadedAt: 'desc' },
      select: FILE_SELECT,
    });
    return NextResponse.json({ files });
  } catch (e) {
    return loiJson(e, 'GET');
  }
}
