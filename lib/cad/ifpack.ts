'use client';

/**
 * lib/cad/ifpack.ts — T4 (VIỆC 5, 28/07): backup ".ifpack" — 1 file ZIP gói TOÀN BỘ 1 dự án CAD
 * (bản vẽ .idf + ảnh markup hiện trường) để tải về/khôi phục. Khác `.idf` (chỉ bản vẽ, ảnh vẫn
 * kẹt base64 bên trong JSON) ở chỗ ảnh được RÚT ra file riêng trong assets/ — nhẹ hơn (base64
 * nặng hơn binary gốc ~33%) và đúng tinh thần "gói cả dự án", không chỉ bản vẽ.
 *
 * Cấu trúc:
 *   /project.json    — metadata: id, tên, ngày, packVersion.
 *   /drawing.idf      — exportIdf() của TẤT CẢ sheet; Doc.photos[].src (markup hiện trường) đã
 *                        đổi từ data URL sang đường dẫn tương đối "assets/photo-N.<ext>".
 *   /assets/photo-N.* — từng ảnh markup, decode lại thành binary thật (không còn base64 lồng JSON).
 *   /manifest.json    — { files: [{ path, bytes, sha256 }] } — kiểm toàn vẹn lúc phục hồi.
 *
 * PHẠM VI ẢNH — cố ý bỏ "ảnh library thuộc dự án" khỏi bản này: `LibraryAsset` (Prisma) không có
 * cột `projectId` — thư viện dùng CHUNG mọi dự án (xem CLAUDE.md, Brand Kit mới là thứ theo TỪNG
 * dự án, Library thì không) — không có cách xác định "ảnh library nào thuộc dự án X" từ schema
 * hiện có. assets/ ở đây = ảnh THẬT gắn với chính dự án (markup hiện trường trong .idf), không
 * kéo thêm dữ liệu ngoài phạm vi CAD project. Ghi rõ trong báo cáo cuối theo yêu cầu "gặp mơ hồ
 * ghi lại, không dừng hỏi".
 *
 * Dùng jszip — đã có sẵn trong cây phụ thuộc (lib/pptx-zip-fonts.ts dùng cùng gói), không thêm mới.
 */

import { exportIdf, importIdf, type IdfSheetData } from './idf';

export const IFPACK_VERSION = 1 as const;

export interface IfpackProjectMeta {
  id: string;
  name: string;
  date: string; // ISO 8601
  packVersion: number;
}

export interface IfpackManifestEntry {
  path: string;
  bytes: number;
  sha256: string;
}

