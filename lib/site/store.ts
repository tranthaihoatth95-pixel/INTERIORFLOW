/**
 * lib/site/store.ts — LƯU HỒ SƠ ĐỊA ĐIỂM. SERVER ONLY (`fs/promises`).
 *
 * [Đ2] ĐI THEO KHUÔN ĐÃ CÓ, KHÔNG ĐẺ CƠ CHẾ MỚI: JSON-per-project, đúng pattern
 * `lib/dna/store.ts` (`uploads/dna/<projectId>/cards.json`) và notebook/comments đang dùng.
 *
 * ⚠️ VÌ SAO CHƯA VÀO PRISMA: `prisma migrate`/`db push` KHÔNG chạy được qua sandbox (luật vận
 * hành #1 — FUSE không khoá được file POSIX) và ghi DB trong phiên này đang bị chặn. Đẩy schema
 * mà không migrate được thì có bảng trên giấy, không có chỗ lưu thật. Khuôn JSON cho **persistence
 * THẬT ngay hôm nay**, và khi Hoà chạy migration thì đây là một hàm đọc/ghi để đổi, không phải
 * rải rác khắp UI. Đường di trú: đọc JSON → ghi bảng, giữ JSON làm bản lùi.
 *
 * Phần THUẦN (`giaiMa`) tách riêng để test không cần đĩa.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { hoSoRong, type HoSoDiaDiem } from './types';

const GOC = path.join(process.cwd(), 'uploads', 'site');
const tepCua = (duAnId: string) => path.join(GOC, duAnId, 'ho-so.json');

/** THUẦN — parse nội dung tệp. Tệp hỏng KHÔNG được kéo sập dự án: rơi về hồ sơ rỗng. */
export function giaiMa(raw: string, duAnId: string, luc: string): HoSoDiaDiem {
  if (!raw.trim()) return hoSoRong(duAnId, luc);
  try {
    const p = JSON.parse(raw) as Partial<HoSoDiaDiem>;
    if (!p || typeof p !== 'object' || !p.viTri || !p.huong) return hoSoRong(duAnId, luc);
    return {
      ...hoSoRong(duAnId, luc),
      ...p,
      // `duAnId` LUÔN lấy từ đường dẫn, không tin nội dung tệp — chống một tệp bị chép nhầm
      // sang thư mục khác rồi tự nhận là dự án cũ.
      duAnId,
    } as HoSoDiaDiem;
  } catch {
    return hoSoRong(duAnId, luc);
  }
}

export async function docHoSo(duAnId: string, luc = new Date().toISOString()): Promise<HoSoDiaDiem> {
  try {
    return giaiMa(await fs.readFile(tepCua(duAnId), 'utf8'), duAnId, luc);
  } catch {
    return hoSoRong(duAnId, luc);
  }
}

export async function ghiHoSo(duAnId: string, hoSo: HoSoDiaDiem): Promise<HoSoDiaDiem> {
  const ra: HoSoDiaDiem = { ...hoSo, duAnId, suaLuc: new Date().toISOString() };
  await fs.mkdir(path.dirname(tepCua(duAnId)), { recursive: true });
  await fs.writeFile(tepCua(duAnId), JSON.stringify(ra, null, 2), 'utf8');
  return ra;
}
