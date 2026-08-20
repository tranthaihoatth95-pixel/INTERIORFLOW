/**
 * app/api/manufacturer-import/_lib/goi.ts — dựng PHIẾU ỨNG VIÊN từ một gói tệp CÓ THẬT trong dự án.
 *
 * Việc duy nhất của tầng này: đi lấy **sự thật ở phía máy chủ** (bản ghi `ProjectFile` + chữ trong
 * PDF) rồi giao cho lớp thuần `lib/capabilities/manufacturer-import.ts` dựng phiếu. Không quyết
 * định gì, không ghi gì.
 *
 * ⛔ KHÔNG tin id client gửi: tra lại `ProjectFile`, lọc `deletedAt: null` **và** đúng `projectId`.
 * ⛔ KHÔNG tải gì từ mạng. Gói = tệp người dùng đã tự nạp bằng cửa Files sẵn có.
 */
import { readFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/server/db';
import { dungPhieuUngVien, type KhaiTay, type PhieuUngVien, type TepGoi } from '@/lib/capabilities/manufacturer-import';

/** Cùng thư mục với mọi cửa ghi tệp đang chạy — không đẻ kho thứ hai. */
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/** Trần chữ đọc từ tài liệu — đủ cho trang thông số, không nuốt cả catalogue 300 trang vào RAM. */
export const TRAN_CHU_TAI_LIEU = 20_000;

/**
 * Trích chữ từ PDF bằng `unpdf` (đã có sẵn trong `package.json`, đang chạy thật ở
 * `lib/present-editor/pdf-import.ts` — KHÔNG thêm dep). Nạp ĐỘNG + try/catch: PDF hỏng hoặc
 * `unpdf` trượt thì phiếu nghèo chữ đi, **không được làm hỏng cả thao tác lập gói**.
 * `null` = không đọc được (và caller phải nói ra, không nuốt).
 */
export async function trichChuPdf(buf: Buffer): Promise<string | null> {
  try {
    const { extractText, getDocumentProxy } = await import('unpdf');
    // `.slice()` — unpdf/pdf.js CHUYỂN QUYỀN SỞ HỮU buffer sang worker (detach). Cùng bài học
    // `ownedCopy` đã trả giá ở `pdf-import.ts:737`.
    const data = new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    const pdf = await getDocumentProxy(data);
    const { text } = await extractText(pdf, { mergePages: true });
    const s = Array.isArray(text) ? text.join('\n') : String(text ?? '');
    return s.slice(0, TRAN_CHU_TAI_LIEU);
  } catch {
    return null;
  }
}

export interface KetQuaGoi {
  phieu: PhieuUngVien;
  /** id client gửi mà máy chủ KHÔNG tìm thấy (hoặc thuộc dự án khác) — khai thẳng, không im lặng. */
  tepKhongThay: string[];
}

export async function dungPhieuTuDuAn(i: {
  projectId: string;
  projectFileIds: string[];
  khai?: KhaiTay;
}): Promise<KetQuaGoi> {
  const rows = await prisma.projectFile.findMany({
    where: { id: { in: i.projectFileIds }, projectId: i.projectId, deletedAt: null },
    select: { id: true, name: true, mime: true, path: true },
  });
  const thay = new Map(rows.map((r) => [r.id, r]));
  const tepKhongThay = i.projectFileIds.filter((id) => !thay.has(id));

  // Giữ ĐÚNG thứ tự người dùng chọn — tệp đầu là tệp chính khi không có ảnh nào.
  const tep: TepGoi[] = i.projectFileIds
    .map((id) => thay.get(id))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) => ({ projectFileId: r.id, name: r.name, mime: r.mime }));

  const doan: string[] = [];
  const loiDoc: string[] = [];
  for (const r of rows) {
    if (r.mime !== 'application/pdf') continue;
    let buf: Buffer;
    try {
      buf = await readFile(path.join(UPLOAD_DIR, r.path));
    } catch {
      loiDoc.push(`Tệp "${r.name}" không còn trên đĩa — không đọc được chữ.`);
      continue;
    }
    const chu = await trichChuPdf(buf);
    if (chu === null) loiDoc.push(`Không trích được chữ từ "${r.name}" (PDF ảnh quét hoặc hỏng) — các ô phải gõ tay.`);
    else doan.push(chu);
  }

  const phieu = dungPhieuUngVien({
    tep,
    khai: i.khai,
    chuTaiLieu: doan.join('\n').slice(0, TRAN_CHU_TAI_LIEU) || undefined,
  });

  return {
    phieu: { ...phieu, canhBao: [...phieu.canhBao, ...loiDoc] },
    tepKhongThay,
  };
}