export interface IfpackManifest {
  files: IfpackManifestEntry[];
}

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** "data:image/png;base64,...." → { mime, bytes }. null nếu không phải data URL base64 hợp lệ. */
function decodeDataUrl(src: string): { mime: string; bytes: Uint8Array } | null {
  const m = /^data:([^;]+);base64,(.+)$/.exec(src);
  if (!m) return null;
  try {
    const bin = atob(m[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { mime: m[1], bytes };
  } catch {
    return null;
  }
}

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

/**
 * Dựng file .ifpack (Blob) từ bộ sheet CAD + metadata dự án. Ảnh markup hiện trường (data URL)
 * được rút ra `assets/`, KHÔNG mutate mảng `sheets` truyền vào (clone trước khi đổi `src`).
 */
export async function buildIfpack(
  sheets: IdfSheetData[],
  project: { id: string; name: string },
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const assets = zip.folder('assets')!;

  let assetSeq = 0;
  const sheetsForPack: IdfSheetData[] = sheets.map((s) => ({
    ...s,
    doc: {
      ...s.doc,
      photos: (s.doc.photos ?? []).map((p) => {
        const decoded = decodeDataUrl(p.src);
        if (!decoded) return p; // không phải data URL — giữ nguyên, không rõ cách rút
        assetSeq += 1;
        const ext = EXT_BY_MIME[decoded.mime] ?? 'bin';
        const fileName = `photo-${assetSeq}.${ext}`;
        assets.file(fileName, decoded.bytes);
        return { ...p, src: `assets/${fileName}` };
      }),
    },
  }));

  const drawingIdf = exportIdf(sheetsForPack, { projectName: project.name });
  const projectJson = JSON.stringify({
    id: project.id,
    name: project.name,
    date: new Date().toISOString(),
    packVersion: IFPACK_VERSION,
  } satisfies IfpackProjectMeta);

  zip.file('project.json', projectJson);
  zip.file('drawing.idf', drawingIdf);

  // Manifest — hash TỪNG file đã có trong zip lúc này (project.json/drawing.idf/assets/*),
  // SAU KHI mọi nội dung đã chốt.
  const entries: IfpackManifestEntry[] = [];
  const files = Object.values(zip.files).filter((f) => !f.dir);
  for (const f of files) {
    const buf = await f.async('arraybuffer');
    entries.push({ path: f.name, bytes: buf.byteLength, sha256: await sha256Hex(buf) });
  }
  zip.file('manifest.json', JSON.stringify({ files: entries } satisfies IfpackManifest));

  return zip.generateAsync({ type: 'blob' });
}

export interface RestoredIfpack {
  meta: IfpackProjectMeta;
  sheets: IdfSheetData[];
  /** cảnh báo toàn vẹn (hash lệch/file thiếu) — KHÔNG chặn phục hồi, chỉ để UI báo user biết. */
  integrityWarnings: string[];
}

/**
 * Đọc .ifpack (ArrayBuffer) → { meta, sheets, integrityWarnings }. Kiểm hash so với
 * manifest.json (không chặn phục hồi — chỉ liệt kê cảnh báo, ưu tiên phục hồi được còn hơn từ
 * chối). `null` nếu thiếu project.json/drawing.idf, drawing.idf không parse được (kể cả sau khi
 * importIdf() đã thử migrate — VIỆC 4), hoặc file KHÔNG PHẢI ZIP hợp lệ (`JSZip.loadAsync` tự nó
 * throw trên ZIP vỡ cấu trúc — bọc try/catch để giữ đúng nguyên tắc "KHÔNG throw" của importIdf,
 * an toàn gọi trực tiếp từ UI).
 */
export async function restoreIfpack(zipData: ArrayBuffer): Promise<RestoredIfpack | null> {
  const JSZip = (await import('jszip')).default;
  let zip: InstanceType<typeof JSZip>;
  try {
    zip = await JSZip.loadAsync(zipData);
  } catch {
    return null;
  }

  const projectFile = zip.file('project.json');
  const drawingFile = zip.file('drawing.idf');
  if (!projectFile || !drawingFile) return null;

  let meta: IfpackProjectMeta;
  try {
    meta = JSON.parse(await projectFile.async('string')) as IfpackProjectMeta;
  } catch {
    return null;
  }
  const drawingJson = await drawingFile.async('string');

  const integrityWarnings: string[] = [];
  const manifestFile = zip.file('manifest.json');
  if (manifestFile) {
    try {
      const manifest = JSON.parse(await manifestFile.async('string')) as IfpackManifest;
      for (const entry of manifest.files) {
        const f = zip.file(entry.path);
        if (!f) {
          integrityWarnings.push(`Thiếu file "${entry.path}" so với manifest.`);
          continue;
        }
        const buf = await f.async('arraybuffer');
        const hash = await sha256Hex(buf);
        if (hash !== entry.sha256) integrityWarnings.push(`File "${entry.path}" đổi khác lúc xuất (hash lệch).`);
      }
    } catch {
      integrityWarnings.push('manifest.json hỏng — bỏ qua kiểm toàn vẹn.');
    }
  } else {
    integrityWarnings.push('Không có manifest.json — bỏ qua kiểm toàn vẹn.');
  }

  const parsed = importIdf(drawingJson);
  if (!parsed) return null;

  // Đưa ảnh assets/ trở lại data URL (đảo ngược buildIfpack) — sheet phục hồi dùng được ngay,
  // không phụ thuộc file rời (đường dẫn tương đối vô nghĩa sau khi đóng .ifpack lại).
  const sheets: IdfSheetData[] = [];
  for (const s of parsed.sheets) {
    const photos = s.doc.photos ?? [];
    const relinked = await Promise.all(
      photos.map(async (p) => {
        if (!p.src.startsWith('assets/')) return p;
        const f = zip.file(p.src);
        if (!f) return p; // asset thiếu — giữ path cũ, integrityWarnings đã báo ở trên
        const b64 = await f.async('base64');
        const ext = p.src.split('.').pop() ?? 'png';
        const mime = MIME_BY_EXT[ext] ?? 'application/octet-stream';
        return { ...p, src: `data:${mime};base64,${b64}` };
      }),
    );
    sheets.push({ ...s, doc: { ...s.doc, photos: relinked } });
  }

  return { meta, sheets, integrityWarnings };
}
