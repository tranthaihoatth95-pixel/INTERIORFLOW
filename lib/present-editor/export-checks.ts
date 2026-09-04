/**
 * lib/present-editor/export-checks.ts — cổng CHUAN_DAU_RA cho ĐƯỜNG XUẤT DECK (PDF · PPTX).
 *
 * VÌ SAO CÓ FILE NÀY (bằng chứng phủ định, luật NO-REBUILD §B25 — REUSE → CONNECT → EXTEND → NEW):
 *   · REUSE thẳng KHÔNG được: `buildChuanDauRaChecks()` ở `lib/print/export-checks.ts` nhận
 *     `Doc` của CAD (entities · layers · khổ giấy). Deck là `EditorDeck` (slides · elements) —
 *     hai mô hình dữ liệu khác hẳn, không ép được vào cùng một chữ ký hàm.
 *   · Nhét hàm deck VÀO `lib/print/export-checks.ts` thì file đó phải import
 *     `lib/present-editor/model` — kéo trọn model Present vào gói xuất PDF của CAD
 *     (`components/print/ExportPdfDialog.tsx`), tức thêm phụ thuộc chéo cho một việc thuần kiểm.
 *   ⇒ CONNECT, KHÔNG phải NEW: file này KHÔNG đẻ khái niệm mới. Nó dùng LẠI đúng hợp đồng đã có
 *     — `ChuanDauRaFinding` (mức · thông điệp · cách sửa) và marker `CHUAN_DAU_RA` — chỉ thêm
 *     một bộ kiểm hình dạng-deck. Một cỗ máy, hai mặt tiền: CAD một mặt, Deck một mặt.
 *
 * THI HÀNH: `docs/CHUAN-DAU-RA-NGHE.md` §4 ("0 placeholder sót: {{ }} · lorem · Untitled") + §6.1
 * (máy chặn lúc xuất, marker `CHUAN_DAU_RA`) — mục "placeholder sót" §6.1 nêu nay có mặt cho deck.
 *
 * KHÔNG chặn tuyệt đối và KHÔNG tự xoá nội dung người dùng: hàm CHỈ trả phát hiện kèm cách sửa,
 * người xuất quyết (human-in-the-loop — `TRIET-LY-IF.md` [T5] con-người-quyết-cuối). Cùng kỷ luật
 * với `lib/cad/standards/checker.ts`: đọc và đề xuất, không bao giờ tự sửa entity.
 *
 * Hàm thuần, không DOM — `export-checks.test.ts` chạy thẳng.
 */

import type { EditorDeck, EditorSlide, SlideElement } from './model';
import { DEFAULT_TEXT_CONTENT } from './model';
import { type ChuanDauRaFinding, CHUAN_DAU_RA } from '../print/export-checks';

export { CHUAN_DAU_RA };
export type { ChuanDauRaFinding };

/**
 * Element có thật sự IN RA không. Cùng định nghĩa "nhìn thấy được" với `layout-check.ts`
 * (`!hidden && opacity > 0.02`) — ô chữ đã ẩn thì không lọt vào file giao khách, báo là báo oan.
 */
function inRa(el: SlideElement): boolean {
  return !el.hidden && (el.opacity ?? 1) > 0.02;
}

/**
 * Ô chữ CHƯA AI SỬA — nội dung còn đúng y giá trị mặc định của `makeText()`.
 *
 * Đọc `DEFAULT_TEXT_CONTENT` từ chính `model.ts` (MỘT NGUỒN), KHÔNG khoá cứng chuỗi: đổi chữ
 * mặc định sau này thì luật đổi theo — không có đường nào để luật chết âm thầm.
 */
function conNguyenMacDinh(el: SlideElement): boolean {
  return el.kind === 'text' && inRa(el) && el.text.trim() === DEFAULT_TEXT_CONTENT.trim();
}

/** Số ô chữ chưa sửa trên MỘT slide — dùng lại được cho Inspector/panel nếu cần. */
export function demOChuChuaSua(slide: EditorSlide): number {
  return slide.elements.filter(conNguyenMacDinh).length;
}

/**
 * Bộ kiểm chuẩn đầu ra cho deck. Trả `[]` khi sạch (khớp giao kèo của bản CAD).
 *
 * Mức `'error'` = ĐỎ, KHÔNG phải chặn — đúng quy ước đang chạy ở `ExportPdfDialog` (level chỉ
 * đổi màu `--danger` ↔ `--warn`, nút xuất không bị khoá). Placeholder lọt vào hồ sơ giao khách
 * là lỗi thật nên để đỏ, nhưng quyền xuất vẫn thuộc người dùng.
 */
export function buildDeckChuanDauRaChecks(deck: EditorDeck): ChuanDauRaFinding[] {
  const findings: ChuanDauRaFinding[] = [];
  const slides = deck.slides ?? [];

  // ① Ô chữ còn nội dung mẫu — CHUAN-DAU-RA-NGHE §4 "0 placeholder sót".
  //    Gộp theo TRANG: người sửa cần biết mở trang nào, không cần danh sách id máy.
  for (let i = 0; i < slides.length; i++) {
    const soO = demOChuChuaSua(slides[i]);
    if (soO === 0) continue;
    const trang = i + 1;
    findings.push({
      level: 'error',
      // ≤12 từ, hành động trước, không jargon nội bộ (SPEC-NGON-NGU-CHI-DAN).
      message: `Trang ${trang}: ${soO} ô chữ còn nội dung mẫu`,
      fix: `Mở trang ${trang}, nhập nội dung hoặc xoá ô chữ đó`,
    });
  }

  return findings;
}

/** Có phát hiện nào không — cho đường xuất hỏi nhanh mà khỏi tự đọc mảng. */
export function deckCoLoiChuanDauRa(deck: EditorDeck): boolean {
  return buildDeckChuanDauRaChecks(deck).length > 0;
}
