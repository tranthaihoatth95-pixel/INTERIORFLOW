/**
 * lib/review/gopy/index.ts — LỚP GÓP Ý (AI, chạy máy qua ollama) — ĐỢT NÀY CHƯA BẬT, và đây
 * không phải thiếu sót mà là CHỐT CÓ LÝ DO (phiếu p3 VIỆC 3 + cuối lượt):
 *
 * ⚠️ CHẶN THẬT, ĐO ĐƯỢC: góp ý về concept CHỈ có nghĩa khi có ĐỀ BÀI ĐÃ GHI. Đo 07/08:
 *  - `docs/SPEC-BRIEF-INTAKE.md` mô tả luồng brief thật (PDF → phiếu có cấu trúc) — CHƯA CODE.
 *  - Chỗ "lưu đề bài" duy nhất hôm nay là DRAFT CACHE cục bộ của `components/cad/AiBriefPanel.tsx`
 *    (`draftCache.brief` + lịch sử lượt dùng, localStorage) — cache phiên soạn thảo, KHÔNG phải
 *    đề bài chính thức của dự án (không sống trong Doc/DB, đổi máy là mất).
 *  ⇒ KHÔNG có đề bài thì AI sẽ TỰ BỊA một concept rồi chấm theo nó — đó là nhiễu, không phải
 *    góp ý. Nên lớp này trả `gopyBiChan` với lý do, KHÔNG gọi model, KHÔNG bịa.
 *
 * Khi màn đề bài có chỗ lưu chính thức (phiếu sau), phần chạy model cắm vào đây — hợp đồng
 * kết quả ĐÃ KHOÁ bằng `FindingGopy` (types.ts): không field điểm số · không mức đỏ/vàng ·
 * không cờ chặn · xu hướng bắt buộc `nguonCongKhai` (đợt đầu cấm hẳn).
 */

import type { FindingGopy, ReviewChang } from '../types';

export interface GopyKetQua {
  findings: FindingGopy[];
  /** Lý do lớp góp ý không chạy — UI hiện đúng câu này ở phần GỢI Ý thay vì im lặng. */
  biChan?: string;
}

/** Đề bài chính thức của dự án — nguồn DUY NHẤT lớp góp ý được phép dựa vào. Hôm nay chưa có
 * chỗ lưu (xem docstring đầu file) nên nơi gọi không có gì để truyền ⇒ luôn bị chặn. */
export interface DeBaiDaGhi {
  vanBan: string;
  /** nơi lưu — để truy vết (vd 'doc' khi Doc có field đề bài sau này). */
  nguon: string;
}

export function gopy(_chang: ReviewChang, deBai: DeBaiDaGhi | null): GopyKetQua {
  if (!deBai || !deBai.vanBan.trim()) {
    return {
      findings: [],
      biChan:
        'Chưa có đề bài đã ghi cho dự án — góp ý concept cần đề bài làm mốc, không có thì máy sẽ tự bịa một concept rồi chấm theo nó. Ghi đề bài ở màn "Nhận đề bài" (đang chờ code, SPEC-BRIEF-INTAKE).',
    };
  }
  // Phần gọi model (ollama) cắm ở đây trong phiếu sau — khi có đề bài thật để làm mốc.
  return { findings: [], biChan: 'Lớp góp ý chưa bật trong đợt này (phiếu sau).' };
}
